/**
 * Implémentation du port `Notifier` (docs/NOTIFICATIONS.md, règles dans `packages/domain/src/plateforme/notifications.ts`) :
 * destinataire suspendu ou personne concernée (`about`) invisible pour lui (bloquée, suspendue, supprimée : Audience) →
 * rien ; puis la décision du domaine (réglage, accord marketing, premier plan, fenêtre locale, une fois par jour,
 * regroupement des rafales, heures calmes, décroissance, plafonds, délai par conversation) ; puis le texte dans la langue
 * du profil, le lien profond, l'état compact des widgets et l'action « Ne plus recevoir » ; envoi par lots, jetons
 * invalides désactivés. `notify` ne lève jamais : un échec de push ne fait pas échouer l'action.
 *
 * Variables reconnues en plus du texte : `about` (identifiant de la personne concernée, jamais affiché), `linkId`,
 * `groupId` (conversation), `step` (variante), `expiresAt` (ISO, après quoi la notification n'a plus de sens).
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { PushData, WidgetState } from '@blowy/contract';
import { firstStepOf, notificationDigestText, notificationText } from '@blowy/content';
import {
  DEFERRED_MAX_HOURS,
  type FirstStepVariant,
  type NotificationHistoryEntry,
  type Locale,
  type NotificationKindKey,
  addDays,
  categoryOf,
  decideNotification,
  localTimeOf,
  mergeNotificationVars,
  nextLocalHour,
  pickDigestLead,
} from '@blowy/domain';
import type { NotificationKind, Notifier } from '../../integrations/push/notifier';
import { PUSHER, type PushMessage, type Pusher } from '../../integrations/push/pusher';
import type { Clock } from '../../shared/clock';
import { CLOCK, PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import type { RetentionRepository } from '../retention/ports';
import { RETENTION } from '../retention/ports';
import { Audience } from '../safety/application/audience';
import { LiveActivities } from './live-activities';
import { NotificationPresence } from './notification-presence';
import { NotificationSettings } from './notification-settings';
import {
  type DevicesRepository,
  NOTIFICATION_LOG,
  type NotificationLogRecord,
  type NotificationLogRepository,
  PUSH_DEVICES,
  PUSH_RECEIPTS,
  type PushDeviceRecord,
  type PushReceiptsRepository,
} from './ports';

/** Catégorie iOS/Android enregistrée par l'app : une action « Ne plus recevoir » (coupe la catégorie du type). */
export const MUTE_CATEGORY = 'minimoa_mute';
/** Message d'une personne : « Répondre » (champ de texte dans la notification) et « Ne plus recevoir ce genre ». */
export const REPLY_CATEGORY = 'minimoa_reply';

/** Les deux listes de types (contrat de l'interface et domaine) doivent rester identiques. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const kindsMatch: Same<NotificationKind, NotificationKindKey> = true;
void kindsMatch;

/**
 * Conversation (lien ou groupe) d'une notification : délai entre deux pushs, « une fois par jour » par lien, paquet
 * d'une rafale, conversation ouverte au premier plan. `your_turn` n'en a pas : un seul rappel par jour qui résume
 * tous les liens.
 */
export function conversationKey(
  kind: NotificationKind,
  vars: Readonly<Record<string, string>>,
): string | null {
  switch (kind) {
    case 'message':
    case 'link_in_danger':
      return vars.linkId ?? null;
    case 'group_message':
    case 'group_joined':
    case 'group_invite':
    case 'group_life_lost':
    case 'group_asleep':
      return vars.groupId ?? null;
    default:
      return null;
  }
}

/** Plusieurs personnes ou conversations dans un paquet. */
const grouped = (vars: Readonly<Record<string, string>>): boolean =>
  Number(vars.others) > 0 || vars.multi === '1';

