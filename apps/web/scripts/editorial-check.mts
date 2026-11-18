/**
 * Contrôle des pages éditoriales (content/editorial), lancé par `pnpm test` :
 * - titres ≤ 60 caractères, descriptions ≤ 155, longueur des textes (villes 600-900 mots, guides 1 200-1 800) ;
 * - FAQ, villes proches, zones de quartier et liens internes valides ;
 * - contenu propre à chaque ville : deux villes ne partagent pas plus de 30 % de phrases identiques (le nom de la ville
 *   neutralisé), ni plus de 20 % de suites de 6 mots.
 * `--report` : affiche le détail (mots, similarité la plus forte).
 */
import { zoneById } from '@blowy/domain';
import { CITY_LIST, cityPath } from '../src/content/editorial/villes';
import { GUIDE_LIST, guidePath } from '../src/content/editorial/guides';
import { CITY_SLUGS, GUIDE_SLUGS, type CityPage } from '../src/content/editorial/types';
import { editorialUi } from '../src/content/editorial/ui';
import { cityTexts, cityWords, guideTexts, guideWords } from '../src/lib/editorial-pages';
import { plain } from '../src/lib/editorial-render';

const report = process.argv.includes('--report');
const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const internalPaths = new Set<string>([
  '/', '/quiz/', '/quartier/', editorialUi.cities.path, editorialUi.guides.path,
  ...CITY_SLUGS.map(cityPath), ...GUIDE_SLUGS.map(guidePath),
]);
function checkLinks(where: string, texts: readonly string[]): void {
  for (const t of texts) {
    for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = m[1]!;
      if (/^https:\/\//.test(href)) continue;
      if (!internalPaths.has(href)) fail(`${where} : lien interne inconnu ${href}`);
    }
    if (/<[a-z]/i.test(t)) fail(`${where} : HTML dans un texte (« ${t.slice(0, 40)} »)`);
  }
}
function checkMeta(where: string, title: string, description: string): void {
  if (title.length > 60) fail(`${where} : titre de ${title.length} caractères (> 60)`);
  if (description.length > 155) fail(`${where} : description de ${description.length} caractères (> 155)`);
}

// ── Villes ────────────────────────────────────────────────────────────────
for (const c of CITY_LIST) {
  const where = `ville ${c.slug}`;
  checkMeta(where, c.meta.title, c.meta.description);
  const words = cityWords(c);
  if (words < 600 || words > 900) fail(`${where} : ${words} mots (attendu 600-900)`);
  if (c.faq.length < 3 || c.faq.length > 4) fail(`${where} : ${c.faq.length} questions (attendu 3-4)`);
  if (new Set(c.near).size !== 3 || c.near.includes(c.slug)) fail(`${where} : villes proches invalides`);
  for (const z of c.quartier.zones) if (!zoneById(z)) fail(`${where} : zone inconnue ${z}`);
  checkLinks(where, cityTexts(c));
  if (report) console.log(`${c.slug.padEnd(12)} ${String(words).padStart(4)} mots`);
}

// ── Guides ────────────────────────────────────────────────────────────────
for (const g of GUIDE_LIST) {
  const where = `guide ${g.slug}`;
  checkMeta(where, g.meta.title, g.meta.description);
  const words = guideWords(g);
  if (words < 1200 || words > 1800) fail(`${where} : ${words} mots (attendu 1 200-1 800)`);
  if (g.sources.length === 0) fail(`${where} : aucune source`);
  for (const s of g.sources) if (!/^https:\/\//.test(s.url)) fail(`${where} : source sans lien https (${s.label})`);
  // Un chiffre cité renvoie à une source du guide : chaque lien externe du texte doit figurer dans `sources`.
  const urls = new Set(g.sources.map((s) => s.url));
  for (const t of guideTexts(g)) for (const m of t.matchAll(/\]\((https:[^)\s]+)\)/g)) if (!urls.has(m[1]!)) fail(`${where} : lien ${m[1]} absent des sources`);
  checkLinks(where, guideTexts(g));
  if (report) console.log(`${g.slug.padEnd(44)} ${String(words).padStart(5)} mots, ${g.sources.length} sources`);
}

// ── Similarité entre villes ───────────────────────────────────────────────
const NAMES = /\b(paris|lyon|bordeaux|toulouse|nantes|lille|marseille|rennes|montpellier|nice|strasbourg|parisiens?|lyonnais|bordelais|toulousains?|nantais|lillois|marseillais|rennais|montpelliérains?|niçois|strasbourgeois)\b/giu;
const norm = (s: string) => plain(s).toLowerCase().replace(NAMES, 'X').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
function sentences(c: CityPage): Set<string> {
  return new Set(
    cityTexts(c)
      .flatMap((t) => norm(t).split(/(?<=[.!?:;])\s+/))
      .map((s) => s.replace(/[.!?:;,]+$/, '').trim())
      .filter((s) => s.split(' ').length >= 4),
  );
}
function shingles(c: CityPage, n = 6): Set<string> {
  const w = cityTexts(c).map(norm).join(' ').replace(/[^\p{L}\d' ]/gu, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}
const inter = <T,>(a: Set<T>, b: Set<T>) => [...a].filter((x) => b.has(x)).length;
let worst = { pair: '', sent: 0, shingle: 0 };
for (let i = 0; i < CITY_LIST.length; i++) {
  for (let j = i + 1; j < CITY_LIST.length; j++) {
    const a = CITY_LIST[i]!;
    const b = CITY_LIST[j]!;
    const sa = sentences(a);
    const sb = sentences(b);
    const sent = inter(sa, sb) / Math.min(sa.size, sb.size);
    const ha = shingles(a);
    const hb = shingles(b);
    const shingle = inter(ha, hb) / Math.min(ha.size, hb.size);
    if (sent > 0.3) fail(`villes ${a.slug} / ${b.slug} : ${Math.round(sent * 100)} % de phrases identiques (> 30 %)`);
    if (shingle > 0.2) fail(`villes ${a.slug} / ${b.slug} : ${Math.round(shingle * 100)} % de suites de 6 mots communes (> 20 %)`);
    if (sent + shingle > worst.sent + worst.shingle) worst = { pair: `${a.slug} / ${b.slug}`, sent, shingle };
  }
}
if (report) console.log(`Similarité la plus forte : ${worst.pair} (${(worst.sent * 100).toFixed(1)} % de phrases, ${(worst.shingle * 100).toFixed(1)} % de suites de 6 mots)`);

if (problems.length) {
  console.error(`Pages éditoriales : ${problems.length} problème(s)\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Pages éditoriales : ${CITY_LIST.length} villes et ${GUIDE_LIST.length} guides conformes.`);
