/**
 * Rendu HTML du contenu des pages légales (voir src/content/legal/types.ts pour la mise en forme).
 * Tout le texte est échappé ; seuls les balisages connus produisent du HTML. Une clé de champ ou une page
 * inconnue fait échouer le build plutôt que d'afficher un lien cassé.
 */
import { LEGAL_FIELDS, SUBPROCESSORS, TODO, type SubprocessorKey } from '../config/legal';
import type { Block } from '../content/legal/types';
import { isLegalSlug, legalPath, type Locale } from '../i18n/legal';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Typographie : apostrophe courbe ; en français, espace insécable avant ; : ! ? » et après «. */
function typo(s: string, locale: Locale): string {
  let t = s.replace(/'/g, '’');
  if (locale === 'fr') {
    t = t
      .replace(/ ([;:!?»])/g, ' $1')
      .replace(/« /g, '« ')
      .replace(/(\d) (€|%|h\b|km|m\b)/g, '$1 $2');
  }
  return esc(t);
}

const todoMark = `<mark class="todo">${esc(TODO)}</mark>`;

function field(key: string): string {
  const value = LEGAL_FIELDS[key];
  if (value === undefined) throw new Error(`Champ légal inconnu : {{${key}}}`);
  if (value === TODO) return todoMark;
  if (key.startsWith('email.')) return `<a href="mailto:${esc(value)}">${esc(value)}</a>`;
  if (/^https?:\/\//.test(value)) return `<a href="${esc(value)}" rel="noopener">${esc(value.replace(/^https?:\/\//, ''))}</a>`;
  return esc(value);
}

function href(target: string, locale: Locale): { url: string; external: boolean } {
  if (target.startsWith('@')) {
    const [page, anchor] = target.slice(1).split('#');
    if (page === 'index') return { url: legalPath(locale) + (anchor ? `#${anchor}` : ''), external: false };
    if (!page || !isLegalSlug(page)) throw new Error(`Page légale inconnue : ${target}`);
    return { url: legalPath(locale, page) + (anchor ? `#${anchor}` : ''), external: false };
  }
  return { url: target, external: /^https?:\/\//.test(target) };
}

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\{\{([\w.]+)\}\}/g;

/** Une ligne de texte avec gras, liens et champs. */
export function inline(s: string, locale: Locale): string {
  let out = '';
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    out += typo(s.slice(last, m.index), locale);
    if (m[1] !== undefined && m[2] !== undefined) {
      const { url, external } = href(m[2], locale);
      out += `<a href="${esc(url)}"${external ? ' rel="noopener"' : ''}>${inline(m[1], locale)}</a>`;
    } else if (m[3] !== undefined) {
      out += `<strong>${inline(m[3], locale)}</strong>`;
    } else if (m[4] !== undefined) {
      out += field(m[4]);
    }
    last = m.index + m[0].length;
  }
  return out + typo(s.slice(last), locale);
}

/** Identifiant d'ancre tiré d'un titre (sans accents). */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface Heading {
  id: string;
  text: string;
}

/** Titres de niveau 2 (sommaire), avec leur identifiant. */
export function headings(blocks: Block[]): Heading[] {
  return blocks.flatMap((b) => ('h2' in b ? [{ id: b.id ?? slugify(b.h2), text: b.h2 }] : []));
}

function table(head: string[], rows: string[][], locale: Locale): string {
  const th = head.map((h) => `<th scope="col">${inline(h, locale)}</th>`).join('');
  const tr = rows
    .map(
      (r) =>
        `<tr>${r
          .map((c, i) => (i === 0 ? `<td>${inline(c, locale)}</td>` : `<td data-label="${esc(typo(head[i] ?? '', locale))}">${inline(c, locale)}</td>`))
          .join('')}</tr>`,
    )
    .join('');
  return `<div class="tbl"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

/** Corps d'une page. */
export function renderBlocks(blocks: Block[], locale: Locale): string {
  return blocks
    .map((b) => {
      if ('h2' in b) return `<h2 id="${esc(b.id ?? slugify(b.h2))}">${inline(b.h2, locale)}</h2>`;
      if ('h3' in b) return `<h3${b.id ? ` id="${esc(b.id)}"` : ''}>${inline(b.h3, locale)}</h3>`;
      if ('p' in b) return `<p>${inline(b.p, locale)}</p>`;
      if ('ul' in b) return `<ul>${b.ul.map((li) => `<li>${inline(li, locale)}</li>`).join('')}</ul>`;
      if ('ol' in b) return `<ol>${b.ol.map((li) => `<li>${inline(li, locale)}</li>`).join('')}</ol>`;
      if ('note' in b) return `<p class="note">${inline(b.note, locale)}</p>`;
      if ('table' in b) return table(b.table.head, b.table.rows, locale);
      if ('subprocessors' in b) {
        const keys = Object.keys(SUBPROCESSORS) as SubprocessorKey[];
        const rows = keys.map((k) => [b.subprocessors.roles[k], `{{sub.${k}.provider}}`, `{{sub.${k}.location}}`, `{{sub.${k}.safeguard}}`]);
        return table(b.subprocessors.head, rows, locale);
      }
      return b.faq
        .map((f) => `<details><summary>${inline(f.q, locale)}</summary><div>${f.a.map((p) => `<p>${inline(p, locale)}</p>`).join('')}</div></details>`)
        .join('');
    })
    .join('\n');
}
