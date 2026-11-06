/**
 * Gateway Socket.IO v1 (diffusion seulement ; REST porte les écritures).
 *  - authenticate : jeton de session (handshake auth.token ou événement) → user room `user:<id>` ;
 *  - join : room conversation/relation SEULEMENT si appartenance active (vérifiée serveur) ;
 *  - heartbeat : ack horodaté ;
 *  - resync : entrées de projection du destinataire après son curseur opaque (aucun trou
 *    dû à un événement privé : la séquence est propre au destinataire).
 *  - révocation : `revokeRooms` (blocage/départ) retire les sockets de l'utilisateur ;
 *  - session : une socket vit au plus aussi longtemps que sa session. Révocation d'appareil →
 *    `disconnect {sessions}` ferme ses sockets ; expiration → minuterie + contrôle à chaque resync
 *    (horloge injectée) ; revalidation périodique en base (relais perdu) avant toute livraison.
 * Livraison inter-processus via l'adapter Redis pub/sub (worker → API) : canal `blowy:rt`.
 */
import type { Server as HttpServer } from 'node:http';
import { WsEnvelopeSchema, WsJoinSchema, WsResyncRequestSchema, type WsEnvelope } from '@blowy/api-contract';
import type { Redis } from 'ioredis';
import { Server, type Socket } from 'socket.io';
import type { ParticipationReader } from '../shared/application/ports/participation.reader.js';
import { decodeProjectionCursor, encodeProjectionCursor, type ProjectedEntry, type ProjectionReader } from '../shared/application/projection.js';
import type { Clock } from '../shared/application/clock.js';
import type { SessionResolver } from '../shared/interface/auth.guard.js';
import type { Logger } from '../shared/infrastructure/logging/logger.js';

export const RT_CHANNEL = 'blowy:rt';

export interface RtMessage {
  /** disconnect (agent E) : suppression de compte / suspension → toutes les sockets fermées. */
  kind: 'deliver' | 'revoke' | 'disconnect';
  recipients: string[];
  rooms?: string[];
  /** disconnect ciblé : seulement les sockets ouvertes avec ces sessions (révocation d'appareil). */
  sessions?: string[];
}

/** Revalidation de la session d'une socket en base au plus toutes les… (défense en profondeur). */
const SESSION_RECHECK_MS = 30_000;
/** setTimeout borne ses délais à 2^31-1 ms (~24,8 j) : au-delà, on réarme. */
const MAX_TIMER_MS = 2_147_483_647;

export interface ConversationMembership {
  isActiveMember(userId: string, conversationId: string): Promise<boolean>;
}

export function toEnvelope(e: ProjectedEntry & { id?: string }): WsEnvelope {
  return WsEnvelopeSchema.parse({
    eventId: e.sourceEventId,
    type: e.type,
    aggregateId: e.aggregateId,
    projectionCursor: encodeProjectionCursor(e.seq),
    occurredAt: e.occurredAt.toISOString(),
    schemaVersion: 1,
    payload: e.payload,
  });
}

export class RealtimeGateway {
  readonly io: Server;
  private sub: Redis | null = null;

  constructor(
    http: HttpServer,
    private readonly deps: {
      sessions: SessionResolver;
      participation: ParticipationReader;
      conversations: ConversationMembership;
      projections: ProjectionReader;
      logger: Logger;
      corsOrigins: string[];
      clock: Clock;
    },
  ) {
    this.io = new Server(http, { path: '/v1/ws', cors: { origin: deps.corsOrigins.length ? deps.corsOrigins : false }, serveClient: false, pingInterval: 25_000, pingTimeout: 20_000 });
    this.io.use(async (socket, next) => {
      const token = (socket.handshake.auth as { token?: unknown })?.token;
      const user = typeof token === 'string' ? await deps.sessions.resolve(token).catch(() => null) : null;
      if (!user) return next(new Error('UNAUTHENTICATED'));
      socket.data.userId = user.userId;
      socket.data.sessionId = user.sessionId;
      socket.data.token = token;
      socket.data.expiresAt = user.expiresAt ?? null;
      socket.data.checkedAt = this.now().getTime();
      next();
    });
    this.io.on('connection', (s) => this.onConnection(s));
  }

  /** Écoute les ordres de diffusion publiés par le worker (Redis pub/sub). */
  async attachRedis(sub: Redis): Promise<void> {
    this.sub = sub;
    await sub.subscribe(RT_CHANNEL);
    sub.on('message', (_ch, raw) => {
      try {
        void this.handleRt(JSON.parse(raw) as RtMessage);
      } catch {
        /* message invalide ignoré */
      }
    });
  }

