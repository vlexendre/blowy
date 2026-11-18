// Après le build : contrôle du référencement de chaque page de dist (src/lib/structured-data.ts, src/layouts/Base.astro).
// - un seul JSON-LD par page, qui se lit (JSON.parse), avec l'éditeur (Organization) et le site (WebSite) ;
// - landing de chaque langue : MobileApplication et FAQPage, dont les questions et réponses sont exactement celles
//   affichées par la section FAQ (même texte, même ordre) ;
// - quiz : WebPage avec fil d'Ariane ; pages légales : BreadcrumbList ;
// - jamais de note ni d'avis (aggregateRating, review) ;
// - pages indexées : bannière d'app `apple-itunes-app`, titre ≤ 60 caractères, description ≤ 155 ; pages en noindex :
//   pas de bannière (elles ont leur propre bouton « Ouvrir dans l'app »).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const LANGS = ['en', 'es', 'pt', 'nl'];

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const meta = (html, name) => {
  const m = html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

/** Questions et réponses visibles de la section FAQ (components/molecules/FaqItem.astro). */
function visibleFaq(html) {
  const block = html.match(/<div class="faq"[^>]*>([\s\S]*?)<\/div>\s*<img/);
  if (!block) return [];
  return [...block[1].matchAll(/<details[^>]*><summary[^>]*>([\s\S]*?)<span class="pl"[\s\S]*?<\/summary><div class="ans"[^>]*>([\s\S]*?)<\/div><\/details>/g)].map((m) => ({
    question: text(m[1]),
    answer: text(m[2]),
  }));
}

const errors = [];
let pages = 0;
for (const file of walk(dist)) {
  const rel = file.slice(dist.length).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const err = (m) => errors.push(`${rel} : ${m}`);
  pages++;

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  // Pages de redirection (astro.config.mjs › redirects) : pas de gabarit, pas de JSON-LD.
  if (/<meta http-equiv="refresh"/.test(html)) continue;
  if (blocks.length !== 1) {
    err(`${blocks.length} blocs JSON-LD (1 attendu)`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(blocks[0][1]);
  } catch (e) {
    err(`JSON-LD illisible (${e.message})`);
    continue;
  }
  if (data['@context'] !== 'https://schema.org' || !Array.isArray(data['@graph'])) err('@context ou @graph manquant');
  const graph = data['@graph'] ?? [];
  const byType = (t) => graph.filter((n) => n['@type'] === t);
  for (const t of ['Organization', 'WebSite']) if (byType(t).length !== 1) err(`${t} absent`);
  if (/aggregateRating|"review"/.test(blocks[0][1])) err('note ou avis dans le JSON-LD');

  const noindex = /<meta name="robots" content="noindex"/.test(html);
  const banner = meta(html, 'apple-itunes-app');
  if (noindex && banner) err('bannière apple-itunes-app sur une page en noindex');
  if (!noindex) {
    if (!banner || !/^app-id=\d+$/.test(banner)) err('bannière apple-itunes-app absente');
    const title = text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
    const description = meta(html, 'description') ?? '';
    if (title.length > 60) err(`titre de ${title.length} caractères (60 au plus) : ${title}`);
    if (description.length > 155) err(`description de ${description.length} caractères (155 au plus)`);
  }

  const isLanding = rel === 'index.html' || LANGS.some((l) => rel === `${l}/index.html`);
  const isQuiz = rel === 'quiz/index.html' || LANGS.some((l) => rel === `${l}/quiz/index.html`);
  const isLegal = /^(?:[a-z]{2}\/)?legal\//.test(rel);

  if (isLanding) {
    const app = byType('MobileApplication')[0];
    if (!app) err('MobileApplication absent');
    else {
      if (app.operatingSystem !== 'iOS' || app.applicationCategory !== 'SocialNetworkingApplication') err('MobileApplication incomplet');
      if (!/^https:\/\/apps\.apple\.com\/app\/id\d+$/.test(app.url)) err(`MobileApplication.url inattendue : ${app.url}`);
      if (app.offers?.price !== 0) err('MobileApplication sans offre gratuite');
      if (app.inLanguage !== html.match(/<html lang="([^"]+)"/)?.[1]) err('MobileApplication.inLanguage ≠ langue de la page');
    }
    const faq = byType('FAQPage')[0];
    const shown = visibleFaq(html);
    if (!faq) err('FAQPage absent');
    else if (shown.length === 0) err('section FAQ introuvable dans la page');
    else {
      const ld = faq.mainEntity.map((q) => ({ question: q.name.replace(/\s+/g, ' ').trim(), answer: q.acceptedAnswer.text.replace(/\s+/g, ' ').trim() }));
      if (ld.length !== shown.length) err(`FAQPage : ${ld.length} questions, ${shown.length} affichées`);
      ld.forEach((q, i) => {
        const s = shown[i];
        if (!s || q.question !== s.question) err(`FAQPage question ${i + 1} ≠ texte affiché : « ${q.question} » / « ${s?.question} »`);
        if (!s || q.answer !== s.answer) err(`FAQPage réponse ${i + 1} ≠ texte affiché : « ${q.answer} » / « ${s?.answer} »`);
      });
    }
  }
  if (isQuiz) {
    const page = byType('WebPage')[0];
    if (!page || page.breadcrumb?.['@type'] !== 'BreadcrumbList' || page.breadcrumb.itemListElement.length < 2) err('WebPage avec fil d’Ariane absente');
  }
  if (isLegal) {
    const bc = byType('BreadcrumbList')[0];
    if (!bc || bc.itemListElement.length < 2) err('BreadcrumbList absent');
    else bc.itemListElement.forEach((it, i) => it.position === i + 1 && /^https:\/\/minimoa\.app\//.test(it.item) && it.name || err(`fil d’Ariane : élément ${i + 1} invalide`));
  }
}

if (errors.length) {
  console.error(`check-structured-data : ${errors.length} erreur(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-structured-data : ${pages} pages, JSON-LD et méta conformes.`);
