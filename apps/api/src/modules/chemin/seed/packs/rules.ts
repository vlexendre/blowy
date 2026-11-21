/** Règles d'un univers écrit d'un bloc (voir `pack.ts`) : forme, langues, ton. Renvoie la liste des erreurs. */
import { LOCALES } from '@blowy/domain';
import { SEED_TAGS } from '../catalogue';
import type { SeedPack } from './pack';

const ID = /^[a-z0-9_]{2,60}$/;
const AXES = new Set(['foyer', 'ancrage', 'elan', 'rythme', 'cap']);
const TAGS = new Set<string>(SEED_TAGS);
/** Sujets jamais abordés, et le mot interdit à l'écran. */
// Bords de mot qui connaissent les accents (« rádios » ne contient pas « dios »).
const word = (w: string): RegExp => new RegExp(`(?<![\\p{L}])(?:${w})(?![\\p{L}])`, 'iu');
const BANNED = [word('pet'), word('dieu|god|dios|deus'), word('politi\\p{L}*'), word('voter|votes?'), word('religi\\p{L}*'), word('d[ée]pression'), word('th[ée]rapi\\p{L}*|therap\\p{L}*'), word('sexe|sex')];

export function checkPack(p: SeedPack, seen: Set<string> = new Set()): string[] {
  const e: string[] = [];
  const id = (x: string, what: string) => {
    if (!ID.test(x)) e.push(`${what} « ${x} » : identifiant invalide (a-z, 0-9, _)`);
    if (seen.has(x)) e.push(`${what} « ${x} » : identifiant déjà pris`);
    seen.add(x);
  };
  id(p.id, 'univers');
  if (!p.icon) e.push('univers : icône manquante');
  for (const l of LOCALES) if (!p.title[l]?.[0]?.trim() || !p.title[l]?.[1]?.trim()) e.push(`univers : titre ou sous-titre manquant (${l})`);
  if (p.steps.length !== 10) e.push(`univers : ${p.steps.length} étapes (10 attendues)`);
  p.steps.forEach((s, si) => {
    id(s.id, 'étape');
    if (s.id !== `${p.id}_${si + 1}`) e.push(`étape « ${s.id} » : attendu « ${p.id}_${si + 1} »`);
    for (const l of LOCALES) if (!s.title[l]?.trim()) e.push(`étape ${s.id} : titre manquant (${l})`);
    if (s.questions.length !== 5) e.push(`étape ${s.id} : ${s.questions.length} questions (5 attendues)`);
    if (!s.questions.some((q) => q.format === 'slider')) e.push(`étape ${s.id} : au moins un curseur`);
    if (new Set(s.questions.map((q) => q.axis)).size < 3) e.push(`étape ${s.id} : au moins 3 axes différents`);
    for (const q of s.questions) {
      id(q.id, 'question');
      if (!q.id.startsWith(`${p.id}_`)) e.push(`question « ${q.id} » : doit commencer par « ${p.id}_ »`);
      if (!AXES.has(q.axis)) e.push(`question ${q.id} : axe inconnu`);
      const n = q.options.length;
      if (q.format === 'slider' && n !== 2) e.push(`question ${q.id} : un curseur a 2 bouts`);
      if (q.format === 'choice' && (n < 2 || n > 4)) e.push(`question ${q.id} : 2 à 4 options`);
      if (q.format !== 'choice' && q.format !== 'slider') e.push(`question ${q.id} : format choice ou slider seulement`);
      const ws = q.options.map((o) => o[1]);
      if (ws.some((w) => !Number.isInteger(w) || w < -100 || w > 100)) e.push(`question ${q.id} : poids entiers de −100 à 100`);
      if (!(ws.some((w) => w > 0) && ws.some((w) => w < 0))) e.push(`question ${q.id} : au moins une option de chaque côté de l'axe`);
      for (const o of q.options) {
        if (!o[0]) e.push(`question ${q.id} : icône manquante`);
        if (o[2] !== null && !TAGS.has(o[2])) e.push(`question ${q.id} : trait « ${o[2]} » inconnu`);
      }
      for (const l of LOCALES) {
        const t = q.texts[l];
        if (!t) {
          e.push(`question ${q.id} : langue ${l} manquante`);
          continue;
        }
        if (!t.t?.trim() || !t.o?.trim()) e.push(`question ${q.id} (${l}) : question ou amorce vide`);
        if (t.a.length !== n) e.push(`question ${q.id} (${l}) : ${t.a.length} textes d'options pour ${n} options`);
        if (t.a.some(([a, r]) => !a?.trim() || !r?.trim())) e.push(`question ${q.id} (${l}) : libellé ou réaction vide`);
        if (q.format === 'slider' && !t.m?.trim()) e.push(`question ${q.id} (${l}) : curseur sans « m »`);
        const all = [t.t, t.o, t.m ?? '', ...t.a.flat()].join(' ');
        for (const b of BANNED) if (b.test(all)) e.push(`question ${q.id} (${l}) : sujet ou mot interdit (${b.source})`);
        if (/'/.test(all)) e.push(`question ${q.id} (${l}) : apostrophe droite ' (utiliser ’)`);
        if (t.t.length > 140 || t.a.some(([a]) => a.length > 70) || t.a.some(([, r]) => r.length > 80)) e.push(`question ${q.id} (${l}) : texte trop long`);
      }
    }
  });
  return e;
}