/** Lien profond (routes expo-router de l'app) ; `vars.path` (commençant par « / ») le remplace. */
/** Où mène chaque premier pas (docs/FIDELISATION.md). */
const FIRST_STEP_LINK: Record<FirstStepVariant, string> = {
  people: 'blowy://rencontres',
  people_none: 'blowy://rencontres',
  words: 'blowy://mots',
  habit: 'blowy://pet/habitudes',
  group: 'blowy://groupe/nouveau',
  week: 'blowy://pet',
};

export function deepLink(kind: NotificationKind, vars: Readonly<Record<string, string>>): string {
  if (vars.path?.startsWith('/')) return `blowy:/${vars.path}`;
  switch (kind) {
    case 'message':
      return vars.linkId && !grouped(vars) ? `blowy://link/${vars.linkId}` : 'blowy://chats';
    case 'link_in_danger':
      return vars.linkId ? `blowy://link/${vars.linkId}` : 'blowy://chats';
    case 'your_turn':
      // Plusieurs liens attendent : la liste des chats ; un seul : son chat.
      return vars.linkId && !(Number(vars.more) > 0) ? `blowy://link/${vars.linkId}` : 'blowy://chats';
    case 'new_encounter':
      return vars.linkId && !grouped(vars) ? `blowy://link/${vars.linkId}` : 'blowy://chats';
    case 'waved':
      return 'blowy://rencontres';
    case 'item_unlocked':
      return 'blowy://pet/garde-robe';
    case 'words_received':
      // Le résultat des 3 mots (et le lien à renvoyer).
      return 'blowy://mots';
    case 'trial_reminder':
      return 'blowy://moi/blowy-plus';
    case 'group_invite':
    case 'group_message':
    case 'group_life_lost':
    case 'group_asleep':
    case 'group_joined':
      return vars.groupId ? `blowy://groupe/${vars.groupId}` : 'blowy://chats';
    case 'together_proposal':
      return vars.groupId ? `blowy://groupe/${vars.groupId}` : 'blowy://pet/habitudes';
    case 'first_steps':
      // J1 : les gens (Rencontres, qui dit aussi pourquoi personne et propose d'inviter) ; J2 : le lien « 3 mots » ;
      // J3 : les habitudes ; J5 : un groupe par lien ; J7 : l'accueil (le bilan de la semaine et la carte à partager).
      // Un ancien report (`d1`…) garde son ancien sujet (`firstStepOf`).
      return FIRST_STEP_LINK[firstStepOf(vars.step ?? '')];
    case 'plus_account':
      // L'au revoir mène au minimoa (rien à vendre) ; le reste à la feuille Minimoa+ (état, « Gérer mon abonnement »).
      return vars.step === 'goodbye' ? 'blowy://pet' : 'blowy://moi/blowy-plus';
    case 'daily_challenge':
    case 'streak_in_danger':
      // Ton chemin (docs/CHEMIN.md) : la séance du jour.
      return vars.step === 'chemin' ? 'blowy://chemin' : 'blowy://pet/defi';
    case 'habit_proof':
      return 'blowy://pet/habitudes';
    case 'weekly_review':
      return 'blowy://pet/bilans';
    case 'needs_out':
    case 'minimoa_news':
      return 'blowy://pet';
    case 'league':
      return 'blowy://moi/ligue';
  }
}

/** État compact pour les widgets et les activités en direct, quand le type s'y prête. */
export function widgetState(
  kind: NotificationKind,
  vars: Readonly<Record<string, string>>,
  endsAt: string,
): WidgetState | undefined {
  const num = (v: string | undefined): number | undefined =>
    v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined;
  switch (kind) {
    case 'daily_challenge':
    case 'streak_in_danger':
      return {
        challengePending: true,
        endsAt,
        ...(num(vars.count) !== undefined ? { streak: num(vars.count) } : {}),
      };
    case 'your_turn':
      return {
        writeTo: vars.name ?? '',
        endsAt,
        ...(num(vars.count) !== undefined ? { streak: num(vars.count) } : {}),
      };
    case 'link_in_danger':
      return num(vars.lives) !== undefined ? { livesLeft: num(vars.lives) } : undefined;
    default:
      return undefined;
  }
}

