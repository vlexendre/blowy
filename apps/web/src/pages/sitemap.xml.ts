/** Plan du site (pages indexables uniquement ; /m/ et /i/ sont personnelles). */
import type { APIRoute } from 'astro';
import { LEGAL, SITE_URL } from '../config/site';

const PATHS = ['/', '/support', '/regles', '/conditions', '/confidentialite'];

export const GET: APIRoute = () => {
  const urls = PATHS.map((p) => `  <url><loc>${new URL(p, SITE_URL).href}</loc><lastmod>${LEGAL.updatedAtIso}</lastmod></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
