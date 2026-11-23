/**
 * `pnpm i18n:check` — vérifie les textes de Blowy dans les cinq langues (voir docs/I18N.md).
 *
 * Échoue (code 1) si :
 * - une langue a une clé en trop ou en moins par rapport au français (garde-fou en plus des types) ;
 * - le mot « pet » apparaît dans un texte français vu par les gens (dictionnaires, écrans, kit d'interface, site) ;
 * - un composant du kit d'interface (`packages/ui`) contient un texte écrit en dur ;
 * - un dictionnaire du site (`apps/web/src/content`) n'a pas la même forme dans les cinq langues, renvoie au français
 *   (`TODO` : interdit sur le site, chaque langue est publiée), ou dit « pet » dans une langue.
 * - un texte vu par les gens (app et `packages/content`, cinq langues) contient une formule punitive : « en danger »,
 *   « boude », « tu vas perdre », « dernière chance »… (liste `FORBIDDEN`, section 5) ;
 * - un texte de l'app (cinq langues) parle d'une fonction retirée : défi, habitude, ligue, trophée, étincelle, bilan,
 *   preuve, vies d'un lien… (liste `RETIRED`, exceptions écrites dans `RETIRED_ALLOWED`, section 6) ;
 * - un texte légal du site (`apps/web/src/content/legal`) parle encore des vies d'un lien ou d'un lien « en danger »
 *   (liste `LEGAL_RETIRED`, section 7) ;
 * Affiche ensuite, pour chaque langue, le nombre de textes encore en français (`TODO`) par dictionnaire.
 * `--list` affiche aussi les clés non traduites.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  LOCALES,
  type Messages,
  SOURCE_LOCALE,
  TODO,
  contentDictionaries,
  leafPaths,
  shapeMismatches,
  untranslatedPaths,
} from '../packages/content/src/index';
import { registeredMessages } from '../apps/mobile/src/locales/runtime';
import { siteDictionaries } from '../apps/web/src/content/registry';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const list = process.argv.includes('--list');
const problems: string[] = [];

// ── 1. Les dictionnaires ─────────────────────────────────────────────────────

const localesDir = path.join(root, 'apps/mobile/src/locales');
const appDictionaries: Record<string, Messages<unknown>> = {};
for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith('.ts') && f !== 'runtime.ts' && f !== 'content.ts' && !f.endsWith('.test.ts'))) {
  const mod = (await import(path.join(localesDir, file))) as Record<string, unknown>;
  for (const [name, value] of Object.entries(mod)) {
    const entry = registeredMessages().find((r) => r.target === value);
    if (entry) appDictionaries[`app/${file.replace(/\.ts$/, '')}.${name}`] = entry.source;
  }
}
const all: Record<string, Messages<unknown>> = {
  ...appDictionaries,
  ...Object.fromEntries(Object.entries(contentDictionaries).map(([k, v]) => [`content/${k}`, v])),
};

for (const [name, m] of Object.entries(all)) {
  for (const locale of LOCALES) {
    if (locale === SOURCE_LOCALE) continue;
    const bad = shapeMismatches(m.dictionaries.fr, (m.dictionaries as Record<string, unknown>)[locale]);
    for (const b of bad) problems.push(`${name} [${locale}] : clé ${b}`);
  }
}

// ── 2. « pet » dans les textes français ──────────────────────────────────────

const PET = /(^|[^\p{L}\w/.:{-])pets?(?![\p{L}\w/.:}-])/iu;
/** Un identifiant (« pet », « yearly ») est une donnée, pas un texte lu. */
const isIdentifier = (s: string): boolean => /^[a-z_]+$/.test(s);
const SAMPLES: unknown[][] = [
  ['Nino', 'Léa', 'Malo', 'Suzie'],
  [2, 3, 4, 5],
  ['Nino', 2, 'Léa', 3],
  [2, 'Nino', 3, 'Léa'],
  [{ messages: 2, photos: 2, daysTogether: 2, petName: 'Nino', outings: 2, habitsKept: 2, challengesDone: 2, streak: 2, displayName: 'Léa', fromName: 'Malo', fromPetName: 'Suzie', otherName: 'Malo', otherPetName: 'Suzie', appUrl: 'https://blowy.app', reason: 'raison', name: 'Léa', minimoa: 'Nino', count: '3', days: '3', item: 'bonnet', endsOn: '22 novembre', price: '4,99 €' }],
  [['Léa', 'Malo']],
];

