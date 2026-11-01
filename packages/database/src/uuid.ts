/** UUID v7 côté application (D-008), RFC 9562. `now` injectable pour déterminisme. */
import { randomBytes } from 'node:crypto';

export function uuidv7(nowMs: number = Date.now(), rand: Uint8Array = randomBytes(10)): string {
  const b = new Uint8Array(16);
  const ts = BigInt(nowMs);
  for (let i = 0; i < 6; i++) b[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
  b.set(rand.subarray(0, 10), 6);
  b[6] = (b[6]! & 0x0f) | 0x70;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Buffer.from(b).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