/** Push prêt à partir (décision prise, journal tenu, texte dans la langue du profil). */
interface ReadyPush {
  kind: NotificationKind;
  step: string | null;
  at: string;
  devices: readonly PushDeviceRecord[];
  content: Omit<PushMessage, 'to'>;
  locale: Locale;
  /** Activité en direct démarrée avec son alerte : rien d'autre à envoyer sur iOS. */
  liveStarted: boolean;
}

@Injectable()
export class PushNotifier implements Notifier {
  private readonly logger = new Logger('Push');

  constructor(
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(PUSH_DEVICES) private readonly devices: DevicesRepository,
    @Inject(NOTIFICATION_LOG) private readonly log: NotificationLogRepository,
    @Inject(PUSH_RECEIPTS) private readonly receipts: PushReceiptsRepository,
    @Inject(PUSHER) private readonly pusher: Pusher,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(LiveActivities) private readonly live: LiveActivities,
    @Inject(NotificationPresence) private readonly presence: NotificationPresence,
    @Optional() @Inject(RETENTION) private readonly activity: RetentionRepository | null = null,
  ) {}

  async notify(userId: string, kind: NotificationKind, vars: Record<string, string> = {}): Promise<void> {
    try {
      await this.process(userId, kind, vars, null);
    } catch (err) {
      this.logger.warn(
        `notification ${kind} non envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
      );
    }
  }

  /** Envoie un report dont l'heure est venue (minuteur). Rend vrai s'il est parti. */
  async flushDeferred(entry: NotificationLogRecord): Promise<boolean> {
    try {
      if (this.clock.now().getTime() - new Date(entry.createdAt).getTime() > DEFERRED_MAX_HOURS * 3_600_000) {
        await this.log.close(entry.id, 'dropped');
        return false;
      }
      return await this.process(entry.userId, entry.kind, entry.vars ?? {}, entry);
    } catch (err) {
      this.logger.warn(
        `report ${entry.kind} non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
      );
      await this.log.close(entry.id, 'dropped');
      return false;
    }
  }

