export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationsPort {
  getPermission(): Promise<NotificationPermission>;
  /** À demander après la première activation de rencontre, jamais au premier lancement. */
  requestPermission(): Promise<NotificationPermission>;
  /** Jeton push Expo à enregistrer côté serveur (/v1/devices) ; null si indisponible. */
  getPushToken(): Promise<string | null>;
  /** Abonnement aux taps sur notification → URL de deep link. */
  onOpen(listener: (url: string) => void): () => void;
}
