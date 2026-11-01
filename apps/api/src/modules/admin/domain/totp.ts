/**
 * TOTP RFC 6238 (HMAC-SHA1, 30 s, 6 chiffres) — compatible Google Authenticator / 1Password.
 * Pur : l'instant est passé en paramètre. Fenêtre de tolérance ±1 pas ; le pas utilisé est
 * renvoyé pour empêcher le rejeu d'un même code (vérifié par l'application).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('base32 invalide');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function totpAt(secret: Buffer, step: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', secret).update(msg).digest();
  const off = h[h.length - 1]! & 0xf;
  const bin = ((h[off]! & 0x7f) << 24) | (h[off + 1]! << 16) | (h[off + 2]! << 8) | h[off + 3]!;
  return String(bin % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export const stepOf = (now: Date) => Math.floor(now.getTime() / 1000 / TOTP_PERIOD_SECONDS);

/** Vérifie un code ; renvoie le pas accepté (pour l'anti-rejeu) ou null. */
export function verifyTotp(secret: Buffer, code: string, now: Date, window = 1): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const current = stepOf(now);
  for (let d = -window; d <= window; d++) {
    const expected = Buffer.from(totpAt(secret, current + d));
    const given = Buffer.from(code);
    if (expected.length === given.length && timingSafeEqual(expected, given)) return current + d;
  }
  return null;
}

/** URI d'enrôlement (QR) ; le libellé n'inclut pas d'email. */
export function otpauthUri(secret: Buffer, label: string, issuer = 'Blowy Admin'): string {
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${label}`)}?secret=${base32Encode(secret)}&issuer=${encodeURIComponent(issuer)}&period=${TOTP_PERIOD_SECONDS}&digits=${TOTP_DIGITS}`;
}

/**
 * Secret TOTP dérivé (jamais stocké) : HMAC-SHA256(clé maîtresse, userId:génération), 20 octets.
 * Un (ré)enrôlement incrémente la génération → nouveau secret ; la clé maîtresse reste serveur.
 */
export function deriveTotpSecret(masterKey: string, userId: string, generation: number): Buffer {
  return createHmac('sha256', masterKey).update(`blowy-staff-totp:${userId}:${generation}`).digest().subarray(0, 20);
}
