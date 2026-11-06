/**
 * Écriture des histoires : chaque étape est un `it` (✅ si elle passe, ❌ sinon) ; une
 * fonctionnalité absente de l'API est déclarée par `absent()` (rendue `todo`, ⛔ dans le rapport).
 * `note()` consigne une observation « vécue » (incohérence de parcours, moment où l'utilisateur
 * serait bloqué) sans faire échouer l'étape ; les notes sont écrites dans
 * `test/journeys/.out/<histoire>.json` pour le rapport.
 */
import { afterAll, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.out');

export interface Story {
  /** Étape exécutée. */
  step(name: string, fn: () => Promise<void>, timeoutMs?: number): void;
  /** Fonctionnalité absente de l'API (aucune route / aucun module). */
  absent(name: string, why: string): void;
  /** Observation de parcours (non bloquante). */
  note(text: string): void;
  /** Échoue proprement si une étape préalable n'a pas produit ce dont on a besoin. */
  need<T>(v: T | null | undefined | '' | false, what: string): T;
}

export function story(slug: string, title: string): Story {
  const notes: string[] = [];
  const absents: { name: string; why: string }[] = [];
  let n = 0;
  afterAll(() => {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify({ title, notes, absents }, null, 2));
  });
  return {
    step(name, fn, timeoutMs) {
      n += 1;
      it(`${String(n).padStart(2, '0')}. ${name}`, fn, timeoutMs);
    },
    absent(name, why) {
      n += 1;
      absents.push({ name, why });
      it.todo(`${String(n).padStart(2, '0')}. ⛔ ${name} — ${why}`);
    },
    note(text) {
      if (!notes.includes(text)) notes.push(text);
    },
    need(v, what) {
      if (!v) throw new Error(`Bloqué : prérequis manquant (${what}) — une étape précédente a échoué`);
      return v as never;
    },
  };
}
