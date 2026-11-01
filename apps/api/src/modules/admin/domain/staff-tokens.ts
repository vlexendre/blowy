/**
 * Jetons staff (purs, sans I/O) :
 *  - jeton d'attente MFA signé (HMAC, TTL 5 min) : prouve seulement la 1re étape (identité) ;
 *  - jeton de session opaque `<sessionId>.<secret>` dont seule l'empreinte est stockée, avec
 *    séparation de domaine (« staff: ») : il ne passe jamais le résolveur de sessions mobiles ;
 *  - jeton CSRF lié à la session (HMAC du sessionId), comparé en temps constant.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');

function sign(secret: string, purpose: string, body: string): string {
  return createHmac('sha256', secret).update(`${purpose}:${body}`).digest('base64url');
}

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const PENDING_TTL_MS = 5 * 60_000;

export function issuePendingToken(secret: string, userId: string, nonce: string, now: Date): { token: string; expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + PENDING_TTL_MS);
  const body = `${userId}.${expiresAt.getTime()}.${nonce}`;
  return { token: `p1.${b64u(body)}.${sign(secret, 'staff-pending', body)}`, expiresAt };
}

export function verifyPendingToken(secret: string, token: string, now: Date): { userId: string; nonce: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'p1') return null;
  let body: string;
  try {
    body = Buffer.from(parts[1]!, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!safeEq(sign(secret, 'staff-pending', body), parts[2]!)) return null;
  const [userId, exp, nonce] = body.split('.');
  if (!userId || !exp || !nonce || Number(exp) <= now.getTime()) return null;
  return { userId, nonce };
}

export function hashStaffSessionToken(secret: string, token: string): string {
  return createHmac('sha256', secret).update(`staff:${token}`).digest('hex');
}

export function csrfFor(secret: string, sessionId: string): string {
  return sign(secret, 'staff-csrf', sessionId);
}

export function verifyCsrf(secret: string, sessionId: string, given: string | undefined): boolean {
  return !!given && safeEq(csrfFor(secret, sessionId), given);
}

/** Masque un email pour l'affichage staff (jamais complet). */
export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***';
  return `${user.slice(0, 1)}***@${domain}`;
}
