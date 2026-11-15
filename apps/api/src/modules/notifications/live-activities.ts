/**
 * Activités en direct iOS (docs/WIDGETS.md, spéc §19) : jetons APNs et événements.
 * - Série d'un lien (`link`) : démarrée PAR PUSH avec le rappel du soir « à toi d'écrire » (jeton push-to-start),
 *   terminée quand la personne écrit dans ce lien (« C'est fait », série à jour) ou à minuit (heure locale).
 * - Défi du jour : jamais démarré par push (l'app le démarre quand le défi est accepté) ; seulement `update` (série en
 *   danger, le soir) et `end` (défi relevé, ou minuit).
 * Chaque jeton refusé par APNs (410, BadDeviceToken) est désactivé ; un jeton d'activité terminée est oublié.
 * Rien ne lève : une activité en direct ne fait jamais échouer une action.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { LiveActivityState, RegisterDeviceBody } from '@blowy/contract';
import { auditText } from '@blowy/content';
import { nextLocalHour } from '@blowy/domain';
import { LIVE_ACTIVITIES, type LiveActivityPayload, type LiveActivityPusher, liveEndPayload, liveStartPayload, liveUpdatePayload, unixSeconds } from '../../integrations/push/live-activity';
import type { Clock } from '../../shared/clock';
import { CLOCK, PETS, PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import type { PetsRepository } from '../pets/ports';
import { NotificationSettings } from './notification-settings';
import { LIVE_ACTIVITY_TOKENS, type LiveActivityTokenRecord, type LiveActivityTokensRepository } from './ports';

/**
 * Durée maximale d'une activité en direct (HIG d'Apple : « don't exceed eight hours ») : le défi du jour et la série
 * d'un lien finissent à minuit ou au bout de 8 h, au premier des deux.
 */
const MAX_ACTIVITY_MS = 8 * 3_600_000;
/** État final laissé à l'écran : 15 min pour un défi relevé, 10 min pour un lien où tu as écrit (comme l'app). */
const CHALLENGE_DONE_MS = 15 * 60_000;
const LINK_DONE_MS = 10 * 60_000;
const BATCH = 100;

@Injectable()
export class LiveActivities {
  private readonly logger = new Logger('ActivitésEnDirect');

  constructor(
    @Inject(LIVE_ACTIVITY_TOKENS) private readonly tokens: LiveActivityTokensRepository,
    @Inject(LIVE_ACTIVITIES) private readonly pusher: LiveActivityPusher,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(PROFILES) private readonly profiles: ProfilesRepository | null = null,
  ) {}

  /** Range un jeton envoyé par l'app (`POST /v1/devices` avec `kind: 'apns_live_activity'`). */
  async register(userId: string, body: Pick<RegisterDeviceBody, 'token' | 'liveActivity'>, timeZone: string): Promise<void> {
    const now = this.clock.now();
    const la = body.liveActivity;
    const use = la?.use ?? 'start';
    const activity = use === 'update' ? (la?.activity ?? null) : null;
    if (use === 'update' && !activity) return; // jeton de mise à jour sans activité : inutilisable
    await this.tokens.upsert({
      token: body.token,
      userId,
      use,
      activity,
      activityId: use === 'update' ? (la?.activityId ?? null) : null,
      linkId: activity === 'link' ? (la?.linkId ?? null) : null,
      // Minuit local ou 8 h (limite d'Apple), au premier des deux ; la sortie, 8 h.
      endsAt: activity === null ? null : activity === 'outing' ? new Date(now.getTime() + MAX_ACTIVITY_MS).toISOString() : capped(now, nextLocalHour(now, timeZone, 0)).toISOString(),
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
    });
  }

  async remove(userId: string, token: string): Promise<void> {
    await this.tokens.removeForUser(token, userId);
  }

  /**
   * « Série avec Léa : à toi d'écrire avant minuit » : démarre l'activité du lien sur les appareils de la personne
   * (avec l'alerte du rappel). Vrai si un appareil l'a reçue.
   */
  async startLinkStreak(userId: string, input: { linkId: string; otherName: string; streak: number; alert: { title: string; body: string } }): Promise<boolean> {
    if (!this.pusher.enabled) return false;
    try {
      const starts = await this.tokens.forUser(userId, { use: 'start' });
      if (starts.length === 0) return false;
      const [pet, endsAt, profile] = await Promise.all([this.pets.findByOwner(userId), this.midnight(userId), this.profiles?.findById(userId) ?? null]);
      const now = this.clock.now();
      // Écran verrouillé, visible de tous : jamais le prénom de l'autre (HIG « Avoid displaying sensitive information »,
      // app de rencontre). Ni dans les attributs (pas d'`otherName`), ni dans l'alerte : un texte neutre ; le prénom
      // reste dans l'app.
      const neutral = auditText.in(profile?.locale ?? 'fr').lockScreen;
      const payload = liveStartPayload({
        now,
        attributes: { kind: 'link', pet: { name: pet?.name ?? '', species: pet?.species ?? 'nino' }, startedAt: unixSeconds(now), url: `blowy://link/${input.linkId}` },
        state: { endsAt, streak: Math.max(0, Math.trunc(input.streak)), title: null, done: false },
        alert: { title: neutral.linkTitle, body: neutral.linkBody },
        relevance: 75,
      });
      return (await this.deliver(starts, payload, 10)) > 0;
    } catch (err) {
      this.logger.warn(`activité du lien non démarrée : ${err instanceof Error ? err.message : 'erreur'}`);
      return false;
    }
  }

