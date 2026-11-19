/** Flux RSS du blog (/blog/rss.xml) : découverte rapide des nouveaux articles par les moteurs et les lecteurs de flux. */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../../config/site';
import { BLOG_LIST, blogPath } from '../../content/editorial/blog';
import { editorialUi } from '../../content/editorial/ui';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p: string) => new URL(p, SITE_URL).href;
const rfc822 = (iso: string) => new Date(`${iso}T08:00:00Z`).toUTCString();

export const GET: APIRoute = () => {
  const t = editorialUi.blog;
  const items = BLOG_LIST.map(
    (p) => `    <item>
      <title>${esc(p.h1)}</title>
      <link>${abs(blogPath(p.slug))}</link>
      <guid isPermaLink="true">${abs(blogPath(p.slug))}</guid>
      <pubDate>${rfc822(p.published)}</pubDate>
      <description>${esc(p.meta.description)}</description>
    </item>`,
  ).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(t.feedTitle)}</title>
    <link>${abs(t.path)}</link>
    <atom:link href="${abs(`${t.path}rss.xml`)}" rel="self" type="application/rss+xml"/>
    <description>${esc(t.meta.description)}</description>
    <language>fr-FR</language>
${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
