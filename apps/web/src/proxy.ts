/**
 * Proxy Next 16 du web public :
 *  - CSP stricte à nonce (aucun script tiers, aucun traceur) ;
 *  - identifiant visiteur opaque (cookie HttpOnly, 30 j) utilisé UNIQUEMENT pour l'anti-rejeu
 *    des réponses « 3 mots » : l'API n'en conserve qu'un HMAC par cible ; ni IP ni empreinte.
 */
import { NextResponse, type NextRequest } from 'next/server';

const VISITOR = 'blowy_v';

function randomToken(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString('base64url');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self'${dev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
  const h = new Headers(request.headers);
  h.set('x-nonce', nonce);
  h.set('Content-Security-Policy', csp);
  let visitor = request.cookies.get(VISITOR)?.value;
  const fresh = !visitor || !/^[A-Za-z0-9_-]{22,64}$/.test(visitor);
  if (fresh) visitor = randomToken();
  h.set('x-blowy-visitor', visitor!);
  const res = NextResponse.next({ request: { headers: h } });
  res.headers.set('Content-Security-Policy', csp);
  if (fresh) res.cookies.set(VISITOR, visitor!, { httpOnly: true, sameSite: 'lax', secure: !dev && process.env.BLOWY_ENV !== 'local' && process.env.BLOWY_ENV !== 'test', path: '/', maxAge: 30 * 86_400 });
  return res;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|sprites/|favicon.ico|wellknown/|robots.txt).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }] }],
};
