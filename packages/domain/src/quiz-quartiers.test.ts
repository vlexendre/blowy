import { describe, expect, it } from 'vitest';
import { GAUGE_KEYS } from './gauges';
import { growthReport, resolveAttribution } from './growth';
import { earnedItems, ZERO_STATS } from './items';
import { QUIZ, QUIZ_TRAITS, TRAIT_SPECIES, isQuizCode, quizCodeFrom, quizResult, validQuizAnswers, type QuizAnswer } from './quiz';
import { foundersOf, shouldOpen, zoneById, zoneOfPoint, zoneOfPostalCode, zoneProgress, ZONES, clampThreshold, isPlausibleEmail } from './quartiers';

const all = (choice: 'a' | 'b' | 'c'): QuizAnswer[] => QUIZ.map((q) => ({ questionId: q.id, choice }));

describe('quiz « Quel minimoa es-tu ? »', () => {
  it('7 situations à 3 choix, chaque caractère atteignable', () => {
    expect(QUIZ.length).toBeGreaterThanOrEqual(6);
    expect(QUIZ.length).toBeLessThanOrEqual(8);
    const reachable = new Set<string>();
    for (const q of QUIZ) for (const c of q.choices) for (const k of GAUGE_KEYS) if (c.delta[k]) reachable.add(`${k}${Math.sign(c.delta[k] ?? 0)}`);
    expect(reachable.size).toBe(8);
    expect(new Set(Object.values(TRAIT_SPECIES)).size).toBe(4);
    expect(QUIZ_TRAITS).toHaveLength(8);
  });

  it('réponses : une par situation, connues', () => {
    expect(validQuizAnswers(all('a'))).toBe(true);
    expect(validQuizAnswers(all('a').slice(1))).toBe(false);
    expect(validQuizAnswers([...all('a').slice(1), { questionId: 'plan', choice: 'd' as 'a' }])).toBe(false);
    expect(validQuizAnswers([...all('a').slice(1), { questionId: 'coupe', choice: 'a' }])).toBe(false);
  });

  it('résultat : le pôle le plus marqué, son espèce, des jauges bornées', () => {
    const r = quizResult(all('a'));
    expect(QUIZ_TRAITS).toContain(r.trait);
    expect(r.species).toBe(TRAIT_SPECIES[r.trait]);
    for (const k of GAUGE_KEYS) expect(Math.abs(r.gauges[k])).toBeLessThanOrEqual(100);
    // Dimanche tranquille, règles lues à voix haute : posé, donc Gaston.
    const home = quizResult([
      { questionId: 'plan', choice: 'c' },
      { questionId: 'sale_journee', choice: 'a' },
      { questionId: 'dimanche', choice: 'b' },
      { questionId: 'groupe', choice: 'b' },
      { questionId: 'jeu', choice: 'a' },
      { questionId: 'voisin', choice: 'a' },
      { questionId: 'coupe', choice: 'c' },
    ]);
    expect(home.trait).toBe('pose');
    expect(home.species).toBe('gaston');
    expect(quizResult([]).trait).toBe('sociable');
  });

  it('code court', () => {
    const c = quizCodeFrom([0, 0.1, 0.5, 0.99, 0.3, 0.7]);
    expect(isQuizCode(c)).toBe(true);
    expect(isQuizCode('QIIIIII')).toBe(false);
  });
});