  /**
   * La personne vient d'écrire dans ce lien (premier message du jour) : son activité « à toi d'écrire » de ce lien montre
   * « C'est fait » avec la série à jour, puis se retire. Sans `linkId` connu sur le jeton : toutes ses activités `link`.
   */
  async endLinkStreak(userId: string, linkId: string, streak: number): Promise<void> {
    await this.safely('fin de l’activité du lien', async () => {
      const all = await this.tokens.forUser(userId, { use: 'update', activity: 'link' });
      const mine = all.filter((t) => t.linkId === linkId || t.linkId === null);
      if (mine.length === 0) return;
      const now = this.clock.now();
      const state: LiveActivityState = { endsAt: await this.midnight(userId), streak: Math.max(0, streak), title: null, done: true };
      await this.deliver(mine, liveEndPayload({ now, state, dismissAt: new Date(now.getTime() + LINK_DONE_MS) }), 10);
      await this.tokens.remove(mine.map((t) => t.token));
    });
  }

  /** Défi du jour : mise à jour de l'activité démarrée par l'app (série en danger). Jamais de démarrage par push. */
  async updateChallenge(userId: string, input: { streak: number; title: string | null }): Promise<void> {
    await this.safely('mise à jour de l’activité du défi', async () => {
      const tokens = await this.tokens.forUser(userId, { use: 'update', activity: 'challenge' });
      if (tokens.length === 0) return;
      const state: LiveActivityState = { endsAt: await this.midnight(userId), streak: input.streak, title: input.title, done: false };
      await this.deliver(tokens, liveUpdatePayload({ now: this.clock.now(), state }), 10);
    });
  }

  /** Défi relevé : « Défi relevé » 15 min, puis l'activité se retire ; le jeton est oublié. */
  async endChallenge(userId: string, input: { streak: number; title: string | null }): Promise<void> {
    await this.safely('fin de l’activité du défi', async () => {
      const tokens = await this.tokens.forUser(userId, { use: 'update', activity: 'challenge' });
      if (tokens.length === 0) return;
      const now = this.clock.now();
      const state: LiveActivityState = { endsAt: await this.midnight(userId), streak: input.streak, title: input.title, done: true };
      await this.deliver(tokens, liveEndPayload({ now, state, dismissAt: new Date(now.getTime() + CHALLENGE_DONE_MS) }), 10);
      await this.tokens.remove(tokens.map((t) => t.token));
    });
  }

  /** Minuteur : activités arrivées à leur fin (minuit local, 8 h pour une sortie) terminées et retirées tout de suite. */
  async endExpired(now: Date, deadline: number): Promise<number> {
    let n = 0;
    for (let i = 0; i < 20 && Date.now() < deadline; i++) {
      const ended = await this.tokens.listEnded(now.toISOString(), BATCH);
      if (ended.length === 0) break;
      if (this.pusher.enabled) {
        for (const t of ended) {
          const endsAt = t.endsAt ? unixSeconds(t.endsAt) : unixSeconds(now);
          await this.deliver([t], liveEndPayload({ now, state: { endsAt, streak: 0, title: null, done: false }, dismissAt: now }), 5);
        }
      }
      await this.tokens.remove(ended.map((t) => t.token));
      n += ended.length;
      if (ended.length < BATCH) break;
    }
    await this.tokens.purgeDisabled(new Date(now.getTime() - 30 * 86_400_000).toISOString());
    return n;
  }

  /** Fin affichée d'une activité : minuit local, ou 8 h après maintenant si c'est plus tôt. */
  private async midnight(userId: string): Promise<number> {
    const s = await this.settings.resolve(userId);
    const now = this.clock.now();
    return unixSeconds(capped(now, nextLocalHour(now, s.timeZone, 0)));
  }

  /** Envoie à chaque jeton ; désactive les jetons morts. Rend le nombre d'envois acceptés. */
  private async deliver(tokens: readonly LiveActivityTokenRecord[], payload: LiveActivityPayload, priority: 5 | 10): Promise<number> {
    if (!this.pusher.enabled) return 0;
    let ok = 0;
    const dead: string[] = [];
    for (const t of tokens) {
      const r = await this.pusher.send({ token: t.token, payload, priority });
      if (r.ok) ok += 1;
      else if (r.invalidToken) dead.push(t.token);
    }
    if (dead.length > 0) await this.tokens.disable(dead, this.clock.now().toISOString());
    return ok;
  }

  private async safely(what: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (err) {
      this.logger.warn(`${what} : ${err instanceof Error ? err.message : 'erreur'}`);
    }
  }
}

/** Le premier de `end` et de `now` + 8 h. */
const capped = (now: Date, end: Date): Date => new Date(Math.min(end.getTime(), now.getTime() + MAX_ACTIVITY_MS));
