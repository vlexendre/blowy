/**
 * Projection par destinataire (curseur WS opaque). Un événement n'est projeté que vers les
 * destinataires autorisés, avec un payload filtré ; la séquence est propre au destinataire
 * et n'avance jamais sur un événement privé omis (ex. vote de l'autre).
 */
import type { TxScope } from './unit-of-work.js';

export interface ProjectionInput {
  recipientId: string;
  sourceEventId: string;
  room: string;
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface ProjectedEntry extends ProjectionInput {
  seq: number;
}

export interface ProjectionWriter {
  /** Idempotent par (recipientId, sourceEventId). Renvoie l'entrée (nouvelle ou existante). */
  append(scope: TxScope, input: ProjectionInput): Promise<ProjectedEntry>;
}
export const PROJECTION_WRITER = Symbol('ProjectionWriter');

export interface ProjectionReader {
  since(recipientId: string, room: string, afterSeq: number, limit: number): Promise<ProjectedEntry[]>;
  head(recipientId: string): Promise<number>;
}
export const PROJECTION_READER = Symbol('ProjectionReader');

/** Curseur opaque : base64url("p1:<seq>") — ne révèle que la séquence du destinataire. */
export function encodeProjectionCursor(seq: number): string {
  return Buffer.from(`p1:${seq}`).toString('base64url');
}
export function decodeProjectionCursor(c: string | null | undefined): number {
  if (!c) return 0;
  const m = /^p1:(\d+)$/.exec(Buffer.from(c, 'base64url').toString('utf8'));
  return m ? Number(m[1]) : 0;
}
