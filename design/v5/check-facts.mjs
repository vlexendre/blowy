// Vérifie que chaque maquette .dc.html de design/v5/project ne contredit pas facts.json.
// Usage : node design/v5/check-facts.mjs   (code de sortie 1 s'il y a une contradiction)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const F = JSON.parse(readFileSync(join(here, 'facts.json'), 'utf8'));
const dir = join(here, 'project');
const files = readdirSync(dir).filter((f) => f.endsWith('.dc.html'));

const YEAR = 2026;
const MOIS = { janv: 0, janvier: 0, 'févr': 1, 'février': 1, mars: 2, avr: 3, avril: 3, mai: 4, juin: 5, juil: 6, juillet: 6, 'août': 7, sept: 8, septembre: 8, oct: 9, octobre: 9, nov: 10, novembre: 10, 'déc': 11, 'décembre': 11 };
const JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const jourIdx = (w) => JOURS.indexOf(w.slice(0, 3).toLowerCase());

// Texte visible : on retire <helmet>, balises et attributs ; on garde les chaînes JS (renderVals) qui sont aussi du texte affiché.
const visible = (html) => html
  .replace(/<helmet>[\s\S]*?<\/helmet>/g, ' ')
  .replace(/data-props='[^']*'/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;| | /g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ');

const allowedPrices = new Set(F.prix.autorises.map((p) => p.replace(/\s/g, '')));
const problems = [];
const push = (f, msg) => problems.push(`${f} : ${msg}`);
let checks = 0;

for (const f of files) {
  const t = visible(readFileSync(join(dir, f), 'utf8'));

  // 1. Jours et dates : « jeudi 12 novembre », « jeu. 12 nov. », « mer. 11 nov » → bon jour de semaine en 2026
  const reDate = /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun\.|mar\.|mer\.|jeu\.|ven\.|sam\.|dim\.)\s+(\d{1,2})(?:er)?\s+(janvier|janv\.?|février|févr\.?|mars|avril|avr\.?|mai|juin|juillet|juil\.?|août|septembre|sept\.?|octobre|oct\.?|novembre|nov\.?|décembre|déc\.?)/gi;
  for (const m of t.matchAll(reDate)) {
    checks++;
    const mois = MOIS[m[3].replace('.', '').toLowerCase()];
    const d = new Date(Date.UTC(YEAR, mois, Number(m[2])));
    if (d.getUTCDay() !== jourIdx(m[1])) push(f, `« ${m[0]} » : le ${m[2]}/${mois + 1}/${YEAR} est un ${['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getUTCDay()]}`);
  }
  // Un jour de sortie connu ne doit jamais être associé à un autre numéro (ex. « jeudi 13 »)
  for (const m of t.matchAll(/\b(jeudi|jeu\.)\s+(\d{1,2})\b/gi)) {
    checks++;
    if (!['12', '19', '26', '3'].includes(m[2])) push(f, `« ${m[0]} » : aucun jeudi de ce numéro dans la démo`);
  }

  // 2. Taille du groupe
  for (const m of t.matchAll(/\b(\d+)\s+personnes(?!\s+(?:vérifiées|vérifié·es|de plus))/gi)) {
    checks++;
    const n = Number(m[1]);
    if (n < 10 && n !== F.groupe.taille) push(f, `« ${m[0]} » : le groupe fait ${F.groupe.taille} personnes`);
  }
  for (const m of t.matchAll(/\b(\d+)\s+inconnu·es/gi)) { checks++; if (Number(m[1]) !== F.groupe.autres) push(f, `« ${m[0]} » : ${F.groupe.autres} autres personnes`); }
  for (const m of t.matchAll(/\b(\d+)\s*\+\s*toi\b/g)) { checks++; if (Number(m[1]) !== F.groupe.autres) push(f, `« ${m[0]} » : ${F.groupe.autres} + toi attendu`); }
  for (const m of t.matchAll(/on était\s+(\d+)/gi)) { checks++; if (Number(m[1]) !== F.groupe.taille) push(f, `« ${m[0]} »`); }
  for (const m of t.matchAll(/\b(\d+)\s+places?\s+(?:sont\s+)?prises/g)) { checks++; push(f, `« ${m[0]} » : pas de notion de places prises`); }

  // 3. Prix : tout montant en euros doit être un prix de facts.json
  for (const m of t.matchAll(/(\d+(?:,\d{2})?)\s?€/g)) {
    checks++;
    const p = m[1] + '€';
    if (!allowedPrices.has(p)) push(f, `prix « ${m[0]} » absent de facts.json`);
  }

  // 4. Compteurs de la démo
  for (const m of t.matchAll(/\b(\d+)\s+souvenirs?\b/g)) { checks++; if (Number(m[1]) !== F.souvenirs && Number(m[1]) !== 1) push(f, `« ${m[0]} » : ${F.souvenirs} souvenirs`); }
  for (const m of t.matchAll(/\b(\d+)\s+dans ta bande\b/g)) { checks++; if (Number(m[1]) !== F.bande.taille) push(f, `« ${m[0]} » : ${F.bande.taille} dans ta bande`); }
  for (const m of t.matchAll(/(\d+)\s*\/\s*(\d+)\s+personnes vérifiées/g)) { checks++; if (Number(m[1]) !== F.villeFermee.verifies || Number(m[2]) !== F.villeFermee.seuil) push(f, `« ${m[0]} » : ${F.villeFermee.verifies} / ${F.villeFermee.seuil}`); }

  // 5. Mots interdits (concept)
  for (const w of ['ngl', 'XP', 'compte à rebours', 'près de toi', 'Accélérer', 'en route', 'boisson incluse', '12 €', '19,99']) {
    checks++;
    if (new RegExp(`(?<![\\w-])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i').test(t)) push(f, `terme interdit « ${w} »`);
  }
}

console.log(`check-facts : ${files.length} fichiers, ${checks} vérifications, ${problems.length} contradiction(s).`);
for (const p of problems) console.log('  ✗ ' + p);
process.exit(problems.length ? 1 : 0);
