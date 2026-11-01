/**
 * Aide WS indépendante de la bibliothèque socket : le client fournit un socket compatible
 * Socket.IO (socket.io-client). Ce module gère le curseur opaque par room, la déduplication
 * des eventId et la resynchronisation (pas de dépendance serveur).
 */
import { WsEnvelopeSchema, type WsEnvelope } from '@blowy/api-contract';

export const WS_PATH = '/v1/ws';

export interface SocketLike {
  emit(event: string, payload: unknown, ack?: (r: unknown) => void): unknown;
  on(event: string, handler: (...args: unknown[]) => void): unknown;
}

export class RealtimeSync {
  private readonly cursors = new Map<string, string | null>();
  private readonly seen = new Set<string>();

  constructor(
    private readonly socket: SocketLike,
    private readonly onEvent: (e: WsEnvelope) => void,
  ) {
    socket.on('sync', () => void this.resyncAll());
    socket.on('access.revoked', (p) => {
      const room = (p as { room?: string })?.room;
      if (room) this.cursors.delete(room);
    });
  }

  private ack<T>(event: string, payload: unknown): Promise<T> {
    return new Promise((resolve) => this.socket.emit(event, payload, (r) => resolve(r as T)));
  }

  async join(room: string, sinceCursor: string | null = null): Promise<boolean> {
    const r = await this.ack<{ ok: boolean }>('join', { room });
    if (!r.ok) return false;
    this.cursors.set(room, sinceCursor);
    await this.resync(room);
    return true;
  }

  async resync(room: string): Promise<void> {
    const r = await this.ack<{ ok: boolean; events?: unknown[] }>('resync', { room, sinceCursor: this.cursors.get(room) ?? null });
    if (!r.ok) return;
    for (const raw of r.events ?? []) {
      const e = WsEnvelopeSchema.parse(raw);
      this.cursors.set(room, e.projectionCursor);
      if (this.seen.has(`${e.eventId}:${e.type}`)) continue;
      this.seen.add(`${e.eventId}:${e.type}`);
      this.onEvent(e);
    }
  }

  async resyncAll(): Promise<void> {
    for (const room of this.cursors.keys()) await this.resync(room);
  }

  cursorOf(room: string): string | null {
    return this.cursors.get(room) ?? null;
  }
}
