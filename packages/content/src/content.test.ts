import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ANONYMOUS_WORDS, PASSIONS } from '@blowy/domain';
import { DEFAULT_TUNING } from '@blowy/tuning';
import {
  ANONYMOUS_WORD_ENTRIES,
  DEPARTURE_TEMPLATES,
  EGG_QUESTIONS,
  EntrySchema,
  LIMIT_ENTRIES,
  LineTextSchema,
  MISSIONS,
  NOTIFICATION_TEMPLATES,
  PASSION_ENTRIES,
  PET_LINES,
  SCHOOL_ENTRIES,
  SUNDAY_ENTRIES,
  buildFrLocale,
  candidateLines,
} from './index.js';

describe('référentiels', () => {
  it('cardinalités : 4 écoles, 4 dimanches, 10 passions, 4 limites, 12 mots', () => {
    expect([SCHOOL_ENTRIES.length, SUNDAY_ENTRIES.length, PASSION_ENTRIES.length, LIMIT_ENTRIES.length, ANONYMOUS_WORD_ENTRIES.length]).toEqual([4, 4, 10, 4, 12]);
    expect(ANONYMOUS_WORD_ENTRIES.map((w) => w.id)).toEqual([...ANONYMOUS_WORDS]);
    expect(PASSION_ENTRIES.map((p) => p.id)).toEqual([...PASSIONS]);
  });
  it('matrice des dimanches couvre les 4 dimanches du contenu', () => {
    for (const a of SUNDAY_ENTRIES) for (const b of SUNDAY_ENTRIES) expect(DEFAULT_TUNING.matching.matrices.sunday[a.id][b.id]).toBeGreaterThanOrEqual(0);
  });
  it('questions de couvaison ≥ 12 à choix multiples ≥ 3 options ; couvrent 3 nuits × 4', () => {
    expect(EGG_QUESTIONS.length).toBeGreaterThanOrEqual(DEFAULT_TUNING.egg.nights * DEFAULT_TUNING.egg.questionsPerNight);
    for (const q of EGG_QUESTIONS) expect(q.options.length).toBeGreaterThanOrEqual(3);
  });
  it('missions ≥ 12 : critères observables, alternative accessible, jamais de visage requis', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(12);
    for (const m of MISSIONS) {
      expect(m.criteria.length).toBeGreaterThan(0);
      expect(m.accessibleAlternative.length).toBeGreaterThan(0);
      expect(m.faceRequired).toBe(false);
      expect(m.criteria.join(' ')).not.toMatch(/visage|selfie|corps/i);
    }
  });
  it('répliques ≥ 80, variables allowlistées, aucune réplique physique ni parole humaine', () => {
    expect(PET_LINES.length).toBeGreaterThanOrEqual(80);
    for (const l of PET_LINES) expect(LineTextSchema.safeParse(l.fr).success, l.fr).toBe(true);
    expect(LineTextSchema.safeParse('Ton humain pense à toi').success).toBe(false);
    expect(LineTextSchema.safeParse('Tu es trop belle').success).toBe(false);
    expect(LineTextSchema.safeParse('Bonjour {email}').success).toBe(false);
  });
  it('chaque situation a une réplique pour chaque espèce et trait (repli générique)', () => {
    const situations = [...new Set(PET_LINES.map((l) => l.situation))];
    for (const s of situations) for (const sp of ['GASTON', 'PIA', 'NINO', 'SUZIE'] as const) for (const tr of ['KIND', 'MISCHIEVOUS'] as const) expect(candidateLines(sp, tr, s).length).toBeGreaterThan(0);
    expect(candidateLines('NINO', 'MISCHIEVOUS', 'REFUSAL').every((l) => l.species === 'NINO' && l.trait === 'MISCHIEVOUS')).toBe(true);
  });
  it('modèles de départ clairement système', () => {
    for (const t of DEPARTURE_TEMPLATES) {
      expect(t.system).toBe(true);
      expect(t.fr.startsWith('Message de Blowy')).toBe(true);
    }
    for (const t of [...DEPARTURE_TEMPLATES, ...NOTIFICATION_TEMPLATES]) expect(EntrySchema.safeParse(t).success).toBe(true);
  });
  it('locales/fr.json généré, à jour et sans doublon', () => {
    const generated = buildFrLocale();
    const onDisk = JSON.parse(readFileSync(new URL('../locales/fr.json', import.meta.url), 'utf8'));
    expect(onDisk).toEqual(generated);
    for (const [k, v] of Object.entries(generated)) expect(EntrySchema.safeParse({ key: k, fr: v }).success, k).toBe(true);
  });
});
