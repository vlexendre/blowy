/** Diffusion temps réel (implémentée par la gateway Socket.IO / Redis). */
export interface RealtimePublisher {
  /** Notifie un destinataire qu'une nouvelle entrée de projection est disponible. */
  notify(recipientId: string, entry: { room: string; seq: number; type: string; aggregateId: string; payload: unknown; occurredAt: Date; sourceEventId: string }): Promise<void>;
  /** Retire l'utilisateur d'une room (blocage, départ…). */
  revoke(recipientId: string, room: string): Promise<void>;
}
export const REALTIME_PUBLISHER = Symbol('RealtimePublisher');
