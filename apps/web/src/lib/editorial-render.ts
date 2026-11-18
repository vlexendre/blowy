/**
 * Rendu des textes éditoriaux (content/editorial) : HTML échappé, puis `**gras**` et `[texte](lien)`. Un lien externe
 * reçoit `rel="noopener"` ; un lien interne doit commencer par `/`.
 */
import type { Block, Faq, Section } from '../content/editorial/types';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Une ligne de texte en HTML (gras, liens). */
export function inline(text: string): string {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
    });
}

/** Le texte brut (sans mise en forme), pour les données structurées et le compte de mots. */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
}

/** Identifiant d'ancre à partir d'un titre. */
export function slugify(text: string): string {
  return plain(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function renderBlock(b: Block): string {
  if (typeof b === 'string') return `<p>${inline(b)}</p>`;
  if ('h3' in b) return `<h3>${inline(b.h3)}</h3>`;
  if ('note' in b) return `<p class="ed-note">${inline(b.note)}</p>`;
  const tag = b.ordered ? 'ol' : 'ul';
  return `<${tag}>${b.list.map((i) => `<li>${inline(i)}</li>`).join('')}</${tag}>`;
}

export function renderSection(s: Section): string {
  return `<section class="ed-sec" aria-labelledby="${slugify(s.title)}"><h2 id="${slugify(s.title)}">${inline(s.title)}</h2>${s.blocks.map(renderBlock).join('')}</section>`;
}

/** Tous les textes d'une page, pour le compte de mots et le contrôle de similarité. */
export function blockTexts(blocks: readonly Block[]): string[] {
  return blocks.flatMap((b) => (typeof b === 'string' ? [b] : 'h3' in b ? [b.h3] : 'note' in b ? [b.note] : [...b.list]));
}

export function wordCount(texts: readonly string[]): number {
  return texts.map(plain).join(' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
}

/** Données structurées FAQPage (texte brut). */
export function faqJsonLd(faq: readonly Faq[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  };
}

/** Données structurées BreadcrumbList ; `items` : du plus général au plus précis, chemins absolus. */
export function breadcrumbJsonLd(items: readonly { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

/** `<script type="application/ld+json">` sûr : `<` échappé. */
export function jsonLdScript(graph: readonly Record<string, unknown>[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
