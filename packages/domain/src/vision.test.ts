import { describe, expect, it } from 'vitest';
import {
  testAnswersState,
  visionBucketOf,
  AXIS_WEIGHTS,
  CLOSENESS_SPAN,
  EMPTY_VISION,
  GRID_METERS,
  HOME_MOVE_HOURS,
  MATCH_THRESHOLD,
  type MatchPerson,
  NO_HOME,
  SOURCE_WEIGHTS,
  TEST_HALF_EVIDENCE,
  VISION_AXES,
  VISION_TEST,
  type VisionProfile,
  type VisionSignal,
  cellOf,
  cellsAround,
  compatibilityOf,
  distanceKm,
  isAwayFromHome,
  isMatchable,
  leastConfidentAxis,
  match,
  matchMode,
  matchingCenter,
  readAxis,
  recencyWeight,
  shownPosition,
  sideOf,
  snapToGrid,
  testSignals,
  testWeight,
  updateHome,
  visionProfile,
  visionScore,
} from './vision';

const NOW = new Date('2026-11-15T12:00:00Z');
const daysAgo = (d: number): string => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const sig = (axis: VisionSignal['axis'], value: number, source: VisionSignal['source'], at = NOW.toISOString()): VisionSignal => ({ axis, value, source, at });
const profile = (values: Partial<Record<VisionSignal['axis'], number>>, confidence = 80): VisionProfile => {
  const out = { ...EMPTY_VISION } as Record<VisionSignal['axis'], { value: number; confidence: number }>;
  for (const axis of VISION_AXES) out[axis] = { value: values[axis] ?? 0, confidence };
  return out;
};

