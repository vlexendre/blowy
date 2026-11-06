/**
 * Signature des webhooks Stripe (documentation « Check the webhook signatures », schéma `v1`) :
 * en-tête `Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>…][,v0=…]` ; signature attendue =
 * HMAC-SHA256(clé = secret du endpoint `whsec_…` tel quel, message = `${t}.${corps brut}`) en hex.
 * Plusieurs `v1` possibles (rotation du secret) ; `v0` (test) ignoré ; comparaison en temps constant ;
 * horodatage hors tolérance (défaut 300 s, valeur des bibliothèques Stripe) refusé (anti-rejeu).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const DEFAULT_TOLERANCE_SECONDS = 300;

export type SignatureFailure = 'MISSING_HEADER' | 'MALFORMED_HEADER' | 'NO_V1_SIGNATURE' | 'TIMESTAMP_OUT_OF_TOLERANCE' | 'SIGNATURE_MISMATCH';

export function computeStripeSignature(secret: string, timestamp: number, rawBody: Buffer | string): string {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody).digest('hex');
}

/** En-tête signé (tests, démo locale) — même formule que Stripe. */
export function signStripePayload(secret: string, timestamp: number, rawBody: Buffer | string): string {
  return `t=${timestamp},v1=${computeStripeSignature(secret, timestamp, rawBody)}`;
}

export function parseSignatureHeader(header: string): { timestamp: number; v1: string[] } | null {
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === 't') timestamp = /^\d{1,12}$/.test(v) ? Number(v) : null;
    else if (k === 'v1' && /^[0-9a-f]{64}$/i.test(v)) v1.push(v.toLowerCase());
  }
  return timestamp === null ? null : { timestamp, v1 };
}

export function verifyStripeSignature(i: { secret: string; rawBody: Buffer; header: string | undefined; nowMs: number; toleranceSeconds?: number }): { ok: true; timestamp: number } | { ok: false; reason: SignatureFailure } {
  if (!i.header) return { ok: false, reason: 'MISSING_HEADER' };
  const parsed = parseSignatureHeader(i.header);
  if (!parsed) return { ok: false, reason: 'MALFORMED_HEADER' };
  if (parsed.v1.length === 0) return { ok: false, reason: 'NO_V1_SIGNATURE' };
  const tolerance = i.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(Math.floor(i.nowMs / 1000) - parsed.timestamp) > tolerance) return { ok: false, reason: 'TIMESTAMP_OUT_OF_TOLERANCE' };
  const expected = Buffer.from(computeStripeSignature(i.secret, parsed.timestamp, i.rawBody), 'hex');
  const match = parsed.v1.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
  return match ? { ok: true, timestamp: parsed.timestamp } : { ok: false, reason: 'SIGNATURE_MISMATCH' };
}
