// Vérifie que chaque maquette .dc.html de design/v5/project respecte facts.json.
// Contrôles : jours/dates 2026, chronologie (facts + « maintenant » de chaque écran), grille d'âge fixe et appartenance
// des tranches à la composition, phrases dérivées (taille du groupe, nouvelles personnes, + toi), prix, compteurs,
// prénoms et pets de tiers sur les cartes de partage, slugs publics, point médian dans boutons et titres, vocabulaire.
// Usage : node design/v5/check-facts.mjs   (code de sortie 1 s'il y a une contradiction)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const F = JSON.parse(readFileSync(join(here, 'facts.json'), 'utf8'));
const dir = join(here, 'project');
const only = process.argv[2];
const files = readdirSync(dir).filter((f) => f.endsWith('.dc.html') && (!only || f.includes(only)));
const get = (path) => path.split('.').reduce((o, k) => o?.[k], F);

const YEAR = 2026;
const MOIS = { janv: 0, janvier: 0, 'févr': 1, 'février': 1, mars: 2, avr: 3, avril: 3, mai: 4, juin: 5, juil: 6, juillet: 6, 'août': 7, sept: 8, septembre: 8, oct: 9, octobre: 9, nov: 10, novembre: 10, 'déc': 11, 'décembre': 11 };
const JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const NOMS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const clean = (s) => s.replace(/&nbsp;| | /g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
const visible = (html) => clean(html.replace(/<helmet>[\s\S]*?<\/helmet>/g, ' ').replace(/data-props='[^']*'/g, ' ').replace(/<[^>]+>/g, ' '));

const problems = [];
let checks = 0;
const push = (f, msg) => problems.push(`${f} : ${msg}`);
const t0 = (iso) => new Date(iso + (iso.length === 10 ? 'T00:00' : '') + ':00Z').getTime();

// --- 0. Cohérence interne de facts.json : chronologie déclarée
for (const [a, b] of F.chronologie) {
  checks++;
  if (!(t0(get(a)) < t0(get(b)))) push('facts.json', `chronologie : ${a} (${get(a)}) doit précéder ${b} (${get(b)})`);
}
checks++;
if (t0(F.sortie1.iso) - t0(F.sortie1.visagesIso) !== 3 * 3600e3) push('facts.json', 'visages de la sortie : exactement 3 h avant le début');

// --- grille d'âge
const G = F.grilleAges;
const starts = new Set(G.map((g) => g[0])), ends = new Set(G.map((g) => g[1]));
const parseRange = (s) => { const m = s.match(/(\d{2})–(\d{2})/); return m ? [Number(m[1]), Number(m[2])] : null; };
const comp = parseRange(F.groupe.ages);
const tranchesMembres = new Set(F.membres.map((m) => m.tranche).concat([F.toi.tranche]));
const prenomsTiers = F.tiers;
const taille = F.groupe.taille, nouvelles = taille - 1 - F.groupe.team;

for (const f of files) {
  const html = readFileSync(join(dir, f), 'utf8');
  const t = visible(html);
  const base = f.replace('.dc.html', '');

  // 1. Jours / dates réels
  const reDate = /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun\.|mar\.|mer\.|jeu\.|ven\.|sam\.|dim\.)\s+(\d{1,2})(?:er)?\s+(janvier|janv\.?|février|févr\.?|mars|avril|avr\.?|mai|juin|juillet|juil\.?|août|septembre|sept\.?|octobre|oct\.?|novembre|nov\.?|décembre|déc\.?)/gi;
  for (const m of t.matchAll(reDate)) {
    checks++;
    const d = new Date(Date.UTC(YEAR, MOIS[m[3].replace('.', '').toLowerCase()], Number(m[2])));
    if (d.getUTCDay() !== JOURS.indexOf(m[1].slice(0, 3).toLowerCase())) push(f, `« ${m[0]} » : c'est un ${NOMS[d.getUTCDay()]} en ${YEAR}`);
  }

  // 2. Chronologie par écran : un événement passé ne peut pas être affiché avant qu'il ait lieu, ni un événement futur après.
  const now = F.ecrans[base];
  if (now) {
    for (const [id, ev] of Object.entries(F.evenements)) {
      for (const p of ev.passe || []) { checks++; if (new RegExp(p).test(t) && t0(ev.iso) > t0(now)) push(f, `chronologie : « ${p} » affiché le ${now} alors que ${id} a lieu le ${ev.iso}`); }
      for (const p of ev.futur || []) { checks++; if (new RegExp(p).test(t) && t0(ev.iso) <= t0(now)) push(f, `chronologie : « ${p} » annoncé comme à venir le ${now} alors que ${id} a eu lieu le ${ev.iso}`); }
    }
  }

  // 3. Grille d'âge fixe : toute tranche « NN–MM ans » commence et finit sur la grille ; les tranches des membres sont dans la composition.
  for (const m of t.matchAll(/(\d{2})–(\d{2}) ans/g)) {
    checks++;
    const a = Number(m[1]), b = Number(m[2]);
    if (!starts.has(a) || !ends.has(b)) push(f, `tranche « ${m[0]} » hors grille fixe`);
    if (tranchesMembres.has(m[0]) && (a < comp[0] || b > comp[1])) push(f, `tranche « ${m[0]} » hors de la composition ${F.groupe.ages}`);
  }
  if (/\b\d{2} ans\b/.test(t.replace(/\d{2}–\d{2} ans/g, '').replace(/18 ans et plus|moins de 18 ans|dès 18 ans|\d{2} ans et plus/g, ''))) { checks++; push(f, 'âge exact affiché (« NN ans » hors tranche)'); }

  // 4. Phrases dérivées
  // « au moins N personnes » = garantie histoire ; « N personnes du quartier » = complément d'une sortie de bande ; « il manque N » = attente.
  for (const m of t.matchAll(/\b(\d+)\s+personnes(?!\s+(?:vérifiées|vérifié·es|de plus|en attente|qui))/gi)) {
    checks++;
    const n = Number(m[1]), before = t.slice(Math.max(0, m.index - 40), m.index), after = t.slice(m.index + m[0].length, m.index + m[0].length + 14);
    if (/au moins\s*$/i.test(before)) { if (n !== F.groupe.garantieHistoire) push(f, `« au moins ${m[0]} » : la garantie est de ${F.groupe.garantieHistoire}`); continue; }
    if (/^\s*du quartier/.test(after)) { const att = taille - 1 - F.bande.apresVote.length; if (n !== att) push(f, `« ${m[0]} du quartier » : ${taille} − toi − ta bande = ${att}`); continue; }
    if (/manque/i.test(before)) { if (n !== F.villeAttente.manquent) push(f, `« il manque ${m[0]} » : ${F.villeAttente.manquent} attendu`); continue; }
    if (n < 10 && n !== taille) push(f, `« ${m[0]} » : le groupe fait ${taille} personnes`);
  }
  const nouvAttendu = /Amorcage/.test(f) ? taille - F.amorcage.team : nouvelles;
  for (const m of t.matchAll(/\b(\d+)\s+(?:nouvelles personnes|inconnu·es|inconnus|personnes que je ne connais pas)/gi)) { checks++; if (Number(m[1]) !== nouvAttendu) push(f, `« ${m[0]} » : ${taille} − toi − ta team = ${nouvAttendu}`); }
  for (const m of t.matchAll(/\b(\d+)\s*\+\s*toi\b/g)) { checks++; if (Number(m[1]) !== taille - 1) push(f, `« ${m[0]} » : ${taille - 1} + toi attendu`); }
  for (const m of t.matchAll(/on était\s+(\d+)/gi)) { checks++; if (Number(m[1]) !== taille) push(f, `« ${m[0]} »`); }
  for (const m of t.matchAll(/(\d+) sur (\d+) arrivé/g)) { checks++; if (Number(m[2]) !== taille || Number(m[1]) > taille) push(f, `« ${m[0]} »`); }
  for (const m of t.matchAll(/(\d+) femmes, (\d+) hommes/g)) { checks++; if (Number(m[1]) + Number(m[2]) !== taille && !/Lille|amorçage/i.test(t)) push(f, `« ${m[0]} » ne fait pas ${taille}`); }
  for (const m of t.matchAll(/places? (?:sont )?prises/g)) { checks++; push(f, `« ${m[0]} » : pas de notion de places prises`); }

  // 5. Prix
  const allowed = new Set(F.prix.autorises.map((p) => p.replace(/\s/g, '')));
  for (const m of t.matchAll(/(\d+(?:,\d{2})?)\s?€/g)) { checks++; if (!allowed.has(m[1] + '€')) push(f, `prix « ${m[0]} » absent de facts.json`); }

  // 6. Compteurs
  for (const m of t.matchAll(/\b(\d+)\s+souvenirs?\b/g)) { checks++; if (![F.souvenirs, 1, 5].includes(Number(m[1]))) push(f, `« ${m[0]} » : ${F.souvenirs} souvenirs`); }
  for (const m of t.matchAll(/\b(\d+)\s+dans ta bande\b/g)) { checks++; const ok = now && t0(now) >= t0(F.sortie1.votesCloseIso) ? F.bande.apresVote.length : F.bande.avantVote.length; if (Number(m[1]) !== ok) push(f, `« ${m[0]} » : ${ok} dans ta bande à cette date`); }
  for (const m of t.matchAll(/(\d+)\s*\/\s*(\d+)\s+personnes/g)) { checks++; push(f, `« ${m[0]} » : plus de seuil abstrait (décision A)`); }

  // 7. Cartes de partage : aucun prénom de tiers, aucun pet d'un autre membre
  if (/Partage/.test(f)) {
    const card = clean(html.replace(/<helmet>[\s\S]*?<\/helmet>/g, ' ').replace(/<[^>]+>/g, ' '));
    for (const p of prenomsTiers) { checks++; if (new RegExp(`(?<![\\wÀ-ÿ])${p}(?![\\wÀ-ÿ])`, "i").test(card)) push(f, `carte de partage : prénom d'un tiers « ${p} »`); }
    for (const id of F.petsDesAutres) { checks++; if (html.includes(id)) push(f, `carte de partage : pet d'un autre membre (${id.slice(0, 6)})`); }
  }

  // 8. Slugs publics : jamais un prénom
  for (const m of t.matchAll(/blowy\.app\/([\w-]+)(?:\/([\w-]+))?/gi)) {
    checks++;
    const segs = [m[1], m[2]].filter(Boolean).map((s) => s.toLowerCase());
    if (segs.some((s) => [F.toi.prenom, ...prenomsTiers].map((p) => p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')).includes(s))) push(f, `slug « ${m[0]} » contient un prénom`);
  }

  // 9. Point médian dans les libellés de boutons et les titres (VoiceOver)
  const blocks = [...html.matchAll(/<(button|h1|h2)\b[^>]*>([\s\S]*?)<\/\1>/g), ...html.matchAll(/<a\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
  for (const b of blocks) {
    checks++;
    const inner = clean((b[2] ?? b[1]).replace(/<[^>]+>/g, ' '));
    if (/[a-zàâçéèêëîïôûùüÿœ]·[a-zàâçéèêëîïôûùüÿœ]/i.test(inner)) push(f, `point médian dans un bouton ou un titre : « ${inner.trim().slice(0, 50)} »`);
  }

  // 10. Vocabulaire unique et promesses fausses
  const banned = ['ngl', 'XP', 'compte à rebours', 'près de toi', 'près de chez toi', 'en route', 'boisson incluse', 'Code Names', 'App Store', 'Restaurer mes achats', 'remboursé·e', 'Personne n’apprend jamais', 'Ta vision', 'ville fermée', 'pas encore ouvert', 'Alerte', 'alerte', 'photos la veille', 'Ami·e'];
  for (const w of banned) {
    checks++;
    if (new RegExp(`(?<![\\w-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(t)) push(f, `terme interdit « ${w} »`);
  }
}

console.log(`check-facts : ${files.length} fichiers, ${checks} vérifications, ${problems.length} contradiction(s).`);
for (const p of problems) console.log('  ✗ ' + p);
process.exit(problems.length ? 1 : 0);
