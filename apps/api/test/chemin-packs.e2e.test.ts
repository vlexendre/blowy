import { describe, expect, it } from 'vitest';
import { SEED_QUESTIONS, SEED_UNITS } from '../src/modules/chemin/seed/catalogue';
import { SEED_PACKS } from '../src/modules/chemin/seed/packs/index';
import { checkPack } from '../src/modules/chemin/seed/packs/rules';

describe('univers du chemin écrits d’un bloc', () => {
  it('chaque univers respecte les règles (10 étapes de 5 questions, 5 langues, axes, traits, ton)', () => {
    const seen = new Set<string>([...SEED_UNITS.map((u) => u.id), ...SEED_UNITS.flatMap((u) => u.steps.map((s) => s.id)), ...SEED_QUESTIONS.map((q) => q.id)]);
    const errors = SEED_PACKS.flatMap((p) => checkPack(p, seen).map((e) => `${p.id} : ${e}`));
    expect(errors).toEqual([]);
  });

  it('au moins 3 000 questions en tout', () => {
    const total = SEED_QUESTIONS.length + SEED_PACKS.reduce((n, p) => n + p.steps.reduce((m, s) => m + s.questions.length, 0), 0);
    expect(total).toBeGreaterThanOrEqual(3000);
  });

  it('pas deux fois la même question (texte et réponses en français)', () => {
    const texts = SEED_PACKS.flatMap((p) => p.steps.flatMap((s) => s.questions.map((q) => [q.texts.fr.t, ...q.texts.fr.a.map(([a]) => a)].join('|').trim().toLowerCase())));
    const dup = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(dup).toEqual([]);
  });
});
