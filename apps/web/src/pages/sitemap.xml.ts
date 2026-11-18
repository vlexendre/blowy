/** Plan du site (pages indexables uniquement ; /m/ et /i/ sont personnelles), avec les versions de langue des pages légales. */
import type { APIRoute } from 'astro';
import { LEGAL_UPDATED_ISO } from '../config/legal';
import { SITE_URL } from '../config/site';
import { LEGAL_SLUGS, LOCALES, legalAlternates, legalPath, type LegalSlug } from '../i18n/legal';

const abs = (p: string) => new URL(p, SITE_URL).href;

function legalEntries(slug?: LegalSlug): string[] {
  const alternates = legalAlternates(slug)
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${abs(a.path)}"/>`)
    .join('\n');
  return LOCALES.map((l) => `  <url>\n    <loc>${abs(legalPath(l, slug))}</loc>\n    <lastmod>${LEGAL_UPDATED_ISO}</lastmod>\n${alternates}\n  </url>`);
}

export const GET: APIRoute = () => {
  const urls = [`  <url><loc>${abs('/')}</loc></url>`, `  <url><loc>${abs('/quiz')}</loc></url>`, `  <url><loc>${abs('/quartier')}</loc></url>`, ...legalEntries(), ...LEGAL_SLUGS.flatMap((s) => legalEntries(s))].join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
