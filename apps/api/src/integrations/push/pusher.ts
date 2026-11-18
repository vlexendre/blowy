/**
 * Port `Pusher` (spéc §12) : envoie des push à des jetons d'appareil et lit les reçus.
 * Adaptateur réel : service push d'Expo (gratuit, https://docs.expo.dev/push-notifications/faq/) ;
 * adaptateur mémoire avec boîte d'envoi pour les tests ; adaptateur « off » qui n'envoie rien.
 */
import type { PushData } from '@blowy/contract';

export const PUSHER = Symbol('PUSHER');

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: PushData;
  sound?: 'default';
  /** Android : canal de notification. */
  channelId?: string;
  /** Catégorie d'actions enregistrée par l'app (« Ne plus recevoir »). */
  categoryId?: string;
}

export type PushTicket = { status: 'ok'; id: string } | { status: 'error'; invalidToken: boolean; message: string };

export interface PushReceipt {
  ok: boolean;
  /** Le jeton n'est plus valable (DeviceNotRegistered) : ne plus jamais y envoyer. */
  invalidToken: boolean;
}

export interface Pusher {
  /** Un ticket par message, dans le même ordre. Lève seulement si le service est injoignable. */
  send(messages: readonly PushMessage[]): Promise<PushTicket[]>;
  /** Reçus disponibles pour ces tickets (les absents ne sont pas encore prêts). */
  receipts(ticketIds: readonly string[]): Promise<Map<string, PushReceipt>>;
}

/** Sans service de push configuré (PUSH_PROVIDER=off) : rien ne part. */
export class NoPusher implements Pusher {
  async send(messages: readonly PushMessage[]): Promise<PushTicket[]> {
    return messages.map(() => ({ status: 'error', invalidToken: false, message: 'push désactivé' }));
  }
  async receipts(): Promise<Map<string, PushReceipt>> {
    return new Map();
  }
}
