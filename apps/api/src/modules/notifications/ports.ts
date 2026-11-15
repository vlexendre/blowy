/** Ports des notifications : appareils, réglages, journal des envois (et file des reports), reçus Expo. */
import type { Day, NotificationKindKey } from '@blowy/domain';

export const PUSH_DEVICES = Symbol('PUSH_DEVICES');
export const NOTIFICATION_SETTINGS = Symbol('NOTIFICATION_SETTINGS');
export const NOTIFICATION_LOG = Symbol('NOTIFICATION_LOG');
export const PUSH_RECEIPTS = Symbol('PUSH_RECEIPTS');

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
