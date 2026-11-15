/**
 * Implémentation du port `Notifier` (docs/V7-INTERFACES.md) : réglage par type → une fois par jour → heures calmes
 * (22 h – 8 h locales : report au matin ou abandon) → plafond (3 par jour hors messages) → délai entre messages ;
 * puis texte dans la langue du profil, données du lien profond et état compact pour les widgets, envoi par lots,
 * jetons invalides désactivés. `notify` ne lève jamais : un échec de push ne fait pas échouer l'action.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PushData, WidgetState } from '@blowy/contract';
import { notificationText } from '@blowy/content';
import { DEFERRED_MAX_HOURS, type NotificationKindKey, capExempt, decideNotification, localTimeOf, nextLocalHour } from '@blowy/domain';
import type { NotificationKind, Notifier } from '../../integrations/push/notifier';
import { PUSHER, type PushMessage, type Pusher } from '../../integrations/push/pusher';
import type { Clock } from '../../shared/clock';
import { CLOCK, PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import { Audience } from '../safety/application/audience';
import { LiveActivities } from './live-activities';
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

/** Les deux listes de types (contrat de l'interface et domaine) doivent rester identiques. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const kindsMatch: Same<NotificationKind, NotificationKindKey> = true;
void kindsMatch;

/** Types liés à un lien : « une fois par jour » et délai entre messages se comptent par lien. */
const PER_LINK: readonly NotificationKind[] = ['message', 'daily_photo', 'link_in_danger'];

/** Lien profond (routes expo-router de l'app) ; `vars.path` (commençant par « / ») le remplace. */
export function deepLink(kind: NotificationKind, vars: Readonly<Record<string, string>>): string {
  if (vars.path?.startsWith('/')) return `blowy:/${vars.path}`;
  switch (kind) {
    case 'message':
    case 'daily_photo':
    case 'link_in_danger':
      return vars.linkId ? `blowy://link/${vars.linkId}` : 'blowy://chats';
    case 'new_encounter':
      return vars.linkId ? `blowy://link/${vars.linkId}` : 'blowy://rencontres';
    case 'waved':
      return 'blowy://rencontres';
    case 'item_unlocked':
      return 'blowy://pet/garde-robe';
    case 'words_received':
      return 'blowy://pet/caractere';
    case 'trial_reminder':
      return 'blowy://moi/blowy-plus';
    case 'daily_challenge':
    case 'needs_out':
    case 'streak_in_danger':
    case 'habit_proof':
    case 'weekly_review':
      return 'blowy://pet';
  }
}

/** État compact pour les widgets et les activités en direct, quand le type s'y prête. */
export function widgetState(kind: NotificationKind, vars: Readonly<Record<string, string>>, endsAt: string): WidgetState | undefined {
  const num = (v: string | undefined): number | undefined => (v !== undefined && /^\d+$/.test(v) ? Number(v) : undefined);
  switch (kind) {
    case 'daily_challenge':
    case 'streak_in_danger':
      return { challengePending: true, endsAt, ...(num(vars.count) !== undefined ? { streak: num(vars.count) } : {}) };
    case 'daily_photo':
      return { photoFrom: vars.name ?? '', endsAt };
    case 'link_in_danger':
      return num(vars.lives) !== undefined ? { livesLeft: num(vars.lives) } : undefined;
    default:
      return undefined;
  }
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
  ) {}

  async notify(userId: string, kind: NotificationKind, vars: Record<string, string> = {}): Promise<void> {
    try {
      await this.process(userId, kind, vars, null);
    } catch (err) {
      this.logger.warn(`notification ${kind} non envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
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
      this.logger.warn(`report ${entry.kind} non envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      await this.log.close(entry.id, 'dropped');
      return false;
    }
  }

  private async process(userId: string, kind: NotificationKind, vars: Record<string, string>, queued: NotificationLogRecord | null): Promise<boolean> {
    const settings = await this.settings.resolve(userId);
    const devices = (await this.devices.forUser(userId)).filter((d) => d.kind === 'expo');
    // Compte suspendu : aucun push (Audience) ; un report en attente est abandonné.
    if (devices.length === 0 || !(await this.audience.canNotify(userId))) {
      if (queued) await this.log.close(queued.id, 'dropped');
      return false;
    }
    const now = this.clock.now();
    const local = localTimeOf(now, settings.timeZone);
    const linkId = PER_LINK.includes(kind) ? (vars.linkId ?? null) : null;
    const today = await this.log.forUserDay(userId, local.day);
    const sent = today.filter((l) => l.status === 'sent');
    const same = sent.filter((l) => l.kind === kind && l.linkId === linkId);
    const decision = decideNotification({
      kind,
      enabled: !settings.disabledKinds.includes(kind),
      now,
      timeZone: settings.timeZone,
      sentTodayCounted: sent.filter((l) => !capExempt(l.kind)).length,
      alreadyToday: same.length > 0,
      lastSameAt: same.map((l) => l.createdAt).sort().at(-1) ?? null,
      fromQueue: queued !== null,
    });

    if (decision.action === 'defer') {
      // Un seul report par type (et lien) et par nuit.
      if (!today.some((l) => l.status === 'deferred' && l.kind === kind && l.linkId === linkId)) {
        await this.log.add({ userId, kind, linkId, localDay: local.day, status: 'deferred', sendAfter: decision.until.toISOString(), vars, createdAt: now.toISOString() });
      }
      return false;
    }
    if (decision.action === 'skip') {
      if (queued) await this.log.close(queued.id, 'dropped');
      return false;
    }
    if (queued && !(await this.log.close(queued.id, 'sent'))) return false; // déjà envoyé par un autre tick

    const profile = await this.profiles.findById(userId);
    const lang = profile?.locale ?? 'fr';
    const text = notificationText(lang, kind, vars);
    const endsAt = nextLocalHour(now, settings.timeZone, 0).toISOString();
    const state = widgetState(kind, vars, endsAt);
    const data: PushData = { kind, url: deepLink(kind, vars), ...(vars.linkId ? { linkId: vars.linkId } : {}), ...(state ? { state } : {}) };
    // Activités en direct (docs/WIDGETS.md) : seule la photo du jour démarre par push ; le défi du jour n'est jamais
    // démarré ici (l'app le démarre quand il est accepté), la série en danger met à jour son activité.
    let liveStarted = false;
    if (kind === 'daily_photo' && vars.linkId) liveStarted = await this.live.startPhoto(userId, { linkId: vars.linkId, otherName: vars.name ?? '', alert: text });
    if (kind === 'streak_in_danger') await this.live.updateChallenge(userId, { streak: Number(vars.streak ?? vars.count ?? 0) || 0, title: null });
    // Activité démarrée avec son alerte : pas de seconde notification sur iOS.
    const targets = liveStarted ? devices.filter((d) => d.platform !== 'ios') : devices;
    const delivered = targets.length > 0 ? await this.deliver(targets, { title: text.title, body: text.body, data }) : liveStarted;
    await this.log.add({ userId, kind, linkId, localDay: local.day, status: 'sent', sendAfter: null, vars: null, createdAt: now.toISOString() });
    return delivered;
  }

  private async deliver(devices: readonly PushDeviceRecord[], content: Omit<PushMessage, 'to'>): Promise<boolean> {
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