  /**
   * Plusieurs reports d'une même personne arrivés à leur heure ensemble (fin des heures calmes surtout) : chacun passe
   * par les règles, puis un seul push part, celui du plus important avec « Et 2 autres nouvelles t'attendent ».
   * Rend le nombre de reports partis (dans le paquet).
   */
  async flushDigest(entries: readonly NotificationLogRecord[]): Promise<number> {
    const ready: ReadyPush[] = [];
    for (const entry of entries) {
      try {
        if (
          this.clock.now().getTime() - new Date(entry.createdAt).getTime() >
          DEFERRED_MAX_HOURS * 3_600_000
        ) {
          await this.log.close(entry.id, 'dropped');
          continue;
        }
        const r = await this.prepare(entry.userId, entry.kind, entry.vars ?? {}, entry);
        if (r) ready.push(r);
      } catch (err) {
        this.logger.warn(
          `report ${entry.kind} non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
        );
        await this.log.close(entry.id, 'dropped');
      }
    }
    const lead = ready[pickDigestLead(ready)];
    if (!lead) return 0;
    const others = ready.filter((r) => r !== lead).length;
    const text = notificationDigestText(
      lead.locale,
      { title: lead.content.title, body: lead.content.body },
      others,
    );
    try {
      await this.send({ ...lead, content: { ...lead.content, title: text.title, body: text.body } });
    } catch (err) {
      this.logger.warn(`paquet non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return 0;
    }
    return ready.length;
  }

  private async process(
    userId: string,
    kind: NotificationKind,
    input: Record<string, string>,
    queued: NotificationLogRecord | null,
  ): Promise<boolean> {
    const ready = await this.prepare(userId, kind, input, queued);
    return ready ? this.send(ready) : false;
  }

  private async send(ready: ReadyPush): Promise<boolean> {
    // Activité démarrée avec son alerte : pas de seconde notification sur iOS.
    const targets = ready.liveStarted ? ready.devices.filter((d) => d.platform !== 'ios') : ready.devices;
    return targets.length > 0 ? this.deliver(targets, ready.content) : ready.liveStarted;
  }

  /** Décision, journal, texte : rend le push prêt à partir, ou null (rien à envoyer : abandonné, reporté, regroupé). */
  private async prepare(
    userId: string,
    kind: NotificationKind,
    input: Record<string, string>,
    queued: NotificationLogRecord | null,
  ): Promise<ReadyPush | null> {
    const drop = async (): Promise<null> => {
      if (queued) await this.log.close(queued.id, 'dropped');
      return null;
    };
    const settings = await this.settings.resolve(userId);
    const devices = (await this.devices.forUser(userId)).filter((d) => d.kind === 'expo');
    // Compte suspendu : aucun push (Audience) ; un report en attente est abandonné.
    if (devices.length === 0 || !(await this.audience.canNotify(userId))) return drop();
    // Jamais une notification au sujet d'une personne bloquée (dans un sens ou l'autre), suspendue ou supprimée.
    const about = input.about;
    if (about && about !== userId && !(await this.audience.visibleIds(userId, [about], 'group')).has(about))
      return drop();

    const now = this.clock.now();
    const local = localTimeOf(now, settings.timeZone);
    const log = await this.log.forUserDays(userId, [
      addDays(local.day, -3),
      addDays(local.day, -2),
      addDays(local.day, -1),
      local.day,
    ]);
    // La clé d'une ligne est celle que la décision a donnée (`vars.key`), jamais le lien seul : un nouveau lien est
    // regroupé tous liens confondus (clé nulle), il ne doit pas être relu sous la clé de son lien.
    const keyOfRow = (l: NotificationLogRecord): string | null => l.vars?.key ?? null;
    const key = queued ? keyOfRow(queued) : conversationKey(kind, input);
    const { key: _bucket, ...vars } = input;
    void _bucket;
    const history: NotificationHistoryEntry[] = log
      .filter((l) => l.id !== queued?.id)
      .map((l) => ({
        id: l.id,
        kind: l.kind,
        key: keyOfRow(l),
        localDay: l.localDay,
        status: l.status,
        at: l.createdAt,
        sendAfter: l.sendAfter,
        link: l.linkId,
      }));
    const lastOpenAt = await this.lastOpenAt(userId, devices, now);
    const decision = decideNotification({
      kind,
      step: vars.step ?? null,
      key,
      enabled: !settings.disabledKinds.includes(kind),
      marketingOptIn: settings.marketingOptInAt !== null,
      now,
      timeZone: settings.timeZone,
      history,
      lastOpenAt,
      foreground: await this.presence.of(userId),
      expiresAt: vars.expiresAt ?? (kind === 'trial_reminder' ? (vars.endsOn ?? null) : null),
      fromQueue: queued !== null,
      link: vars.linkId ?? null,
    });

    const linkColumn =
      kind === 'message' || kind === 'link_in_danger' || kind === 'new_encounter'
        ? (vars.linkId ?? null)
        : null;
    if (decision.action === 'defer') {
      await this.log.add({
        userId,
        kind,
        linkId: linkColumn,
        localDay: local.day,
        status: 'deferred',
        sendAfter: decision.until.toISOString(),
        vars: { ...vars, ...(decision.bucket !== null ? { key: decision.bucket } : {}) },
        createdAt: now.toISOString(),
      });
      return null;
    }
    if (decision.action === 'merge') {
      const pending = log.find((l) => l.id === decision.into);
      const { key: bucket, ...prev } = pending?.vars ?? {};
      await this.log.merge(decision.into, {
        ...mergeNotificationVars(prev, vars),
        ...(bucket ? { key: bucket } : {}),
      });
      return null;
    }
    if (decision.action === 'skip') return drop();
    if (queued) {
      if (!(await this.log.close(queued.id, 'sent', { at: now.toISOString(), localDay: local.day })))
        return null; // déjà envoyé par un autre tick
    } else {
      await this.log.add({
        userId,
        kind,
        linkId: linkColumn,
        localDay: local.day,
        status: 'sent',
        sendAfter: null,
        vars: key ? { key } : null,
        createdAt: now.toISOString(),
      });
    }

    const profile = await this.profiles.findById(userId);
    const lang = profile?.locale ?? 'fr';
    const text = notificationText(lang, kind, vars);
    const endsAt = nextLocalHour(now, settings.timeZone, 0).toISOString();
    const state = widgetState(kind, vars, endsAt);
    const single = !grouped(vars);
    const data: PushData = {
      // `league` : inconnu des builds déjà servis ; ils suivent l'adresse (`url`).
      kind: kind === 'league' ? 'minimoa_news' : kind,
      url: deepLink(kind, vars),
      ...(vars.linkId && single ? { linkId: vars.linkId } : {}),
      ...(vars.groupId ? { groupId: vars.groupId } : {}),
      ...(state ? { state } : {}),
    };
    // Activités en direct (docs/WIDGETS.md) : seul « à toi d'écrire » démarre par push (série du lien mis en avant) ;
    // le défi du jour n'est jamais démarré ici (l'app le démarre quand il est accepté), la série en danger met à jour
    // son activité.
    let liveStarted = false;
    if (kind === 'your_turn' && vars.linkId) {
      liveStarted = await this.live.startLinkStreak(userId, {
        linkId: vars.linkId,
        otherName: vars.name ?? '',
        streak: Number(vars.count ?? 0) || 0,
        alert: text,
      });
    }
    if (kind === 'streak_in_danger')
      await this.live.updateChallenge(userId, {
        streak: Number(vars.streak ?? vars.count ?? 0) || 0,
        title: null,
      });
    const content: Omit<PushMessage, 'to'> = {
      title: text.title,
      body: text.body,
      data,
      ...(kind === 'message' && single && vars.linkId
        ? { categoryId: REPLY_CATEGORY }
        : kind !== 'league' && categoryOf(kind)
          ? { categoryId: MUTE_CATEGORY }
          : {}),
    };
    return {
      kind,
      step: vars.step ?? null,
      at: queued?.createdAt ?? now.toISOString(),
      devices,
      content,
      locale: lang,
      liveStarted,
    };
  }

  /**
   * Dernière ouverture : la plus récente entre l'appareil vu (chaque retour au premier plan) et le dernier jour
   * d'activité du compte (`profiles.last_active_on`, compté jusqu'à la fin de ce jour).
   */
  private async lastOpenAt(
    userId: string,
    devices: readonly PushDeviceRecord[],
    now: Date,
  ): Promise<string | null> {
    const seen =
      devices
        .map((d) => d.lastSeenAt)
        .sort()
        .at(-1) ?? null;
    const day = this.activity ? await this.activity.lastActiveOn(userId) : null;
    const dayEnd = day
      ? new Date(Math.min(now.getTime(), Date.parse(`${day}T23:59:59Z`))).toISOString()
      : null;
    return (
      [seen, dayEnd]
        .filter((x): x is string => x !== null)
        .sort()
        .at(-1) ?? null
    );
  }

  private async deliver(
    devices: readonly PushDeviceRecord[],
    content: Omit<PushMessage, 'to'>,
  ): Promise<boolean> {
    const messages: PushMessage[] = devices.map((d) => ({ ...content, to: d.token, sound: 'default' }));
    const tickets = await this.pusher.send(messages);
    const now = this.clock.now().toISOString();
    const invalid: string[] = [];
    const ok: { ticketId: string; token: string; createdAt: string }[] = [];
    tickets.forEach((t, i) => {
      const token = messages[i]?.to;
      if (!token) return;
      if (t.status === 'ok') ok.push({ ticketId: t.id, token, createdAt: now });
      else if (t.invalidToken) invalid.push(token);
    });
    if (invalid.length > 0) await this.devices.disable(invalid, now);
    if (ok.length > 0) await this.receipts.add(ok);
    return ok.length > 0;
  }
}
