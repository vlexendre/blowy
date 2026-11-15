/**
 * Adaptateur mémoire : rien ne sort, tout est gardé dans `outbox` (tests, mode local).
 * Un jeton qui contient « invalid » est traité comme désinscrit (DeviceNotRegistered) ; « late-invalid » ne l'est
 * qu'au reçu, comme chez Expo.
 */
import type { PushMessage, PushReceipt, PushTicket, Pusher } from './pusher';

export class MemoryPusher implements Pusher {
  readonly outbox: PushMessage[] = [];
  private sequence = 0;
  private readonly tokensByTicket = new Map<string, string>();

  async send(messages: readonly PushMessage[]): Promise<PushTicket[]> {
    return messages.map((m) => {
      if (m.to.includes('invalid') && !m.to.includes('late-invalid')) return { status: 'error', invalidToken: true, message: 'DeviceNotRegistered' };
      this.outbox.push(m);
      if (this.outbox.length > 500) this.outbox.shift();
      this.sequence += 1;
      const id = `ticket-${this.sequence}`;
      this.tokensByTicket.set(id, m.to);
      return { status: 'ok', id };
    });
  }

  async receipts(ticketIds: readonly string[]): Promise<Map<string, PushReceipt>> {
    const out = new Map<string, PushReceipt>();
    for (const id of ticketIds) {
      const token = this.tokensByTicket.get(id);
      if (!token) continue;
      const invalid = token.includes('late-invalid');
      out.set(id, { ok: !invalid, invalidToken: invalid });
    }
    return out;
  }
}
