/**
 * Proxy Next 16 (ex-middleware) : CSP stricte à nonce par requête, en-tête de chemin pour la
 * navigation, redirection vers /login sans cookie de session (l'API reste l'autorité).
 */
import { NextResponse, type NextRequest } from 'next/server';

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
  ].join('; ');
  const { pathname } = request.nextUrl;
  // Espace lieu partenaire : cookie et page de connexion DISTINCTS du back-office staff.
  const venue = pathname === '/lieu' || pathname.startsWith('/lieu/');
  const isAuth = venue ? pathname.startsWith('/lieu/login') : pathname.startsWith('/login');
  if (!isAuth && !request.cookies.get(venue ? 'blowy_venue' : 'blowy_staff')) {
    const url = request.nextUrl.clone();
    url.pathname = venue ? '/lieu/login' : '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  const h = new Headers(request.headers);
  h.set('x-nonce', nonce);
  h.set('x-pathname', pathname);
  h.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers: h } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico|fonts/|lieu/img/).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }] }],
};
