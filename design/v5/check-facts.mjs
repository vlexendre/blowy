// Vérifie que chaque maquette .dc.html de design/v5/project respecte facts.json.
// Contrôles : jours/dates 2026, chronologie (facts + « maintenant » de chaque écran), grille d'âge fixe et appartenance
// des tranches à la composition, phrases dérivées (taille du groupe, nouvelles personnes, + toi), prix, compteurs,
// prénoms et pets de tiers sur les cartes de partage, slugs publics, point médian dans boutons et titres, vocabulaire.
// + V5.3 : garantie jamais affichée, calendrier B (annulation gratuite jusqu'à la veille 18 h), confirmation = prénoms + tranches + pets sans visage,
// duo sans prénom avant le oui, accord avant tout duo, un lien unique par carte, lien privé jamais en Story, « pote / team » hors titres et boutons.
// + V5.4 : aucun signal de compatibilité, règle d'annulation unique (imprévu 1×/trimestre), carte Duo = pet + initiale, 3 duos actifs, Blowy+ jamais en achat intégré, liens ≥ 8 / 12 caractères.
// + V5.5 : astreinte sur tous les créneaux (aucune plage horaire), rendez-vous Duo en lieu partenaire, check-in par code, carte Duo sans nom de pet,
//   indicateurs de ville ≥ 10 et arrondis, imprévu 1 fois par mois.
// + V5.6 : une phrase canonique par règle (facts.regles / reglesSignatures), « soirs de sortie », « position en continu » et « Photo fournie par le lieu » bannis,
//   âge du persona (facts.personas) cohérent avec « Toi · tranche » et la tranche annoncée de sa sortie.
// + V5.7 : échéances dérivées du calendrier (composition J−3 21 h, confirmation veille 18 h, aucune date hors facts.json), « personnes vérifiées »,
//   pets propres à chaque groupe, aucun partage sur Les visages, TTC client / HT lieu, Tarifs = contrat, « ton rendez-vous » / « la sortie d’Alex ».
// + V5.8 : frise = carte, aucune sortie promise avant composition, prénom du duo au double oui, tournures uniques (« quand vous avez dit oui tous les deux »,
//   « intéressant dès la 3e sortie du mois », « ≈ N min depuis <quartier> »), fiabilité « visible par toi seulement », tranche des personas, ratons ≤ 64 pt sur les échecs.
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

