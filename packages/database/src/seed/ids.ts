/** Identifiants déterministes (seed rejouable) : UUID dérivé d'un nom stable, format v7-compatible. */
import { createHash } from 'node:crypto';

export function sid(name: string): string {
  const h = createHash('sha256').update(`blowy-seed:${name}`).digest();
  h[6] = (h[6]! & 0x0f) | 0x70;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