/** Toutes les chaînes d'un dictionnaire, fonctions appelées avec des valeurs d'exemple. */
function strings(value: unknown, at: string, out: { at: string; text: string }[], depth = 0): void {
  if (depth > 8 || value === TODO) return;
  if (typeof value === 'string') out.push({ at, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${at}[${i}]`, out, depth + 1));
  else if (typeof value === 'function') {
    for (const args of SAMPLES) {
      try {
        strings((value as (...a: unknown[]) => unknown)(...args), `${at}()`, out, depth + 1);
      } catch {
        // signature différente : l'échantillon suivant
      }
    }
  } else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) strings(v, at ? `${at}.${k}` : k, out, depth + 1);
}

for (const [name, m] of Object.entries(all)) {
  const found: { at: string; text: string }[] = [];
  strings(m.in(SOURCE_LOCALE), '', found);
  const seen = new Set<string>();
  for (const { at, text } of found) {
    if (isIdentifier(text) || !PET.test(text) || seen.has(at)) continue;
    seen.add(at);
    problems.push(`${name}.${at} : « pet » dans « ${text} »`);
  }
}

// ── 3. Textes écrits en dur dans le code ─────────────────────────────────────

const walk = (dir: string, out: string[] = []): string[] => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (!['node_modules', 'dev', 'legal'].includes(f.name)) walk(p, out);
    } else if (/\.(ts|tsx)$/.test(f.name) && !/\.(test|spec|d)\.tsx?$/.test(f.name)) out.push(p);
  }
  return out;
};

/** Littéraux de texte d'un fichier (pas les imports ni les commentaires). */
function literals(file: string): { line: number; text: string; jsx: boolean }[] {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: { line: number; text: string; jsx: boolean }[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    let text: string | null = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) text = n.text;
    else if (ts.isJsxText(n)) text = n.text.trim();
    if (text) out.push({ line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, text, jsx: ts.isJsxText(n) });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const rel = (p: string): string => path.relative(root, p);
// Écrans, kit d'interface et site : « pet » interdit dans un texte.
for (const dir of ['apps/mobile/app', 'apps/mobile/src/features', 'apps/mobile/src/core', 'packages/ui/src', 'apps/web/src/content', 'apps/web/src/pages', 'apps/web/src/components']) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) for (const l of literals(file)) if (/\s/.test(l.text.trim()) && PET.test(l.text)) problems.push(`${rel(file)}:${l.line} : « pet » dans « ${l.text.trim().slice(0, 80)} »`);
}
// Kit d'interface : aucun texte en français écrit en dur (les mots arrivent en props ou par `UiStringsProvider`).
const FRENCH = /[a-zàâçéèêëîïôûùüÿœ’]{2,}[  ][a-zàâçéèêëîïôûùüÿœ’]{2,}|^(Retour|Fermer|Ajouter|Envoyer|Annuler|Valider|Options|Suivant|Passer)$/i;
for (const file of walk(path.join(root, 'packages/ui/src'))) {
  for (const l of literals(file)) {
    const t = l.text.trim();
    if (!t || /^[\w.:/@#%-]+$/.test(t)) continue;
    if ((l.jsx || FRENCH.test(t)) && /[a-zà-ÿ]/i.test(t) && !/^(left|right|center|top|bottom)( \w+)*$/.test(t)) problems.push(`${rel(file)}:${l.line} : texte en dur « ${t.slice(0, 60)} »`);
  }
}

// ── 4. Le site (apps/web) : cinq langues complètes ──────────────────────────

/** Feuilles dont la forme diffère du français (types : clés, tableaux, fonctions), et toute trace de `TODO`. */
function siteShape(fr: unknown, other: unknown, at: string, out: string[]): void {
  if (other === TODO) return void out.push(`${at || '(tout)'} : TODO`);
  if (typeof fr === 'function' || typeof fr === 'string' || typeof fr === 'number' || typeof fr === 'boolean') {
    if (typeof other !== typeof fr) out.push(`${at} : ${typeof other} au lieu de ${typeof fr}`);
    return;
  }
  if (Array.isArray(fr)) {
    if (!Array.isArray(other)) return void out.push(`${at} : pas un tableau`);
    other.forEach((v, i) => fr.length && siteShape(fr[Math.min(i, fr.length - 1)], v, `${at}[${i}]`, out));
    return;
  }
  if (fr && typeof fr === 'object') {
    if (!other || typeof other !== 'object') return void out.push(`${at} : pas un objet`);
    const a = Object.keys(fr);
    const b = Object.keys(other);
    for (const k of a) if (!b.includes(k)) out.push(`${at}.${k} : manquant`);
    for (const k of b) if (!a.includes(k)) out.push(`${at}.${k} : en trop`);
    for (const k of a) if (b.includes(k)) siteShape((fr as Record<string, unknown>)[k], (other as Record<string, unknown>)[k], at ? `${at}.${k}` : k, out);
  }
}
let siteLeaves = 0;
for (const [name, d] of Object.entries(siteDictionaries)) {
  siteLeaves += leafPaths(d.fr).length;
  for (const locale of LOCALES) {
    const found: string[] = [];
    if (locale !== SOURCE_LOCALE) siteShape(d.fr, d[locale], '', found);
    for (const f of found) problems.push(`web/${name} [${locale}] : ${f}`);
    const texts: { at: string; text: string }[] = [];
    strings(d[locale], '', texts);
    const seen = new Set<string>();
    for (const { at, text } of texts) {
      if (isIdentifier(text) || !PET.test(text) || seen.has(at)) continue;
      seen.add(at);
      problems.push(`web/${name} [${locale}].${at} : « pet » dans « ${text} »`);
    }
  }
}
console.log(`Site : ${siteLeaves} textes français dans ${Object.keys(siteDictionaries).length} dictionnaires, traduits dans les quatre autres langues.`);

// ── 5. Aucun reproche : mots et tournures interdits dans les cinq langues ───

/**
 * Un texte vu par les gens n'est jamais punitif : ni série « en danger », ni menace de perte, ni compte à rebours de
 * perte, ni minimoa malheureux comme levier, ni culpabilité (ADA-2027 item 15). Une expression par ligne ; ajoute-en
 * une ici quand une formule de ce genre est repérée. La liste est vérifiée sur tous les dictionnaires, dans chaque langue.
 */
const FORBIDDEN: Record<(typeof LOCALES)[number], RegExp[]> = {
  fr: [/en danger/i, /\bbou(de|der|dait|dent|dé|dée)\b/i, /tu vas (le |la |l’)?perdre/i, /tu risques de (le |la |l’)?perdre/i, /dernière chance/i, /dernières? (minutes?|heures?) pour/i, /\bil manque toi\b/i, /les autres comptent (sur toi|dessus)/i, /série (perdue|brisée|cassée)/i, /avant minuit/i, /repart(ir)? de zéro/i, /à zéro/i, /plus de vies/i, /fantômes?/i, /jamais plus/i, /tu as (perdu|raté) ta série/i, /avant (qu’elle|qu’il|de) (s’éteigne|disparaisse|perdre)/i, /ne (le|l’)abandonne pas/i, /(il|elle) (est|va être) (triste|déçu)/i, /tu l’as (déçu|abandonné|laissé tomber)/i, /sinon (tu|ta série|il|elle) (perds?|perdra|s’arrête)/i, /\bpar ta faute\b/i],
  en: [/in danger/i, /at risk/i, /\bsulk/i, /you(’|')?ll lose/i, /you(’|')?re about to lose/i, /(about|going) to lose/i, /last chance/i, /don(’|')?t lose/i, /streak (lost|broken)/i, /before midnight/i, /back to zero/i, /no lives left/i, /ghosts?\b/i, /\bmoping\b/i, /you (lost|broke) your streak/i, /before it (ends|disappears|dies)/i, /\bsad(?!dle)\b/i, /let (him|them|it) down/i, /your fault/i, /others are counting on you/i],
  es: [/en peligro/i, /\bpor ti\b.*\btriste\b/i, /vas a perder/i, /puedes perder/i, /última oportunidad/i, /\bmalhumorad/i, /\bse (enfada|ha enfadado)\b/i, /racha (perdida|rota)/i, /antes de (la )?medianoche/i, /vuelve a cero/i, /sin vidas/i, /fantasmas?\b/i, /enfurruñ/i, /perdiste tu racha/i, /antes de que (se acabe|desaparezca|se apague)/i, /\btriste\b/i, /(le|lo) has (decepcionado|abandonado)/i, /tu culpa/i, /cuentan contigo/i, /\bse echa de menos\b/i],
  pt: [/em perigo/i, /\bbirra\b/i, /\bfazendo birra/i, /vai(s)? perder/i, /você vai perder/i, /pode(s)? perder/i, /última chance/i, /sequência (perdida|quebrada)/i, /antes da meia-noite/i, /volta a zero/i, /acabaram as vidas/i, /fantasmas?\b/i, /emburrad/i, /você perdeu sua sequência/i, /antes que (acabe|desapareça|se apague)/i, /\btriste\b/i, /decepcion/i, /sua culpa/i, /contam com você/i, /\bamuado/i],
  nl: [/in gevaar/i, /\bpruil/i, /je gaat .* verliezen/i, /je verliest/i, /laatste kans/i, /reeks (verloren|verbroken|kwijt)/i, /v[oó]{2}r middernacht/i, /weer bij nul/i, /geen levens meer/i, /\bspoken\b/i, /\bmokt\b/i, /\bik mok\b/i, /je (reeks|serie) (is )?(verloren|kwijt|verbroken)/i, /voordat (het|hij|ze) (afloopt|verdwijnt|uitgaat)/i, /\bverdrietig\b/i, /teleurgesteld/i, /jouw schuld/i, /rekenen op je/i, /\bchagrijnig\b/i],
};
for (const [name, m] of Object.entries(all)) {
  for (const locale of LOCALES) {
    const found: { at: string; text: string }[] = [];
    strings((m.dictionaries as Record<string, unknown>)[locale], '', found);
    const seen = new Set<string>();
    for (const { at, text } of found) {
      // Seul cas légitime : l'alerte de sécurité « En danger immédiat ? Appelle le 17 ou le 112. »
      if (seen.has(at) || /reportEmergency/.test(at)) continue;
      const hit = FORBIDDEN[locale].find((re) => re.test(text));
      if (!hit) continue;
      seen.add(at);
      problems.push(`${name} [${locale}].${at} : formule punitive (${hit.source}) dans « ${text.slice(0, 90)} »`);
    }
  }
}

// ── 6. Fonctions retirées : aucun mot de ligue, défi, habitude… dans les textes de l'app ───

/**
 * Règle App Store 2.5.19 (docs/ADA-2027.md) : une fonction retirée de l'app ne laisse aucun texte (pas de fonction cachée
 * ou en sommeil). Un texte de l'app (`apps/mobile/src/locales`, cinq langues) ne parle donc plus de défis, d'habitudes, de
 * ligue, de trophées, d'étincelles, de bilans, de preuves ni de vies d'un lien. Une expression par langue ; les exceptions sont écrites
 * dans `RETIRED_ALLOWED`, avec leur raison.
 */
const word = (alts: string): RegExp => new RegExp(`(?<![\\p{L}])(?:${alts})(?![\\p{L}])`, 'iu');
/**
 * Vies d'un lien (ADA-2027 item 27) : seulement au sens mécanique (« 3 vies », « vies sur 7 », « une vie de plus »,
 * « coûte une vie », « 7 lives », « lives left »…). « La vie », « comment tu vois la vie », « lives nearby »,
 * « la vida », « het leven » restent des mots courants et ne sont pas visés.
 */
const N = '\\d+[\\s\\u00a0\\u202f]';
const LIVES: Record<(typeof LOCALES)[number], string> = {
  fr: `${N}vies?|vies sur|vies? du lien|une vie de plus|une seule vie|(?:perd|perdu|coûte|regagne|rend)\\S* une vie|plus de vies?|cœurs? du lien`,
  en: `${N}lives?|lives? (?:out of|left)|one more life|extra life|(?:lose|lost|costs?|gain|regain)s? (?:the link )?a life`,
  es: `${N}vidas?|vidas? de \\d|una vida más|una sola vida|(?:pierde|cuesta|gana)\\S* una vida`,
  pt: `${N}vidas?|vidas? de \\d|uma vida a mais|uma vida só|(?:perde|custa|ganha)\\S* uma vida`,
  nl: `${N}levens?|levens? van \\d|één leven erbij|kost (?:\\S+ ){0,2}een leven`,
};
const RETIRED: Record<(typeof LOCALES)[number], RegExp> = {
  fr: word(`défis?|habitudes?|ligues?|trophées?|étincelles?|bilans?|preuves?|${LIVES.fr}`),
  en: word(`challenges?|habits?|leagues?|trophy|trophies|sparks?|recaps?|reviews?|proofs?|${LIVES.en}`),
  es: word(`retos?|desafíos?|hábitos?|ligas?|trofeos?|chispas?|balances?|pruebas?(?! gratu| gratis)|${LIVES.es}`),
  pt: word(`desafios?|hábitos?|ligas?|troféus?|faíscas?|balanços?|provas?|${LIVES.pt}`),
  nl: word(`uitdagingen|uitdaging|gewoontes?|gewoonte|competities?|trofee(?:ën|ëen|s)?|vonken|vonk|terugblikken?|bewijs|${LIVES.nl}`),
};
/**
 * Exceptions : le texte reste, avec la raison. `dict` = dictionnaire (`app/<fichier>.<nom>`), `at` = chemin de la clé.
 * Rien d'autre n'est toléré : un texte de fonction retirée se supprime, il ne se met pas ici.
 */
const RETIRED_ALLOWED: { dict: RegExp; at: RegExp; why: string }[] = [
  { dict: /^app\/moi\.moi$/, at: /^supprimer\./, why: 'écran de suppression du compte : liste honnête de ce qui est effacé (RGPD), y compris les données d’anciennes versions' },
  { dict: /^app\/moi\.moi$/, at: /^notifications\.rows\.trial_reminder\./, why: 'es : « prueba » = l’essai gratuit de Minimoa+ (faux ami de « preuve »)' },
  { dict: /^app\/plus\.plus$/, at: /^timeline\[/, why: 'es : « prueba » = l’essai gratuit de Minimoa+ (faux ami de « preuve »)' },
];
for (const [name, m] of Object.entries(appDictionaries)) {
  for (const locale of LOCALES) {
    const found: { at: string; text: string }[] = [];
    strings((m.dictionaries as Record<string, unknown>)[locale], '', found);
    const seen = new Set<string>();
    for (const { at, text } of found) {
      if (seen.has(at) || isIdentifier(text)) continue;
      const hit = RETIRED[locale].exec(text);
      if (!hit) continue;
      if (RETIRED_ALLOWED.some((a) => a.dict.test(name) && a.at.test(at))) continue;
      seen.add(at);
      problems.push(`fonction retirée : ${name}.${at} [${locale}] « ${hit[0]} » dans « ${text.slice(0, 90)} »`);
    }
  }
}

// ── 7. Textes légaux du site : pas de vies d'un lien, pas de lien « en danger » ───

/**
 * Relecture du 23/11/2026 (ADA-2027 item 27) : la politique de confidentialité et les conditions ne décrivent plus de
 * mécanique retirée. Le garde-fou de la section 6 ne lit que l'app ; ici, les fichiers de `apps/web/src/content/legal`
 * (cinq langues), avec une liste propre : les vies d'un lien (le pluriel suffit, les textes légaux n'emploient jamais
 * « vies » au sens courant) et un lien ou une série « en danger ». Les urgences (« En danger immédiat ? Appelle le 112 »,
 * « enfance en danger ») ne sont pas visées : seul un lien ou une série l'est.
 */
const LEGAL_RETIRED: Record<(typeof LOCALES)[number], RegExp> = {
  fr: new RegExp(`${LIVES.fr}|(?<![\\p{L}])vies(?![\\p{L}])|(?:liens?|séries?)(?: ou (?:liens?|séries?))? en danger`, 'iu'),
  en: new RegExp(`${LIVES.en}|(?<![\\p{L}])lives(?![\\p{L}])|(?:connections?|links?|streaks?)(?: or (?:connections?|links?|streaks?))? (?:in danger|at risk)`, 'iu'),
  es: new RegExp(`${LIVES.es}|(?<![\\p{L}])vidas(?![\\p{L}])|(?:vínculos?|rachas?)(?: o (?:vínculos?|rachas?))? en peligro`, 'iu'),
  pt: new RegExp(`${LIVES.pt}|(?<![\\p{L}])vidas(?![\\p{L}])|(?:vínculos?|sequências?)(?: ou (?:vínculos?|sequências?))? em perigo`, 'iu'),
  nl: new RegExp(`${LIVES.nl}|(?<![\\p{L}])levens(?![\\p{L}])|(?:band(?:en)?|reeks(?:en)?)(?: of (?:band(?:en)?|reeks(?:en)?))? in gevaar`, 'iu'),
};
const legalRoot = path.join(root, 'apps/web/src/content/legal');
for (const locale of LOCALES) {
  const dir = path.join(legalRoot, locale);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const file = path.join(dir, f);
    for (const l of literals(file)) {
      const hit = LEGAL_RETIRED[locale].exec(l.text);
      if (hit) problems.push(`texte légal, fonction retirée : ${rel(file)}:${l.line} « ${hit[0]} » dans « ${l.text.slice(0, 90)} »`);
    }
  }
}

// ── Rapport ──────────────────────────────────────────────────────────────────

const totalLeaves = Object.values(all).reduce((n, m) => n + leafPaths(m.dictionaries.fr).length, 0);
console.log(`Textes français : ${totalLeaves} clés dans ${Object.keys(all).length} dictionnaires (${Object.keys(appDictionaries).length} de l'app, ${Object.keys(contentDictionaries).length} partagés).`);
for (const locale of LOCALES) {
  if (locale === SOURCE_LOCALE) continue;
  let missing = 0;
  const detail: string[] = [];
  for (const [name, m] of Object.entries(all)) {
    const paths = untranslatedPaths(m.dictionaries.fr, (m.dictionaries as Record<string, unknown>)[locale]);
    missing += paths.length;
    if (paths.length && list) detail.push(`    ${name} (${paths.length}) : ${paths.join(', ')}`);
  }
  console.log(`  ${locale} : ${totalLeaves - missing} traduites, ${missing} encore en français (TODO)`);
  if (detail.length) console.log(detail.join('\n'));
}

if (problems.length) {
  console.error(`\n${problems.length} problème(s) :\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('i18n : OK');