describe('quartiers', () => {
  it('code postal → arrondissement, ville, ou zone à son code', () => {
    expect(zoneOfPostalCode('75011')?.id).toBe('paris-11');
    expect(zoneOfPostalCode('75116')?.id).toBe('paris-16');
    expect(zoneOfPostalCode('69003')?.id).toBe('lyon-3');
    expect(zoneOfPostalCode('13016')?.id).toBe('marseille-16');
    expect(zoneOfPostalCode('33800')?.id).toBe('bordeaux');
    expect(zoneOfPostalCode('38000')?.id).toBe('cp-38000');
    expect(zoneOfPostalCode('7501')).toBeNull();
    expect(zoneById('cp-38000')?.postalCode).toBe('38000');
    expect(zoneById('nulle-part')).toBeNull();
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
  });

  it('position arrondie → quartier le plus proche dans son rayon', () => {
    expect(zoneOfPoint({ lat: 48.8674, lng: 2.3636 })?.id).toBe('paris-3');
    expect(zoneOfPoint({ lat: 48.858, lng: 2.381 })?.id).toBe('paris-11');
    expect(zoneOfPoint({ lat: 45.19, lng: 5.72 })).toBeNull();
  });

  it('compteur, seuil, ouverture', () => {
    expect(zoneProgress(38, 50, null)).toEqual({ count: 38, threshold: 50, missing: 12, open: false });
    expect(zoneProgress(10, 50, '2026-11-20T10:00:00Z').missing).toBe(0);
    expect(shouldOpen(50, 50, null)).toBe(true);
    expect(shouldOpen(60, 50, '2026-11-20T10:00:00Z')).toBe(false);
    expect(clampThreshold(0)).toBe(1);
  });

  it('fondateurs : les 3 premiers inviteurs, chacun une fois', () => {
    expect(
      foundersOf([
        { inviter: 's:b', confirmedAt: '2026-11-02' },
        { inviter: 'u:a', confirmedAt: '2026-11-01' },
        { inviter: 'u:a', confirmedAt: '2026-11-03' },
        { inviter: 's:d', confirmedAt: '2026-11-05' },
        { inviter: 's:c', confirmedAt: '2026-11-04' },
      ]),
    ).toEqual(['u:a', 's:b', 's:c']);
    expect(earnedItems({ ...ZERO_STATS, founded: 1 })).toContain('fondateur');
    expect(earnedItems(ZERO_STATS)).not.toContain('fondateur');
  });

  it('e-mail plausible', () => {
    expect(isPlausibleEmail('lea@exemple.fr')).toBe(true);
    expect(isPlausibleEmail('lea@exemple')).toBe(false);
  });
});

describe('croissance du site', () => {
  it('source quiz et quartier ; tableau du quiz et des quartiers', () => {
    const none = { claimed: null, inviterId: null, creatorCode: null, wordsOwnerId: null, groupId: null };
    expect(resolveAttribution({ ...none, claimed: { source: 'quiz', ref: 'QABCDEF' }, quizCode: 'QABCDEF' }, 'me')).toEqual({ source: 'quiz', ref: 'QABCDEF', referredBy: null });
    expect(resolveAttribution({ ...none, claimed: { source: 'quiz', ref: 'QZZ' } }, 'me').source).toBe('store');
    const r = growthReport({
      today: '2026-11-18',
      weeks: ['2026-11-16'],
      counters: [
        { day: '2026-11-17', metric: 'quiz_start', source: '', ref: '', count: 10 },
        { day: '2026-11-17', metric: 'quiz_start', source: 'ref', ref: '', count: 4 },
        { day: '2026-11-17', metric: 'quiz_done', source: '', ref: '', count: 10 },
        { day: '2026-11-17', metric: 'quiz_share', source: '', ref: '', count: 5 },
        { day: '2026-11-17', metric: 'quartier_join', source: '', ref: '', count: 3 },
        { day: '2026-11-18', metric: 'quartier_confirm', source: '', ref: '', count: 2 },
      ],
      events: [{ kind: 'onboarded', source: 'quiz', cohortOn: '2026-11-18' }],
      activeUsers: new Map(),
      groups: [],
    });
    expect(r.quiz[0]).toMatchObject({ started: 14, challenged: 4, done: 10, shared: 5, joined: 1 });
    expect(r.quiz[0]?.k).toBeCloseTo(0.4);
    expect(r.quartiers[0]).toEqual({ week: '2026-11-16', joins: 3, confirmed: 2, joined: 0 });
  });
});
