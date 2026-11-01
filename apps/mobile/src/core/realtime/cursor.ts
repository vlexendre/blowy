/**
 * Logique pure de resynchronisation par curseur de projection (propre au destinataire) :
 * déduplication par eventId, avance du curseur, backoff de reconnexion.
 */
import type { WsEnvelope } from '@blowy/api-contract';

export interface RoomCursorState {
  /** Curseur opaque par room (`conversation:<id>`…). */
  cursors: Readonly<Record<string, string | null>>;
  /** eventIds récemment appliqués (anti-doublon, borné). */
  seen: readonly string[];
}

export const emptyCursors: RoomCursorState = { cursors: {}, seen: [] };
const SEEN_MAX = 500;

/** Applique un lot renvoyé par `resync` : renvoie les événements nouveaux et l'état avancé. */
export function applyBatch(state: RoomCursorState, room: string, events: readonly WsEnvelope[]): { state: RoomCursorState; fresh: WsEnvelope[] } {
  const seen = new Set(state.seen);
  const fresh: WsEnvelope[] = [];
  let cursor = state.cursors[room] ?? null;
  for (const e of events) {
    cursor = e.projectionCursor;
    if (seen.has(e.eventId)) continue;
    seen.add(e.eventId);
    fresh.push(e);
  }
  const seenArr = [...seen];
  return { state: { cursors: { ...state.cursors, [room]: cursor }, seen: seenArr.slice(Math.max(0, seenArr.length - SEEN_MAX)) }, fresh };
}

/** Backoff exponentiel avec gigue déterministe (jitter injecté pour les tests). */
export function reconnectDelay(attempt: number, jitter: number, baseMs = 1_000, maxMs = 30_000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  return Math.round(exp * (0.5 + 0.5 * Math.min(1, Math.max(0, jitter))));
}

/** Rooms à rejoindre pour l'utilisateur, hors celles révoquées. */
export const roomsToJoin = (wanted: readonly string[], revoked: readonly string[]): string[] => wanted.filter((r) => !revoked.includes(r));
