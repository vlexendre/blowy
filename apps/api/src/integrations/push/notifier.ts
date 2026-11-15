/**
 * Notifications push (chantier « plateforme », voir docs/V7-INTERFACES.md).
 * L'implémentation (`PushNotifier`, modules/notifications) applique les réglages par type, les heures calmes
 * (22 h – 8 h, fuseau de la personne), le plafond (3 par jour hors messages) et la langue du profil.
 */
export const NOTIFIER = Symbol('NOTIFIER');

export type NotificationKind =
  | 'daily_challenge' | 'needs_out' | 'new_encounter' | 'waved' | 'message' | 'daily_photo'
  | 'link_in_danger' | 'streak_in_danger' | 'habit_proof' | 'weekly_review' | 'item_unlocked'
  | 'words_received' | 'trial_reminder';

export interface Notifier {
  /** Applique réglages, heures calmes et plafond ; ne lève jamais. */
  notify(userId: string, kind: NotificationKind, vars?: Record<string, string>): Promise<void>;
}