describe('profil de vision : poids, décroissance, confiance', () => {
  it('poids de départ de la spéc. (somme 100 %)', () => {
    expect(SOURCE_WEIGHTS).toEqual({ test: 0.4, daily: 0.2, habit: 0.25, care: 0.1, words: 0.05 });
    expect(Object.values(SOURCE_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('sans observation : 0, confiance 0', () => {
    expect(visionProfile([], NOW)).toEqual(EMPTY_VISION);
  });

  it('test seul : la valeur du test, confiance modeste', () => {
    const r = readAxis([sig('foyer', 80, 'test'), sig('foyer', 60, 'test')], NOW);
    expect(r.value).toBe(70);
    // preuve 2 → 2/6 = 33 %, très cohérent (écart 10) → ×0,95
    expect(r.confidence).toBe(32);
  });

  it('mélange des sources selon leurs poids (test 40 %, question du jour 20 %)', () => {
    const r = readAxis([sig('cap', 100, 'test'), sig('cap', -100, 'daily')], NOW);
    // test : 0,4 × 8/(8+1) ; daily : 0,2
    const wt = 0.4 * (8 / 9);
    expect(r.value).toBe(Math.round((wt * 100 - 0.2 * 100) / (wt + 0.2)));
  });

  it("le poids du test décroît à mesure que les autres sources s'accumulent", () => {
    expect(testWeight(0)).toBeCloseTo(0.4);
    expect(testWeight(TEST_HALF_EVIDENCE)).toBeCloseTo(0.2);
    expect(testWeight(3 * TEST_HALF_EVIDENCE)).toBeCloseTo(0.1);
    const few = readAxis([sig('elan', 80, 'test'), sig('elan', -80, 'daily')], NOW);
    const many = readAxis([sig('elan', 80, 'test'), ...Array.from({ length: 20 }, () => sig('elan', -80, 'daily'))], NOW);
    expect(few.value).toBeGreaterThan(0);
    // 20 réponses du jour : le test ne pèse plus que 0,4 × 8/28 ≈ 0,11 contre 0,2.
    expect(many.value).toBe(Math.round((testWeight(20) * 80 - 0.2 * 80) / (testWeight(20) + 0.2)));
    expect(many.value).toBeLessThan(-20);
  });

  it("les observations hors test s'effacent avec le temps (demi-vie 120 jours), pas le test", () => {
    expect(recencyWeight({ source: 'daily', at: daysAgo(120) }, NOW)).toBeCloseTo(0.5);
    expect(recencyWeight({ source: 'test', at: daysAgo(400) }, NOW)).toBe(1);
    const old = readAxis([sig('rythme', -60, 'habit', daysAgo(360)), sig('rythme', 60, 'habit', daysAgo(0))], NOW);
    expect(old.value).toBeGreaterThan(40);
  });

  it('la confiance monte avec la preuve et baisse quand les observations se contredisent', () => {
    const one = readAxis([sig('ancrage', 50, 'daily')], NOW).confidence;
    const five = readAxis(Array.from({ length: 5 }, () => sig('ancrage', 50, 'daily')), NOW).confidence;
    const twenty = readAxis(Array.from({ length: 20 }, () => sig('ancrage', 50, 'daily')), NOW).confidence;
    expect(one).toBe(20);
    expect(five).toBeGreaterThan(one);
    expect(twenty).toBeGreaterThan(80);
    const torn = readAxis([...Array.from({ length: 10 }, () => sig('ancrage', 100, 'daily')), ...Array.from({ length: 10 }, () => sig('ancrage', -100, 'daily'))], NOW);
    expect(torn.value).toBe(0);
    expect(torn.confidence).toBeLessThan(twenty * 0.6);
  });

  it('déterministe, observations du futur ignorées, valeurs bornées', () => {
    const signals = [sig('foyer', 500, 'test'), sig('foyer', 90, 'daily', '2030-01-01T00:00:00Z')];
    expect(visionProfile(signals, NOW)).toEqual(visionProfile(signals, NOW));
    expect(visionProfile(signals, NOW).foyer.value).toBe(100);
  });

  it("axe le moins sûr, côtés, profil assez connu", () => {
    const p = { ...profile({}, 50), cap: { value: 0, confidence: 10 } };
    expect(leastConfidentAxis(p)).toBe('cap');
    expect([sideOf(-20), sideOf(-19), sideOf(19), sideOf(20)]).toEqual(['low', 'mid', 'mid', 'high']);
    expect(isMatchable(EMPTY_VISION)).toBe(false);
    expect(isMatchable({ ...EMPTY_VISION, foyer: { value: 1, confidence: 1 }, cap: { value: 1, confidence: 1 }, elan: { value: 1, confidence: 1 } })).toBe(true);
  });
});

describe('répartition des visions (administration)', () => {
  it('5 tranches de 40 points, bornes comprises', () => {
    expect([-100, -61, -60, -21, -20, 0, 19, 20, 59, 60, 100].map(visionBucketOf)).toEqual([0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4]);
  });
});

describe('test de vision', () => {
  it('réponses à l’inscription : aucune (test plus tard) ou les 12 situations une fois chacune', () => {
    const all = VISION_TEST.map((q) => ({ questionId: q.id }));
    expect(testAnswersState([])).toBe('none');
    expect(testAnswersState(all)).toBe('complete');
    expect(testAnswersState(all.slice(1))).toBe('incomplete');
    expect(testAnswersState([...all.slice(1), all[2] ?? { questionId: '' }])).toBe('incomplete');
    expect(testAnswersState([...all, { questionId: 'astrologie' }])).toBe('unknown_question');
  });

  it('12 situations, chaque axe visé au moins deux fois, deux choix opposés', () => {
    expect(VISION_TEST).toHaveLength(12);
    expect(new Set(VISION_TEST.map((q) => q.id)).size).toBe(12);
    for (const axis of VISION_AXES) {
      const main = VISION_TEST.filter((q) => Math.abs(q.choices[0][axis] ?? 0) >= 60 || Math.abs(q.choices[1][axis] ?? 0) >= 60);
      expect(main.length, axis).toBeGreaterThanOrEqual(2);
    }
  });

  it('les réponses deviennent des observations « test » ; la dernière réponse à une question compte', () => {
    const at = NOW.toISOString();
    const signals = testSignals(
      [
        { questionId: 'enfants', choice: 1 },
        { questionId: 'enfants', choice: 0 },
        { questionId: 'inconnue', choice: 0 },
        { questionId: 'mutation', choice: 0 },
      ],
      at,
    );
    expect(signals).toEqual([
      { axis: 'foyer', value: 80, source: 'test', at },
      { axis: 'ancrage', value: 75, source: 'test', at },
      { axis: 'elan', value: 30, source: 'test', at },
    ]);
  });

  it('le test complet rend un profil utilisable', () => {
    const answers = VISION_TEST.map((q) => ({ questionId: q.id, choice: 0 as const }));
    const p = visionProfile(testSignals(answers, NOW.toISOString()), NOW);
    expect(isMatchable(p)).toBe(true);
    for (const axis of VISION_AXES) expect(p[axis].confidence).toBeGreaterThan(0);
  });
});

describe('ce que chacun cherche', () => {
  const s = (gender: 'femme' | 'homme' | 'non_binaire' | 'non_dit', seeking: 'potes' | 'plus' | 'les_deux', whom: 'femmes' | 'hommes' | 'tout_le_monde' | null = null) => ({ gender, seeking, whom });
  it('potes avec potes', () => expect(matchMode(s('femme', 'potes'), s('homme', 'potes'))).toBe('potes'));
  it('plus réciproque', () => expect(matchMode(s('femme', 'plus', 'hommes'), s('homme', 'les_deux', 'femmes'))).toBe('plus'));
  it('plus non réciproque, mais les deux ouverts aux potes', () => expect(matchMode(s('femme', 'les_deux', 'hommes'), s('homme', 'les_deux', 'hommes'))).toBe('potes'));
  it('plus seulement d’un côté, potes de l’autre : rien', () => expect(matchMode(s('femme', 'plus', 'hommes'), s('homme', 'potes'))).toBeNull());
  it('plus des deux côtés, sexe qui ne correspond pas : rien', () => expect(matchMode(s('femme', 'plus', 'femmes'), s('homme', 'plus', 'femmes'))).toBeNull());
  it('sexe non dit : « plus » seulement avec « tout le monde »', () => {
    expect(matchMode(s('non_dit', 'plus', 'tout_le_monde'), s('femme', 'plus', 'tout_le_monde'))).toBe('plus');
    expect(matchMode(s('non_dit', 'plus', 'tout_le_monde'), s('femme', 'plus', 'hommes'))).toBeNull();
    expect(matchMode(s('non_binaire', 'les_deux', 'tout_le_monde'), s('femme', 'les_deux', 'femmes'))).toBe('potes');
  });
});

describe('compatibilité', () => {
  it('identiques : 100 ; opposés aux pôles : 0', () => {
    expect(visionScore(profile({ foyer: 50, cap: -30 }), profile({ foyer: 50, cap: -30 }), 'potes')).toBe(100);
    const hi = profile({ foyer: 100, ancrage: 100, elan: 100, rythme: 100, cap: 100 });
    const lo = profile({ foyer: -100, ancrage: -100, elan: -100, rythme: -100, cap: -100 });
    expect(visionScore(hi, lo, 'plus')).toBe(0);
    expect(CLOSENESS_SPAN).toBe(150);
  });

  it('Foyer compte double pour « plus », peu pour « potes »', () => {
    expect(AXIS_WEIGHTS.plus.foyer).toBe(2);
    expect(AXIS_WEIGHTS.potes.foyer).toBe(0.25);
    const me = profile({ foyer: 90 });
    const other = profile({ foyer: -60 });
    // Foyer seul diffère (écart 150 → proximité 0) : 4 axes sur 4,25 entre potes, 4 sur 6 pour plus.
    expect(visionScore(me, other, 'potes')).toBe(94);
    expect(visionScore(me, other, 'plus')).toBe(67);
  });

  it('la confiance pondère : un axe peu sûr compte moins', () => {
    const me = profile({ cap: 100 });
    const sure = profile({ cap: -50 });
    const unsure = { ...profile({}), cap: { value: -50, confidence: 5 } };
    expect(visionScore(me, unsure, 'potes')).toBeGreaterThan(visionScore(me, sure, 'potes'));
  });

  it('explication : 3 axes les plus proches en commun, 1 différence à explorer', () => {
    const me = profile({ foyer: 80, ancrage: -60, elan: 10, rythme: 50, cap: 70 });
    const other = profile({ foyer: 70, ancrage: -55, elan: 15, rythme: -40, cap: 20 });
    const c = compatibilityOf(me, other, 'plus');
    expect(c.common.map((p) => p.axis)).toEqual(['ancrage', 'elan', 'foyer']);
    expect(c.common[0]).toMatchObject({ axis: 'ancrage', side: 'low' });
    expect(c.common[1]).toMatchObject({ axis: 'elan', side: 'mid' });
    expect(c.explore).toMatchObject({ axis: 'rythme', mine: 'high', theirs: 'low' });
    expect(c.mode).toBe('plus');
  });

  it('égalité de proximité : ordre stable par poids puis par ordre des axes', () => {
    const c = compatibilityOf(profile({}), profile({}), 'plus');
    expect(c.common.map((p) => p.axis)).toEqual(['foyer', 'ancrage', 'elan']);
    expect(c.explore.axis).toBe('rythme');
  });
});

describe('appariement : filtres durs et seuil', () => {
  const base = (id: string, vision: VisionProfile, over: Partial<MatchPerson> = {}): MatchPerson => ({
    id,
    birthdate: '1995-01-01',
    gender: 'femme',
    seeking: 'potes',
    whom: null,
    vision,
    ...over,
  });
  const ctx = { today: '2026-11-15', blocked: new Set<string>(), distanceKm: 3, radiusKm: 20 };
  const me = base('a', profile({ foyer: 50, rythme: 40 }));

  it('au-dessus du seuil : proposé avec son explication', () => {
    const c = match(me, base('b', profile({ foyer: 40, rythme: 30 })), ctx);
    expect(c?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(c?.common).toHaveLength(3);
  });

  it('seuil : 70 passe, 69 ne passe pas', () => {
    // Un seul axe sûr, les autres à confiance minimale : le score suit la proximité de cet axe.
    const lone = (v: number): VisionProfile => ({ ...profile({}, 0), cap: { value: v, confidence: 100 }, foyer: { value: 0, confidence: 1 }, elan: { value: 0, confidence: 1 }, rythme: { value: 0, confidence: 1 } });
    const find = (target: number): number => {
      for (let v = 0; v <= 100; v++) if (visionScore(lone(-100), lone(-100 + v), 'potes') === target) return v;
      throw new Error(`pas de score ${target}`);
    };
    const at70 = find(70);
    const at69 = find(69);
    expect(match(base('a', lone(-100)), base('b', lone(-100 + at70)), ctx)?.score).toBe(70);
    expect(match(base('a', lone(-100)), base('b', lone(-100 + at69)), ctx)).toBeNull();
  });

  it('bloqué, soi-même, mineur, hors zone, sans position, ce qu’on cherche : jamais', () => {
    const other = base('b', me.vision);
    expect(match(me, other, ctx)).not.toBeNull();
    expect(match(me, base('a', me.vision), ctx)).toBeNull();
    expect(match(me, other, { ...ctx, blocked: new Set(['b']) })).toBeNull();
    expect(match(me, base('b', me.vision, { birthdate: '2009-01-01' }), ctx)).toBeNull();
    expect(match(me, other, { ...ctx, distanceKm: 25 })).toBeNull();
    expect(match(me, other, { ...ctx, distanceKm: null })).toBeNull();
    expect(match(me, other, { ...ctx, distanceKm: null, radiusKm: null })).not.toBeNull();
    expect(match(me, base('b', me.vision, { seeking: 'plus', whom: 'hommes' }), ctx)).toBeNull();
  });

  it('profil inconnu : pas proposé', () => {
    expect(match(me, base('b', EMPTY_VISION), ctx)).toBeNull();
  });
});

describe('positions : arrondi, décalage, zone du domicile', () => {
  const paris = { lat: 48.85661, lng: 2.35222 };

  it('arrondi à la maille de ~300 m', () => {
    const s = snapToGrid(paris, GRID_METERS);
    expect(distanceKm(s, paris)).toBeLessThan(0.22);
    expect(snapToGrid({ lat: paris.lat + 0.0001, lng: paris.lng + 0.0001 }, GRID_METERS)).toEqual(s);
  });

  it('position montrée : jamais exacte, stable pour une même graine, dans sa maille', () => {
    const a = shownPosition(paris, 'u1');
    expect(a).toEqual(shownPosition(paris, 'u1'));
    expect(a).not.toEqual(paris);
    expect(distanceKm(a, snapToGrid(paris, GRID_METERS))).toBeLessThan(0.16);
    expect(shownPosition(paris, 'u2')).not.toEqual(a);
    // Deux positions exactes différentes dans la même maille donnent la même position montrée.
    expect(shownPosition({ lat: paris.lat + 0.0002, lng: paris.lng }, 'u1')).toEqual(shownPosition(snapToGrid(paris, GRID_METERS), 'u1'));
  });

  it('cellules de l’index autour d’un centre', () => {
    const cells = cellsAround(paris, 20);
    expect(cells).toContain(cellOf(paris));
    expect(cells).toContain(cellOf({ lat: paris.lat + 0.17, lng: paris.lng }));
    expect(cells).not.toContain(cellOf({ lat: paris.lat + 0.5, lng: paris.lng }));
    expect(cells.length).toBeLessThanOrEqual(40);
  });

  it('distance', () => {
    expect(distanceKm(paris, { lat: 45.764, lng: 4.8357 })).toBeGreaterThan(380);
    expect(distanceKm(paris, { lat: 45.764, lng: 4.8357 })).toBeLessThan(400);
  });

  it('zone du domicile : posée au premier relevé, ne bouge pas pour une sortie, déménage après 72 h ailleurs', () => {
    const t0 = '2026-11-15T08:00:00Z';
    let h = updateHome(NO_HOME, paris, t0);
    expect(h.home).toEqual(snapToGrid(paris, GRID_METERS));
    const near = { lat: paris.lat + 0.005, lng: paris.lng };
    expect(updateHome(h, near, t0)).toEqual({ home: h.home, candidate: null, candidateSince: null });
    const lyon = { lat: 45.764, lng: 4.8357 };
    expect(isAwayFromHome(h.home, lyon)).toBe(true);
    expect(isAwayFromHome(h.home, near)).toBe(false);
    h = updateHome(h, lyon, t0);
    expect(h.home).toEqual(snapToGrid(paris, GRID_METERS));
    expect(h.candidateSince).toBe(t0);
    const later = (hours: number) => new Date(new Date(t0).getTime() + hours * 3_600_000).toISOString();
    expect(updateHome(h, lyon, later(HOME_MOVE_HOURS - 1)).home).toEqual(h.home);
    expect(updateHome(h, lyon, later(HOME_MOVE_HOURS)).home).toEqual(snapToGrid(lyon, GRID_METERS));
    // Retour à la maison : le candidat est oublié.
    expect(updateHome(h, paris, later(1)).candidate).toBeNull();
  });

  it('centre de recherche : la ville choisie seulement avec le droit de changer de ville', () => {
    const lyon = { lat: 45.764, lng: 4.8357 };
    expect(matchingCenter(paris, lyon, true)).toEqual(lyon);
    expect(matchingCenter(paris, lyon, false)).toEqual(paris);
    expect(matchingCenter(null, null, true)).toBeNull();
  });
});
