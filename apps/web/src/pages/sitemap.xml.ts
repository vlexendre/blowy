/**
 * Plan du site : pages indexables uniquement (les pages de partage /m/, /i/, /g/… sont personnelles), chacune dans ses
 * cinq langues avec les liens `xhtml:link` vers les autres versions (et x-default, le français) ; les pages villes et
 * guides (français) et /nl/vrienden-maken/ (néerlandais), dans une seule langue, sans alternates.
 */
import type { APIRoute } from 'astro';
import { LEGAL_UPDATED_ISO } from '../config/legal';
import { SITE_URL } from '../config/site';
import { LEGAL_SLUGS, LOCALES as LEGAL_LOCALES, legalAlternates, legalPath, type LegalSlug } from '../i18n/legal';
import { LOCALES, SEO_PAGES, localePath, pageAlternates, type SeoPage } from '../i18n/site';
import { editorialSitemap } from '../lib/editorial-pages';

const abs = (p: string) => new URL(p, SITE_URL).href;

function entries(alternates: { hreflang: string; path: string }[], paths: string[], lastmod?: string): string[] {
  const links = alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${abs(a.path)}"/>`).join('\n');
  return paths.map((p) => `  <url>\n    <loc>${abs(p)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}${links}\n  </url>`);
}

const pageEntries = (p: SeoPage) => entries(pageAlternates(p), LOCALES.map((l) => localePath(l, p)));
const legalEntries = (slug?: LegalSlug) => entries(legalAlternates(slug), LEGAL_LOCALES.map((l) => legalPath(l, slug)), LEGAL_UPDATED_ISO);
/** Pages villes, guides et /nl/vrienden-maken/ : une seule langue chacune, donc sans alternates. */
const editorialEntries = () => editorialSitemap().map((p) => `  <url>\n    <loc>${abs(p.path)}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`);

export const GET: APIRoute = () => {
  const urls = [...SEO_PAGES.flatMap(pageEntries), ...editorialEntries(), ...legalEntries(), ...LEGAL_SLUGS.flatMap((s) => legalEntries(s))].join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