  async handleRt(m: RtMessage): Promise<void> {
    if (m.kind === 'disconnect') {
      const only = m.sessions?.length ? new Set(m.sessions) : null;
      for (const u of m.recipients) {
        for (const s of await this.io.in(`user:${u}`).fetchSockets()) {
          if (only && !only.has(s.data.sessionId as string)) continue;
          s.emit('access.revoked', { room: `user:${u}` });
          s.disconnect(true);
        }
      }
      return;
    }
    if (m.kind === 'revoke') {
      for (const u of m.recipients) for (const room of m.rooms ?? []) await this.revokeRooms(u, [room]);
      return;
    }
    // deliver : demander à chaque socket du destinataire de se resynchroniser sur ses rooms.
    for (const u of m.recipients) this.io.to(`user:${u}`).emit('sync', { reason: 'new_events' });
  }

  async revokeRooms(userId: string, rooms: string[]): Promise<void> {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    for (const s of sockets) {
      for (const r of rooms) {
        s.leave(r);
        s.emit('access.revoked', { room: r });
      }
    }
  }

  private now(): Date {
    return this.deps.clock.now();
  }

  /** Ferme une socket dont la session n'est plus valide (révoquée, expirée, compte suspendu). */
  private endSession(socket: Socket): void {
    socket.emit('access.revoked', { room: `user:${socket.data.userId as string}` });
    socket.disconnect(true);
  }

  /** Arme la coupure à l'échéance de la session (réarmée si au-delà de la borne setTimeout). */
  private armExpiry(socket: Socket): void {
    const exp = socket.data.expiresAt as Date | null;
    if (!exp) return;
    const delay = exp.getTime() - this.now().getTime();
    if (delay <= 0) return this.endSession(socket);
    const t = setTimeout(() => (delay > MAX_TIMER_MS ? this.armExpiry(socket) : this.endSession(socket)), Math.min(delay, MAX_TIMER_MS));
    t.unref?.();
    socket.once('disconnect', () => clearTimeout(t));
  }

  /** Session encore valide ? Échéance vérifiée à chaque appel ; base revérifiée périodiquement. */
  private async sessionAlive(socket: Socket): Promise<boolean> {
    const now = this.now().getTime();
    const exp = socket.data.expiresAt as Date | null;
    if (exp && exp.getTime() <= now) return false;
    if (now - (socket.data.checkedAt as number) < SESSION_RECHECK_MS) return true;
    const user = await this.deps.sessions.resolve(socket.data.token as string).catch(() => null);
    if (!user || user.sessionId !== socket.data.sessionId) return false;
    socket.data.checkedAt = now;
    socket.data.expiresAt = user.expiresAt ?? exp;
    return true;
  }

  private onConnection(socket: Socket): void {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);
    socket.emit('authenticated', { userId });
    this.armExpiry(socket);

    socket.on('heartbeat', (_: unknown, ack?: (r: unknown) => void) => ack?.({ serverTime: this.now().toISOString() }));

    socket.on('join', async (raw: unknown, ack?: (r: unknown) => void) => {
      const parsed = WsJoinSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'VALIDATION_FAILED' });
      if (!(await this.sessionAlive(socket))) {
        ack?.({ ok: false, code: 'UNAUTHENTICATED' });
        return this.endSession(socket);
      }
      const [kind, id] = parsed.data.room.split(':') as [string, string];
      const allowed =
        kind === 'user' ? id === userId : kind === 'conversation' ? await this.deps.conversations.isActiveMember(userId, id) : kind === 'relationship' ? !!(await this.deps.participation.get(userId, id)) : false;
      if (!allowed) return ack?.({ ok: false, code: 'NOT_FOUND' });
      await socket.join(parsed.data.room);
      ack?.({ ok: true });
    });

    socket.on('leave', async (raw: unknown, ack?: (r: unknown) => void) => {
      const parsed = WsJoinSchema.safeParse(raw);
      if (parsed.success) await socket.leave(parsed.data.room);
      ack?.({ ok: true });
    });

    socket.on('resync', async (raw: unknown, ack?: (r: unknown) => void) => {
      const parsed = WsResyncRequestSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ ok: false, code: 'VALIDATION_FAILED' });
      // Rien n'est livré à une socket dont la session a expiré ou été révoquée.
      if (!(await this.sessionAlive(socket))) {
        ack?.({ ok: false, code: 'UNAUTHENTICATED' });
        return this.endSession(socket);
      }
      // Une room non autorisée (ex. après révocation) ne renvoie rien.
      if (!socket.rooms.has(parsed.data.room) && parsed.data.room !== `user:${userId}`) return ack?.({ ok: false, code: 'NOT_FOUND' });
      const after = decodeProjectionCursor(parsed.data.sinceCursor);
      const entries = await this.deps.projections.since(userId, parsed.data.room, after, 200);
      ack?.({ ok: true, events: entries.map(toEnvelope) });
    });
  }

  async close(): Promise<void> {
    await this.sub?.quit().catch(() => undefined);
    await new Promise<void>((r) => this.io.close(() => r()));
  }
}
