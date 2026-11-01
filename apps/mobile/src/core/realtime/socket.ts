/**
 * Client temps réel Socket.IO (/v1/ws) : authentification par jeton de session au handshake,
 * reconnexion avec backoff, join des rooms autorisées, `sync` serveur → `resync` par curseur.
 * Diffusion seulement : aucune écriture ne passe par le WS.
 */
import { WsEnvelopeSchema, type WsEnvelope } from '@blowy/api-contract';
import { io, type Socket } from 'socket.io-client';
import { applyBatch, emptyCursors, reconnectDelay, type RoomCursorState } from './cursor';

export type RealtimeStatus = 'idle' | 'connecting' | 'online' | 'offline';

export interface RealtimeDeps {
  url: string;
  getToken: () => Promise<string | null>;
  onEvents: (room: string, events: WsEnvelope[]) => void;
  onRevoked: (room: string) => void;
  onStatus: (s: RealtimeStatus) => void;
}

export class RealtimeClient {
  private socket: Socket | null = null;
  private rooms = new Set<string>();
  private cursors: RoomCursorState = emptyCursors;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;

  constructor(private readonly deps: RealtimeDeps) {}

  async start(): Promise<void> {
    this.stopped = false;
    await this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.socket?.disconnect();
    this.socket = null;
    this.deps.onStatus('idle');
  }

  join(room: string): void {
    this.rooms.add(room);
    if (this.socket?.connected) this.socket.emit('join', { room }, () => void this.resync(room));
  }

  leave(room: string): void {
    this.rooms.delete(room);
    this.socket?.emit('leave', { room });
  }

  private async connect(): Promise<void> {
    const token = await this.deps.getToken();
    if (!token || this.stopped) return;
    this.deps.onStatus('connecting');
    // Reconnexion gérée ici (backoff + jeton rafraîchi), pas par socket.io.
    const s = io(this.deps.url, { path: '/v1/ws', transports: ['websocket'], auth: { token }, reconnection: false });
    this.socket = s;
    s.on('connect', () => {
      this.attempt = 0;
      this.deps.onStatus('online');
      for (const room of this.rooms) s.emit('join', { room }, () => void this.resync(room));
    });
    s.on('sync', () => {
      for (const room of this.rooms) void this.resync(room);
    });
    s.on('access.revoked', (p: { room?: string }) => {
      if (!p?.room) return;
      this.rooms.delete(p.room);
      this.deps.onRevoked(p.room);
    });
    const retry = () => {
      this.deps.onStatus('offline');
      if (this.stopped) return;
      const delay = reconnectDelay(this.attempt++, Math.random());
      this.timer = setTimeout(() => void this.connect(), delay);
    };
    s.on('disconnect', retry);
    s.on('connect_error', retry);
  }

  private resync(room: string): Promise<void> {
    const s = this.socket;
    if (!s?.connected) return Promise.resolve();
    return new Promise((resolve) => {
      s.emit('resync', { room, sinceCursor: this.cursors.cursors[room] ?? null }, (r: { ok?: boolean; events?: unknown[] }) => {
        if (r?.ok && Array.isArray(r.events)) {
          const parsed = r.events.map((e) => WsEnvelopeSchema.safeParse(e)).flatMap((x) => (x.success ? [x.data] : []));
          const { state, fresh } = applyBatch(this.cursors, room, parsed);
          this.cursors = state;
          if (fresh.length) this.deps.onEvents(room, fresh);
        }
        resolve();
      });
    });
  }
}
