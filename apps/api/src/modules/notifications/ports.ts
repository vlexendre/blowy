/** Ports des notifications : appareils, réglages, journal des envois (et file des reports), reçus Expo. */
import type { Day, NotificationKindKey } from '@blowy/domain';

export const PUSH_DEVICES = Symbol('PUSH_DEVICES');
export const NOTIFICATION_SETTINGS = Symbol('NOTIFICATION_SETTINGS');
export const NOTIFICATION_LOG = Symbol('NOTIFICATION_LOG');
export const PUSH_RECEIPTS = Symbol('PUSH_RECEIPTS');
export const LIVE_ACTIVITY_TOKENS = Symbol('LIVE_ACTIVITY_TOKENS');

/**
 * Contenu du push « défi du jour » (fourni par le module « rituels », `RitualsDailyPush`). La plateforme décide QUAND
 * (heure choisie, fuseau, heures calmes, plafond) ; les rituels décident SI (personne active, défi pas encore fait)
 * et QUOI (le défi du jour). Seul chemin d'envoi de `daily_challenge`.
 */
export const DAILY_PUSH_SOURCE = Symbol('DAILY_PUSH_SOURCE');
export interface DailyPushSource {
  /** Variables du push, ou null pour ne rien envoyer ce matin-là. */
  morning(userId: string, now: Date): Promise<Record<string, string> | null>;
}

export type DeviceKind = 'expo' | 'apns_live_activity';

export interface PushDeviceRecord {
  token: string;
  userId: string;
  platform: 'ios' | 'android';
  /** expo : push Expo ; apns_live_activity : jeton d'activité en direct (adaptateur à venir). */
  kind: DeviceKind;
  createdAt: string;
  lastSeenAt: string;
  disabledAt: string | null;
}

export interface DevicesRepository {
  /** Crée ou rattache le jeton à la personne (un jeton ne vit que sur un appareil) et le réactive. */
  upsert(device: PushDeviceRecord): Promise<void>;
  /** Appareils actifs d'une personne. */
  forUser(userId: string): Promise<PushDeviceRecord[]>;
  remove(token: string, userId: string): Promise<void>;
  /** Jetons refusés par le service (DeviceNotRegistered) : plus aucun envoi. */
  disable(tokens: readonly string[], at: string): Promise<void>;
}

export interface NotificationSettingsRecord {
  userId: string;
  timeZone: string;
  morningHour: number;
  disabledKinds: NotificationKindKey[];
  /** Prochain envoi du défi du jour ; null si aucun appareil ou défi coupé. */
  nextMorningAt: string | null;
  updatedAt: string;
}

export interface NotificationSettingsRepository {
  get(userId: string): Promise<NotificationSettingsRecord | null>;
  /** Réglages enregistrés de plusieurs personnes (absentes : jamais réglées). */
  forUsers(userIds: readonly string[]): Promise<NotificationSettingsRecord[]>;
  save(settings: NotificationSettingsRecord): Promise<void>;
  /** Personnes dont le défi du jour est à envoyer (`next_morning_at <= at`), par lots. */
  dueMorning(at: string, limit: number): Promise<NotificationSettingsRecord[]>;
}

export type NotificationStatus = 'sent' | 'deferred' | 'dropped';

export interface NotificationLogRecord {
  id: string;
  userId: string;
  kind: NotificationKindKey;
  linkId: string | null;
  /** Jour local de la personne au moment de l'envoi (plafond du jour). */
  localDay: Day;
  status: NotificationStatus;
  sendAfter: string | null;
  /** Variables d'un report (prénoms), effacées à l'envoi. Jamais de contenu de message. */
  vars: Record<string, string> | null;
  createdAt: string;
}

export interface NotificationLogRepository {
  add(entry: Omit<NotificationLogRecord, 'id'>): Promise<void>;
  /** Envois et reports d'une personne pour un jour local. */
  forUserDay(userId: string, localDay: Day): Promise<NotificationLogRecord[]>;
  /** Reports dont l'heure est venue, les plus anciens d'abord. */
  dueDeferred(at: string, limit: number): Promise<NotificationLogRecord[]>;
  /** Clôt un report (envoyé ou abandonné) et efface ses variables. Faux s'il était déjà clos (idempotence). */
  close(id: string, status: 'sent' | 'dropped'): Promise<boolean>;
  purge(before: string): Promise<number>;
}

export interface PushReceiptsRepository {
  add(tickets: readonly { ticketId: string; token: string; createdAt: string }[]): Promise<void>;
  /** Tickets envoyés avant `before` (≈ 15 min), à vérifier. */
  due(before: string, limit: number): Promise<{ ticketId: string; token: string }[]>;
  remove(ticketIds: readonly string[]): Promise<void>;
  purge(before: string): Promise<number>;
}

// ── Jetons APNs des activités en direct (rangés à part des jetons Expo) ────
export type LiveActivityUse = 'start' | 'update';
export type LiveActivityKindKey = 'challenge' | 'link' | 'outing';

export interface LiveActivityTokenRecord {
  token: string;
  userId: string;
  /** start : jeton « push-to-start » de l'app · update : jeton d'une activité en cours. */
  use: LiveActivityUse;
  activity: LiveActivityKindKey | null;
  activityId: string | null;
  /** Série d'un lien (`link`) : lien concerné, s'il est connu. */
  linkId: string | null;
  /** Fin de l'activité (minuit local) : le minuteur la termine et oublie le jeton. Null pour un jeton start. */
  endsAt: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface LiveActivityTokensRepository {
  /**
   * Range un jeton. Un jeton `update` remplace le précédent de la même activité (même personne, type et
   * identifiant d'activité) : l'ancien est oublié.
   */
  upsert(record: LiveActivityTokenRecord): Promise<void>;
  /** Jetons actifs d'une personne pour cet usage (et ce type d'activité, ce lien). */
  forUser(userId: string, filter: { use: LiveActivityUse; activity?: LiveActivityKindKey; linkId?: string | null }): Promise<LiveActivityTokenRecord[]>;
  /** Oublie ces jetons (activité terminée). */
  remove(tokens: readonly string[]): Promise<void>;
  /** Retrait par l'app (déconnexion). */
  removeForUser(token: string, userId: string): Promise<void>;
  /** Jetons refusés par APNs (410, BadDeviceToken) : plus aucun envoi. */
  disable(tokens: readonly string[], at: string): Promise<void>;
  /** Jetons `update` dont l'activité est finie (`endsAt <= at`), les plus anciens d'abord. */
  listEnded(at: string, limit: number): Promise<LiveActivityTokenRecord[]>;
  /** Jetons désactivés avant `before` : effacés. */
  purgeDisabled(before: string): Promise<number>;
}