const clean = (s) => s.replace(/\u2060/g, '').replace(/&nbsp;| | /g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
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

// V5.7 · calendrier : composition J−3 21 h, confirmation veille 18 h
const JC = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'], MC = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JL = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const court = (d) => `${JC[d.getUTCDay()]} ${d.getUTCDate()} ${MC[d.getUTCMonth()]}`;
const COMPOS = new Set(), CONFIRMS = new Set(), JOURS_COMPO = new Set();
for (const iso of F.calendrier.sorties) { const d = new Date(iso.slice(0, 10) + 'T12:00:00Z'); const c = new Date(d - 3 * 864e5), v = new Date(d - 864e5); COMPOS.add(court(c)); CONFIRMS.add(court(v)); JOURS_COMPO.add(JL[c.getUTCDay()]); }
const SORTIES_COURT = new Set(F.calendrier.sorties.map((i) => court(new Date(i.slice(0, 10) + 'T12:00:00Z'))));
const DATES_FACTS = new Set([...COMPOS, ...CONFIRMS, ...F.calendrier.sorties.map((i) => court(new Date(i.slice(0, 10) + 'T12:00:00Z')))]);
for (const m of JSON.stringify(F).replace(/[\u00a0\u202f]/g, ' ').matchAll(/\b(?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} (?:oct|nov|déc)\./g)) DATES_FACTS.add(m[0]);

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
  if (/\b\d{2} ans\b/.test(t.replace(/\d{2}–\d{2} ans/g, '').replace(/entre \d{2} et \d{2} ans|18 ans et plus|18 ans ou plus|moins de 18 ans|dès 18 ans|\d{2} ans et plus/g, ''))) { checks++; push(f, 'âge exact affiché (« NN ans » hors tranche)'); }

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
    if (base !== 'V5-Cartes') { seenSlug[sl] = seenSlug[sl] || new Set(); seenSlug[sl].add(base); } // Mes cartes = miniatures des mêmes cartes
  }

  // 15. V5.4 · Règle d'annulation unique : texte canonique (la date peut remplacer « la veille 18 h ») sur les écrans désignés
  const norm = (x) => x.replace(/jusqu’(?:à|au) (?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} [a-zéû]+\. 18 h(\.| ;)/g, 'jusqu’à la veille 18 h$1');
  if (F.annulation.fichiers.includes(base)) { checks++; if (!norm(t).includes(F.annulation.regle)) push(f, 'règle d’annulation : texte canonique absent'); }
  for (const m of t.matchAll(/[^.]*1 fois par (mois|trimestre)[^.]*/g)) { checks++; if (m[1] === 'mois' && !/connais quelqu|[Ii]mprévu/.test(m[0])) push(f, `« 1 fois par mois » hors « je connais quelqu’un ici » : « ${m[0].trim().slice(0, 60)} »`); if (m[1] === 'trimestre' && !/[Ii]mprévu/.test(m[0])) push(f, `« 1 fois par trimestre » hors imprévu`); }
  // 16. Carte de proposition Duo : pet + initiale seulement avant le double oui
  if (base === 'V5-Duo') { for (const w of [F.duos.nils.tranche, F.duos.nils.type, 'musique live']) { checks++; if (t.includes(w)) push(f, `carte Duo avant le oui : « ${w} » (pet + initiale seulement)`); } }
  // 17. Duos : plafond de 3 actifs, gratuit
  for (const m of t.matchAll(/(\d+) duos? actifs?/g)) { checks++; if (Number(m[1]) !== F.prix.duosActifsMax) push(f, `« ${m[0]} » : ${F.prix.duosActifsMax} duos actifs`); }
  // 18. Blowy+ : abonnement aux sorties payé avec Apple Pay
  if (base === 'V5-Abonnement') { checks++; if (!/Apple Pay/.test(t) || /duo/i.test(t.replace(/Les duos restent gratuits pour tout le monde\./, ''))) push(f, 'Blowy+ : sorties seulement, en Apple Pay'); }
  // 19. Liens : longueur minimale (énumération)
  for (const sl of slugsHere) { checks++; const key = Object.keys(F.slugs).find((k) => F.slugs[k] === sl); const id = sl.split('/').pop(); const min = F.slugsNominatifs.includes(key) ? F.slugLongueur.nominatif : F.slugLongueur.public; if (id.length < min) push(f, `lien « ${sl} » : ${min} caractères au moins`); }

  // 20. V5.5 · Astreinte : jamais limitée à une plage horaire ; tout rendez-vous Duo en lieu partenaire
  for (const m of t.matchAll(/(astreinte|équipe[^.]{0,20}joignable)[^.]{0,40}?(\d{1,2}) h\s*(?:à|–|-)\s*(\d{1,2}) h/gi)) { checks++; push(f, `astreinte limitée à une plage : « ${m[0].slice(0, 60)} »`); }
  if (/RdvDuo/.test(base)) { checks++; if (!/Lieu partenaire/.test(t)) push(f, 'rendez-vous Duo hors lieu partenaire'); checks++; if (!t.includes(F.astreinte.texte) && !t.includes(F.regles.astreinteRdv)) push(f, 'rendez-vous Duo : astreinte non dite'); }
  // 21. Check-in par code seulement
  if (/Checkin/.test(base)) { checks++; if (/position/i.test(t) && !/jamais demandée/.test(t)) push(f, 'check-in : aucune proposition de position'); }
  // 22. Carte Duo : jamais le nom du pet avant le double oui
  if (base === 'V5-Duo') { checks++; if (new RegExp(`(?<![\\wÀ-ÿ])${F.duos.nils.pet}(?![\\wÀ-ÿ])`).test(t)) push(f, `carte Duo : nom du pet « ${F.duos.nils.pet} » avant le oui`); }
  // 23. Indicateurs de ville : jamais au niveau du groupe, ≥ 10, arrondis
  for (const m of t.matchAll(/(\d+) (personnes vérifiées|inscrits|personnes cherchent)/g)) { checks++; const n = Number(m[1]); const before = t.slice(Math.max(0, m.index - 12), m.index); if (n === taille) continue; if (n < F.indicateurs.seuil || n % 10 !== 0 || !/environ\s*$/i.test(before)) push(f, `indicateur « ${m[0]} » : ≥ ${F.indicateurs.seuil}, arrondi, précédé de « environ »`); }
  for (const m of t.matchAll(/[^.]*histoire compatible avec la tienne[^.]*/g)) { checks++; if (!/À [A-ZÉ][\wé-]+(?: \d+e)?,/.test(m[0]) || !/(dizaine|quinzaine|vingtaine|trentaine|quarantaine|cinquantaine|centaine|environ)/.test(m[0])) push(f, `« histoire compatible » hors indicateur de ville arrondi : « ${m[0].trim().slice(0, 70)} »`); }

  // 24. V5.6 · Une seule formulation par règle : dès qu'une règle est évoquée, sa phrase canonique (facts.regles) est présente mot pour mot
  for (const [k, sig] of Object.entries(F.reglesSignatures)) {
    const variantes = (F.reglesVariantes[k] || [k]).map((v) => F.regles[v]);
    if (new RegExp(sig).test(t)) { checks++; if (!variantes.some((v) => norm(t).includes(v))) push(f, `règle « ${k} » formulée autrement que « ${variantes[0].slice(0, 50)}… »`); }
  }
  // 26. V5.7 · Échéances dérivées du calendrier : « <date> 21 h » = composition (J−3), « <date> 18 h » = confirmation (veille) ; jour seul « à 21 h » = jour de composition d'un créneau
  { const tc = t.replace(/ à (\d{1,2} h)/g, ' $1');
    for (const m of tc.matchAll(/\b((?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} (?:oct|nov|déc)\.),? (21|18) h(?! ?\d)/g)) {
      checks++; const ok = (m[2] === '21' ? COMPOS : CONFIRMS).has(m[1]);
      if (!ok) push(f, `échéance « ${m[0]} » non dérivée d’une sortie du calendrier (${m[2] === '21' ? 'composition J−3 21 h' : 'confirmation veille 18 h'})`); }
    for (const m of t.matchAll(/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (?:à )?21 h(?! ?\d)/g)) { checks++; if (!JOURS_COMPO.has(m[1])) push(f, `« ${m[0]} » : aucun créneau ne se compose ce jour-là`); }
    // aucune date en dur : toute date courte vient de facts.json ou du calendrier
    for (const m of t.matchAll(/\b(?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} (?:oct|nov|déc)\./g)) { checks++; if (!DATES_FACTS.has(m[0])) push(f, `date « ${m[0]} » absente de facts.json`); }
  }
  // 27. « personnes vérifiées », jamais « inscrits »
  { checks++; if (/\binscrits?\b/.test(t)) push(f, '« inscrits » : écrire « personnes vérifiées »'); }
  // 28. Pets propres à chaque groupe
  if (F.groupeParFichier[base]) { const g = F.groupes[F.groupeParFichier[base]];
    for (const [nom, pet] of Object.entries(g)) { if (nom === 'Toi') continue; checks++; const re = new RegExp(nom + ' · [^·]*?(?:· vient avec toi )?([A-ZÉ][a-zéèëï]+)(?= |$)');
      const m = t.match(re); if (m && m[1] !== pet) push(f, `${nom} a le pet « ${m[1]} » ; son pet est ${pet}`); } }
  // 29. Aucun lien de partage sur Les visages (et Souvenir avant le vote)
  if (F.ecransVisages.includes(base)) { checks++; if (/href="V5-(?:Partage|Story|Cartes)/.test(html) || /\bPartager\b/.test(t)) push(f, 'lien de partage sur un écran de visages'); }
  // 30. TTC côté client, HT côté lieu
  if (base.startsWith('L-')) { for (const m of t.matchAll(/\d+(?:,\d\d)? €(?! HT| TTC)/g)) { checks++; push(f, `montant « ${m[0]} » sans « HT » côté lieu`); } }
  else { checks++; if (/\bHT\b|hors taxes/.test(t)) push(f, 'montant HT sur un écran client (TTC côté client)'); }
  // 31. Tarifs = contrat = écran client : mêmes phrases canoniques
  if (base === 'V5-Tarifs' || base === 'L-Contrat') for (const k of F.tarifsContrat) { checks++; if (!norm(t).includes(F.regles[k])) push(f, `phrase canonique « ${k} » absente (Tarifs = contrat)`); }
  // 40. Tour 10 · duo : initiale avant le double oui, prénom complet après
  if (F.ecransApresOui.includes(base)) for (const [ini, pr] of Object.entries(F.duoPrenoms)) { checks++; if (new RegExp('(?:^|[\\s·(])' + ini.replace('.', '\\.') + '(?=[\\s·,)]|$)').test(t)) push(f, `« ${ini} » après le double oui : écrire « ${pr} »`); }
  // 41. « quand vous avez dit oui tous les deux » réservé au duo ; Confidentialité = spec §2.16
  if (F.ecransRdv.includes(base)) { checks++; if (t.includes(F.regles.deuxOui)) push(f, '« quand vous avez dit oui tous les deux » réservé au duo, pas à l’accord de créneau'); }
  if (base === 'V5-Confidentialite') { checks++; if (!t.includes(F.duoSpec216)) push(f, 'phrase Duo de la spec §2.16 absente'); }
  // 42. Le jalon de la veille 18 h s'appelle « Confirmation »
  for (const w of ['lieu révélé', 'Lieu révélé', 'à la révélation', 'Lieu et prénoms le', 'Lieu et prénoms ·', 'Le lieu de jeudi est arrivé']) { checks++; if (t.includes(w)) push(f, `jalon de la veille 18 h nommé « ${w} » : écrire « Confirmation »`); }
  // 43. Tour 11 · activité payante : son prix là où « Chacun paie » apparaît ; « intéressant dès la 3e » une seule fois
  for (const a of Object.values(F.activitePrix)) if (a.ecrans.includes(base)) { checks++; if (!t.includes(a.phrase)) push(f, `prix de l’activité absent : « ${a.phrase} »`); }
  { checks++; const k = (t.match(/[Ii]ntéressant dès la 3e/g) || []).length; if (k > 1) push(f, `« intéressant dès la 3e » écrit ${k} fois`); }
  { checks++; if (/[Pp]our qu’elle ait lieu/i.test(t)) push(f, '« Pour qu’elle ait lieu » : écrire « Pour sortir plus tôt »'); }
  // 44. Tour 11b · aucun prénom ni initiale avant la Confirmation (spec §3.1) : les membres ne sont montrés que par leur pet
  if (F.ecransAvantConfirmation.includes(base)) { checks++;
    const ini = t.match(/(?<![\p{L}.])\p{Lu}\.(?=[\s:·,]|$)/u); if (ini) push(f, `initiale « ${ini[0]} » avant la Confirmation`);
    for (const p of F.prenomsMembres) if (new RegExp('(?<!\\p{L})' + p + '(?!\\p{L})', 'u').test(t)) push(f, `prénom « ${p} » avant la Confirmation`); }
  // 45. Quatre espèces seulement (raton, lapine, capybara, pigeonne)
  for (const w of F.especesInterdites) { checks++; if ((w.trim() === w ? t : t + ' ').includes(w)) push(f, `espèce hors domaine « ${w.trim()} »`); }
  for (const b of F.pepiteBlobs) { checks++; if (html.includes(b)) push(f, 'dessin d’une espèce hors domaine (Pépite)'); }
  for (const m of t.matchAll(/\b(?:Un|Une) ([a-zé]+) · \p{Lu}\./gu)) { checks++; if (!F.especes.includes(m[1])) push(f, `espèce « ${m[1]} » hors des 4 du domaine`); }
  if (base === 'V5-Pet') for (const m of html.matchAll(/\['([a-z]+)', '([A-Za-zé]+)', B \+/g)) { checks++; if (!F.especes.some((e) => e.startsWith(m[2].toLowerCase().slice(0, 4)))) push(f, `espèce « ${m[2]} » hors domaine dans le sélecteur`); }
  // 46. Tour 12 · activité prépayée : prix sous « Je viens », rangées propres à l'activité, jamais « à régler au lieu »
  for (const [k, a] of Object.entries(F.activitePrix)) if (a.ecrans.includes(base) && a.sous) { checks++;
    if (!t.includes(a.sous)) push(f, `ligne sous « Je viens » sans l’activité : « ${a.sous} »`);
    for (const w of ['cartes de questions sur la table', 'table Blowy']) if (t.includes(w)) push(f, `« ${w} » dans une activité qui n’est pas un bar`); }
  { checks++; if (t.includes('à régler au lieu')) push(f, '« à régler au lieu » : l’activité est prépayée dans l’app'); }
  if (base === 'V5-Paiement') { checks++; if (!t.includes(F.activitePrix.paris2.total)) push(f, 'récapitulatif place + activité absent'); }
  if (base === 'L-Contrat') { checks++; if (!t.includes(F.activiteContrat)) push(f, 'clause activité prépayée absente'); }
  // 47. Tour 13 · modèle de prix par sortie (facts.prixSorties) : chaque écran qui affiche un montant de la sortie reprend place, activité et total
  for (const [id, sp] of Object.entries(F.prixSorties)) { if (id.startsWith('_') || !sp.ecrans[base]) continue;
    for (const m of sp.ecrans[base]) { checks++; if (!t.includes(m)) push(f, `sortie ${id} : montant « ${m} » absent (total ${sp.total})`); } }
  for (const w of F.prixInterdits[base] || []) { checks++; if (t.includes(w)) push(f, `« ${w} » contredit le prix de la sortie`); }
  for (const w of F.prixRequis[base] || []) { checks++; if (!t.includes(w)) push(f, `« ${w} » absent`); }
  for (const a of Object.values(F.activitePrix)) if (a.trouveeEcran === base) { checks++; if (!t.includes(a.trouvee)) push(f, `Trouvée sans l’activité : « ${a.trouvee} »`); }
  // 33. V5.8 · heure de la frise = heure de la carte de sortie
  { const carte = t.match(/(\d{1,2} h(?: \d\d)?) – \d{1,2} h/); for (const m of t.matchAll(/(\d{1,2} h(?: \d\d)?) La sortie\b/g)) { checks++; if (carte && m[1] !== carte[1]) push(f, `frise « ${m[0]} » ≠ carte « ${carte[0]} »`); } }
  // 34. Aucune sortie promise avant composition (écrans d'attente et de remplacement)
  if (F.ecransAttente[base]) { const ok = F.ecransAttente[base];
    for (const ph of ['elle a lieu', 'POUR TA SORTIE DU', 'une sortie a lieu le', 'Nino te propose le', 'Ta prochaine sortie', 'On te propose', 'La semaine prochaine, sur un de tes créneaux']) { checks++; if (t.includes(ph)) push(f, `sortie promise avant composition : « ${ph} »`); }
    for (const sen of t.split(/(?<=[.!?])\s+/)) for (const m of sen.matchAll(/\b(?:lun|mar|mer|jeu|ven|sam|dim)\. \d{1,2} (?:nov|déc)\./g)) { if (ok.includes(m[0]) || !SORTIES_COURT.has(m[0])) continue; checks++; if (!/si un groupe se forme|reste ouvert|réponse le|ton créneau|Ton créneau|Garder/.test(sen)) push(f, `« ${m[0]} » promis sans « si un groupe se forme » : « ${sen.trim().slice(0, 60)} »`); } }
  // 35. Prénom du duo : seulement quand vous avez dit oui tous les deux
  if (F.ecransAvantOui[base]) for (const p of F.ecransAvantOui[base]) { checks++; if (t.includes(p)) push(f, `prénom « ${p} » avant le double oui`); }
  // 36. Tournures uniques
  for (const m of t.matchAll(/oui tous les deux/g)) { checks++; if (!/(?:quand|que) vous avez dit $/.test(t.slice(Math.max(0, m.index - 24), m.index))) push(f, '« oui tous les deux » hors de « quand vous avez dit oui tous les deux »'); }
  for (const m of t.matchAll(/intéressant dès la 3e[^.]*/g)) { checks++; if (!m[0].startsWith('intéressant dès la 3e sortie du mois')) push(f, `« ${m[0]} » : écrire « intéressant dès la 3e sortie du mois »`); }
  for (const m of t.matchAll(/≈ \d+ min(?: (\S+) ([^·.,;)]+))?/g)) { checks++; if (m[1] !== 'depuis' || !F.quartiers.some((q) => (m[2] || '').replace(/\u2011/g, '-').trim().startsWith(q))) push(f, `trajet « ${m[0].trim()} » : écrire « ≈ N min depuis <ton quartier> »`); }
  // 37. Fiabilité toujours suivie de « visible par toi seulement »
  for (const m of t.matchAll(/[Ff]iabilité|sortie honorée|Venu à \d+ sortie/g)) { checks++; if (!t.slice(m.index, m.index + 220).includes('visible par toi seulement')) push(f, `« ${m[0]} » sans « visible par toi seulement »`); }
  // 38. Tranche de chaque persona dans son groupe
  { const pt = parseRange(F.personas[base] || F.personas.default);
    for (const m of t.matchAll(/5 personnes · (\d{2})–(\d{2}) ans/g)) { checks++; if (Number(m[1]) > pt[0] || Number(m[2]) < pt[1]) push(f, `groupe « ${m[1]}–${m[2]} ans » qui n’inclut pas le persona`); }
    const g = F.groupeParFichier[base] && F.groupesTranches[F.groupeParFichier[base]];
    if (g) for (const [nom, tr] of Object.entries(g)) { const m = t.match(new RegExp(nom + ' · (\\d{2}–\\d{2} ans)')); checks++; if (m && m[1] !== tr) push(f, `${nom} · ${m[1]} : sa tranche est ${tr}`); } }
  // 39. Ratons des écrans d'échec : ${F.ratonMax} pt au plus
  if (F.ecransEchec.includes(base)) for (const m of html.matchAll(/<img src="[^"]*?([0-9a-f]{32})"[^>]*?width: (\d+)px/g)) { if (!F.ninoBlobs.includes(m[1])) continue; checks++; if (Number(m[2]) > F.ratonMax) push(f, `raton de ${m[2]} pt sur un écran d’échec (max ${F.ratonMax})`); }

  // 32. Rendez-vous Duo : « pendant tout ton rendez-vous » ; page ange : « la sortie d’Alex »
  if (F.ecransRdv.includes(base)) { checks++; if (!t.includes(F.regles.astreinteRdv) || /toute ta sortie/.test(t)) push(f, 'rendez-vous Duo : écrire « pendant tout ton rendez-vous »'); }
  if (F.ecransAnge.includes(base)) { checks++; if (/toute ta sortie|ta sortie\b/.test(t)) push(f, 'page de l’ange : « la sortie d’Alex », jamais « ta sortie »'); }
  // 25. Âge du persona ↔ tranche de sa sortie
  { const pt = F.personas[base] || F.personas.default;
    for (const m of t.matchAll(/Toi · (\d{2}–\d{2} ans)/g)) { checks++; if (m[1] !== pt) push(f, `« Toi · ${m[1]} » : le persona de cet écran a ${pt}`); }
    for (const m of t.matchAll(/en (\d{2})–(\d{2}) ans/g)) { checks++; const r = parseRange(pt); if (Number(m[1]) > r[0] || Number(m[2]) < r[1]) push(f, `sortie « en ${m[1]}–${m[2]} ans » qui n’inclut pas le persona (${pt})`); } }

  // 10. Vocabulaire unique et promesses fausses
  const banned = ['ngl', 'XP', 'compte à rebours', 'près de toi', 'près de chez toi', 'en route', 'boisson incluse', 'Code Names', 'Restaurer mes achats', 'remboursé·e', 'Personne n’apprend jamais', 'Ta vision', 'ville fermée', 'pas encore ouvert', 'Alerte', 'alerte', 'photos la veille', 'Ami·e', 'Au moins 2 personnes', 'au moins 2 personnes', 'Potes seulement', 'Nouveaux potes', 'captures d’écran sont bloquées', 'Position au moment', 'entre amis pour toi', 'sortie entre amis', 'une histoire est possible', 'vous vous plaisez', 'achat intégré', 'Achat intégré', 'duos sans limite', 'Duos illimités', 'duos illimités', 'n’en sait rien', 'absence prévenue avant les visages', 'Codenames', 'ton pote', 'quelques secondes', 'Paris 11e, Lyon 4e', 'Personne ne le voit, ni ne peut le deviner', 'trimestre', '18 h à 2 h', '18 h – 2 h', 'position une fois', 'vérifier ma position', 'Lieu public', 'ressemble pas à son selfie', 'soirs de sortie', 'position en continu', 'Photo fournie par le lieu', 'Rentable à partir de', 'inscrits', 'arrive la veille', 'Une proposition pour vous deux', 'sur M)', 'vos deux oui', 'dans ton quartier', 'Rentable', 'prénom, aux visages', 'prénom et ton visage aux visages', 'décrivent Alex', 'vidéo 1 s'];
  for (const w of banned) {
    checks++;
    if (new RegExp(`(?<![\\w-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(t)) push(f, `terme interdit « ${w} »`);
  }
}

for (const [sl, set] of Object.entries(seenSlug)) { checks++; const owners = new Set([...set].map((b) => F.slugParFichier[b] || b)); if (owners.size > 1) problems.push(`lien « ${sl} » réutilisé par ${[...set].join(', ')}`); }
console.log(`check-facts : ${files.length} fichiers, ${checks} vérifications, ${problems.length} contradiction(s).`);
for (const p of problems) console.log('  ✗ ' + p);
process.exit(problems.length ? 1 : 0);
