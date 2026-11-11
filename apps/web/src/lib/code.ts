/**
 * Lit le code d'une page publique : /m/CODE, /m/CODE/ ou /m/?c=CODE (idem pour /i/).
 * Cloudflare Pages réécrit /m/* vers /m/index.html (public/_redirects) : l'URL reste /m/CODE.
 */
const CODE_RE = /^[A-Za-z0-9_-]{3,64}$/;

export function readCode(prefix: 'm' | 'i', loc: Location = window.location): string | null {
  const fromQuery = new URLSearchParams(loc.search).get('c');
  const parts = loc.pathname.split('/').filter(Boolean);
  const fromPath = parts[0] === prefix && parts[1] && parts[1] !== 'index.html' ? parts[1] : null;
  let raw = fromQuery ?? fromPath;
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  raw = raw.trim();
  return CODE_RE.test(raw) ? raw : null;
}
