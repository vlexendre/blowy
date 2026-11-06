// Vérifie que chaque maquette .dc.html de design/v5/project respecte facts.json.
// Contrôles : jours/dates 2026, chronologie (facts + « maintenant » de chaque écran), grille d'âge fixe et appartenance
// des tranches à la composition, phrases dérivées (taille du groupe, nouvelles personnes, + toi), prix, compteurs,
// prénoms et pets de tiers sur les cartes de partage, slugs publics, point médian dans boutons et titres, vocabulaire.
// + V5.3 : garantie jamais affichée, calendrier B (annulation gratuite jusqu'à la veille 18 h), confirmation = prénoms + tranches + pets sans visage,
// duo sans prénom avant le oui, accord avant tout duo, un lien unique par carte, lien privé jamais en Story, « pote / team » hors titres et boutons.
// + V5.4 : aucun signal de compatibilité, règle d'annulation unique (imprévu 1×/trimestre), carte Duo = pet + initiale, 3 duos actifs, Blowy+ jamais en achat intégré, liens ≥ 8 / 12 caractères.
// Usage : node design/v5/check-facts.mjs [filtre]   (code de sortie 1 s'il y a une contradiction)
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
const seenSlug = {};
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

checks++;
if ('garantieHistoire' in F.groupe) problems.push('facts.json : la garantie ne doit plus être une donnée affichable (A.1)');

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
  if (/\b\d{2} ans\b/.test(t.replace(/\d{2}–\d{2} ans/g, '').replace(/18 ans et plus|18 ans ou plus|moins de 18 ans|dès 18 ans|\d{2} ans et plus/g, ''))) { checks++; push(f, 'âge exact affiché (« NN ans » hors tranche)'); }

  // 4. Phrases dérivées
  // « au moins N personnes » = garantie histoire ; « N personnes du quartier » = complément d'une sortie de bande ; « il manque N » = attente.
  for (const m of t.matchAll(/\b(\d+)\s+personnes(?!\s+(?:vérifiées|vérifié·es|de plus|en attente|qui))/gi)) {
    checks++;
    const n = Number(m[1]), before = t.slice(Math.max(0, m.index - 40), m.index), after = t.slice(m.index + m[0].length, m.index + m[0].length + 14);
    if (/^\s*du quartier/.test(after)) { const att = taille - 1 - F.bande.apresVote.length; if (n !== att) push(f, `« ${m[0]} du quartier » : ${taille} − toi − ta bande = ${att}`); continue; }
    if (/manque/i.test(before)) { if (n !== F.villeAttente.manquent) push(f, `« il manque ${m[0]} » : ${F.villeAttente.manquent} attendu`); continue; }
    if (/^\s*du même genre/.test(after)) { if (n !== 3) push(f, `règle d'équilibre : 3 du même genre au plus`); continue; }
    if (/Amorcage\.dc/.test(f) && /^\s*de Lille/.test(after)) { if (n !== taille - F.amorcage.team) push(f, `« ${m[0]} de Lille » : ${taille - F.amorcage.team} attendu`); continue; }
    if (/Amorcage\.dc/.test(f) && /^\s*viennent/.test(after)) { if (n !== F.amorcage.team) push(f, `« ${m[0]} viennent ensemble » : ${F.amorcage.team} attendu`); continue; }
    if (/à découvrir|toi compris/.test(after) || /^\s*,\s*toi compris/.test(after)) continue;
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

  // 9b. Vocabulaire adulte dans les titres et boutons (D.15) : jamais « pote(s) » ni « team »
  for (const b of blocks) {
    const inner = clean((b[2] ?? b[1]).replace(/<[^>]+>/g, ' '));
    if (/\b(potes?|team)\b/i.test(inner)) { checks++; push(f, `« pote / team » dans un titre ou un bouton : « ${inner.trim().slice(0, 50)} »`); }
  }

  // 11. Calendrier B : toute annulation gratuite de la sortie 1 s'arrête à la confirmation de la veille 18 h
  for (const m of t.matchAll(/[Aa]nnul\w*[^.]{0,30}?gratuit\w*[^.]{0,20}?jusqu’(?:à|au)\s+([^.,;]+)/g)) {
    checks++;
    const tail = m[1];
    if (/12 nov|16 h 30|visages/.test(tail) || (/11 nov/.test(tail) && !/18 h/.test(tail))) push(f, `annulation gratuite « ${m[0].slice(0, 70)} » : jusqu’à ${F.sortie1.lieuCourt} (calendrier B)`);
  }
  // 12. Confirmation de la veille : prénoms + tranches + pets, jamais de visage
  if (base === 'V5-Confirmation') {
    for (const mb of F.membres) { checks++; if (!t.includes(mb.prenom) || !t.includes(mb.tranche) || !t.includes(mb.pet)) push(f, `confirmation : ${mb.prenom}, sa tranche et son pet attendus`); }
    checks++; if (/Visage de/.test(html)) push(f, 'confirmation : aucun visage avant J −3 h');
  }
  // 13. Duo : avant le double oui, initiale seulement
  if (base === 'V5-Duo' || base === 'V5-Duo-choix') { checks++; if (new RegExp(`(?<![\\wÀ-ÿ])${F.duos.nils.prenom}(?![\\wÀ-ÿ])`).test(t)) push(f, `prénom « ${F.duos.nils.prenom} » avant le oui mutuel`); }
  // 14. Liens : un lien par carte, jamais réutilisé ; un lien privé jamais à côté d'une cible Story
  const slugsHere = [...t.matchAll(/blowy\.app\/[\w-]+\/[\w-]+/g)].map((m) => m[0]);
  const own = F.slugParFichier[base];
  for (const sl of slugsHere) {
    checks++;
    const key = Object.keys(F.slugs).find((k) => F.slugs[k] === sl);
    if (!key) { push(f, `lien « ${sl} » absent de facts.slugs`); continue; }
    if (own && key !== own) push(f, `lien « ${sl} » (${key}) sur la carte « ${own} » : un lien par carte`);
    if (!own && /Partage/.test(f)) push(f, `carte sans lien attribué dans facts.slugParFichier`);
    if (F.slugsPrives.includes(key) && />Story</.test(html)) { checks++; push(f, `lien privé « ${sl} » publiable en Story`); }
    seenSlug[sl] = seenSlug[sl] || new Set(); seenSlug[sl].add(base);
  }

  // 15. V5.4 · Règle d'annulation unique : texte canonique (la date peut remplacer « la veille 18 h ») sur les écrans désignés
  const norm = (x) => x.replace(/jusqu’(?:à|au) (?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} [a-zéû]+\. 18 h\./g, 'jusqu’à la veille 18 h.');
  if (F.annulation.fichiers.includes(base)) { checks++; if (!norm(t).includes(F.annulation.regle)) push(f, 'règle d’annulation : texte canonique absent'); }
  for (const m of t.matchAll(/[^.]*1 fois par (mois|trimestre)[^.]*/g)) { checks++; if (m[1] === 'mois' && !/connais quelqu/.test(m[0])) push(f, `« 1 fois par mois » hors « je connais quelqu’un ici » : « ${m[0].trim().slice(0, 60)} »`); if (m[1] === 'trimestre' && !/[Ii]mprévu/.test(m[0])) push(f, `« 1 fois par trimestre » hors imprévu`); }
  // 16. Carte de proposition Duo : pet + initiale seulement avant le double oui
  if (base === 'V5-Duo') { for (const w of [F.duos.nils.tranche, F.duos.nils.type, 'musique live']) { checks++; if (t.includes(w)) push(f, `carte Duo avant le oui : « ${w} » (pet + initiale seulement)`); } }
  // 17. Duos : plafond de 3 actifs, gratuit
  for (const m of t.matchAll(/(\d+) duos? actifs?/g)) { checks++; if (Number(m[1]) !== F.prix.duosActifsMax) push(f, `« ${m[0]} » : ${F.prix.duosActifsMax} duos actifs`); }
  // 18. Blowy+ : abonnement aux sorties payé avec Apple Pay
  if (base === 'V5-Abonnement') { checks++; if (!/Apple Pay/.test(t) || /duo/i.test(t.replace(/Les duos restent gratuits pour tout le monde\./, ''))) push(f, 'Blowy+ : sorties seulement, en Apple Pay'); }
  // 19. Liens : longueur minimale (énumération)
  for (const sl of slugsHere) { checks++; const key = Object.keys(F.slugs).find((k) => F.slugs[k] === sl); const id = sl.split('/').pop(); const min = F.slugsNominatifs.includes(key) ? F.slugLongueur.nominatif : F.slugLongueur.public; if (id.length < min) push(f, `lien « ${sl} » : ${min} caractères au moins`); }

  // 10. Vocabulaire unique et promesses fausses
  const banned = ['ngl', 'XP', 'compte à rebours', 'près de toi', 'près de chez toi', 'en route', 'boisson incluse', 'Code Names', 'Restaurer mes achats', 'remboursé·e', 'Personne n’apprend jamais', 'Ta vision', 'ville fermée', 'pas encore ouvert', 'Alerte', 'alerte', 'photos la veille', 'Ami·e', 'histoire compatible avec la tienne', 'Au moins 2 personnes', 'au moins 2 personnes', 'Potes seulement', 'Nouveaux potes', 'captures d’écran sont bloquées', 'Position au moment', 'entre amis pour toi', 'sortie entre amis', 'une histoire est possible', 'vous vous plaisez', 'achat intégré', 'Achat intégré', 'duos sans limite', 'Duos illimités', 'duos illimités', 'n’en sait rien', 'absence prévenue avant les visages', 'Codenames', 'ton pote', 'quelques secondes', 'Paris 11e, Lyon 4e', 'Personne ne le voit, ni ne peut le deviner'];
  for (const w of banned) {
    checks++;
    if (new RegExp(`(?<![\\w-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(t)) push(f, `terme interdit « ${w} »`);
  }
}

for (const [sl, set] of Object.entries(seenSlug)) { checks++; const owners = new Set([...set].map((b) => F.slugParFichier[b] || b)); if (owners.size > 1) problems.push(`lien « ${sl} » réutilisé par ${[...set].join(', ')}`); }
console.log(`check-facts : ${files.length} fichiers, ${checks} vérifications, ${problems.length} contradiction(s).`);
for (const p of problems) console.log('  ✗ ' + p);
process.exit(problems.length ? 1 : 0);
