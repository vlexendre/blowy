/** Jeton de session opaque : `<sessionId>.<secret>` ; seule l'empreinte HMAC est stockée. */
import { createHmac, timingSafeEqual } from 'node:crypto';

export function hashSessionToken(token: string, serverSecret: string): string {
  return createHmac('sha256', serverSecret).update(token).digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
