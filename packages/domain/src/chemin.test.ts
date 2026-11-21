import { describe, expect, it } from 'vitest';
import {
  CHEMIN_STREAK_MILESTONES,
  type CheminQuestion,
  type CheminUnit,
  EMPTY_VISION,
  type VisionProfile,
  answerValue,
  answersAgree,
  cheminMap,
  cheminQuota,
  PLUS_SESSIONS_LEFT,
  cheminStreakRules,
  completeStreakDay,
  deliverableAnimation,
  deliverableFormat,
  jokersLeft,
  knowsLevelOf,
  liveCatalogue,
  minimoaTypeOf,
  nextStreakMilestone,
  pickPersonOfDay,
  pickSession,
  revelationOf,
  settleStreak,
  streakReward,
} from './index';

const opt = (id: string, weight: number, tag: string | null = null) => ({
  id,
  icon: '•',
  weight,
  tag,
  reaction: { animation: 'rire', minBuild: 50 },
});
const q = (id: string, over: Partial<CheminQuestion> = {}): CheminQuestion => ({
  id,
  format: 'choice',
  axis: 'rythme',
  direction: 1,
  options: [opt('a', -60, 'calme'), opt('b', 60, 'dehors')],
  minBuild: 0,
  status: 'live',
  legacyTestId: null,
  ...over,
});
const unit = (id: string, position: number, steps: [string, string[]][]): CheminUnit => ({
  id,
  position,
  icon: '★',
  minBuild: 0,
  status: 'live',
  steps: steps.map(([sid, qids], i) => ({
    id: sid,
    unitId: id,
    position: i,
    questionIds: qids,
    status: 'live',
  })),
});

const questions = [
  ...['t1', 't2', 't3', 't4', 't5'].map((id) => q(id, { legacyTestId: id })),
  ...['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2'].map((id) => q(id)),
  q('slide', { format: 'slider', axis: 'cap', direction: -1, options: [opt('l', -100), opt('r', 100)] }),
  q('rank', { format: 'ranking', minBuild: 99, options: [opt('a', -50), opt('b', 0), opt('c', 50)] }),
  q('draft', { status: 'draft' }),
];
const catalogue = liveCatalogue(
  [
    unit('vision', 0, [['v1', ['t1', 't2', 't3', 't4', 't5']]]),
    unit('energie', 1, [
      ['e1', ['a1', 'a2', 'a3', 'a4', 'a5']],
      ['e2', ['b1', 'b2', 'slide', 'rank', 'draft']],
    ]),
  ],
  questions,
);
const client = { build: 60, formats: null };
const none = { completedSteps: new Set<string>(), testDone: false };

describe('Ton chemin : catalogue et formats', () => {
  it('ne garde que ce qui est en ligne, dans l’ordre', () => {
    expect(catalogue.units.map((u) => u.id)).toEqual(['vision', 'energie']);
    expect(catalogue.units[1]?.steps[1]?.questionIds).toEqual(['b1', 'b2', 'slide', 'rank']);
  });
  it('replie un format inconnu du build en choix simple, jamais un curseur', () => {
    const rank = catalogue.questions.get('rank')!;
    expect(deliverableFormat(rank, client)).toBe('choice');
    expect(deliverableFormat(rank, { build: 120, formats: null })).toBe('ranking');
    expect(
      deliverableFormat(catalogue.questions.get('slide')!, { build: 60, formats: ['choice'] }),
    ).toBeNull();
    expect(deliverableAnimation(rank.options[0]!, { build: 10, formats: null })).toBeNull();
    expect(deliverableAnimation(rank.options[0]!, client)).toBe('rire');
  });
  it('donne une valeur orientée à chaque réponse', () => {
    expect(answerValue(catalogue.questions.get('a1')!, { optionId: 'b', value: null })).toBe(60);
    expect(answerValue(catalogue.questions.get('a1')!, { optionId: 'zz', value: null })).toBeNull();
    // Curseur, sens −1 : tout à droite → pôle − de l'axe.
    expect(answerValue(catalogue.questions.get('slide')!, { optionId: null, value: 100 })).toBe(-100);
    expect(answerValue(catalogue.questions.get('slide')!, { optionId: null, value: 50 })).toBe(0);
    expect(answerValue(catalogue.questions.get('slide')!, { optionId: null, value: 140 })).toBeNull();
    expect(
      answersAgree(
        catalogue.questions.get('slide')!,
        { optionId: null, value: 30 },
        { optionId: null, value: 45 },
      ),
    ).toBe(true);
  });
});

describe('Ton chemin : carte et séance', () => {
  it('le test de vision déjà passé vaut l’unité 1', () => {
    const map = cheminMap(catalogue, { completedSteps: new Set(), testDone: true }, client);
    expect(map.units[0]?.state).toBe('done');
    expect(map.currentStepId).toBe('e1');
    expect(cheminMap(catalogue, none, client).currentStepId).toBe('v1');
  });
  it('pose les questions de l’étape, puis complète par des révisions', () => {
    const progress = { completedSteps: new Set(['v1', 'e1']), testDone: false };
    const answeredOn = new Map([
      ['a1', '2026-11-01'],
      ['a2', '2026-11-03'],
      ['t1', '2026-11-02'],
    ]);
    const s = pickSession({
      catalogue,
      progress,
      client,
      answeredOn,
      vision: EMPTY_VISION,
      userId: 'u',
      day: '2026-11-20',
    })!;
    expect(s.kind).toBe('step');
    expect(s.stepId).toBe('e2');
    expect(s.questions.map((x) => x.questionId)).toEqual(['b1', 'b2', 'slide', 'rank', 'a1']);
    expect(s.questions[3]?.format).toBe('choice');
    expect(s.questions[4]?.review).toBe(true);
  });
  it('tout fait : une séance de révision ; rien répondu : rien', () => {
    const progress = { completedSteps: new Set(['v1', 'e1', 'e2']), testDone: false };
    expect(
      pickSession({
        catalogue,
        progress,
        client,
        answeredOn: new Map(),
        vision: EMPTY_VISION,
        userId: 'u',
        day: '2026-11-20',
      }),
    ).toBeNull();
    const answeredOn = new Map(['a1', 'a2', 'a3', 'a4', 'a5', 'b1'].map((id) => [id, '2026-11-10']));
    const s = pickSession({
      catalogue,
      progress,
      client,
      answeredOn,
      vision: EMPTY_VISION,
      userId: 'u',
      day: '2026-11-20',
    })!;
    expect(s.kind).toBe('review');
    expect(s.questions).toHaveLength(5);
    // Même personne, même jour : même séance.
    expect(
      pickSession({
        catalogue,
        progress,
        client,
        answeredOn,
        vision: EMPTY_VISION,
        userId: 'u',
        day: '2026-11-20',
      }),
    ).toEqual(s);
  });
});

describe('Ton chemin : quota, révélation, profil', () => {
  it('une séance par jour sans Minimoa+, sans bonus ni cumul ; autant qu’on veut avec', () => {
    expect(cheminQuota({ doneToday: 0, bonusReason: null })).toMatchObject({
      left: 1,
      nextSlot: 0,
      unlimited: false,
    });
    expect(cheminQuota({ doneToday: 1, bonusReason: null })).toMatchObject({ left: 0, nextSlot: null });
    expect(cheminQuota({ doneToday: 1, bonusReason: 'wave_answered' })).toMatchObject({
      bonus: 0,
      left: 0,
      nextSlot: null,
    });
    expect(cheminQuota({ doneToday: 5, bonusReason: null, plus: true })).toMatchObject({
      used: 5,
      left: PLUS_SESSIONS_LEFT,
      nextSlot: 1,
      unlimited: true,
    });
    expect(cheminQuota({ doneToday: 0, bonusReason: null, plus: true })).toMatchObject({ nextSlot: 0 });
  });
  it('révèle l’axe qui penche le plus aujourd’hui', () => {
    expect(revelationOf([])).toBeNull();
    expect(
      revelationOf([
        { axis: 'rythme', value: 30 },
        { axis: 'cap', value: -80 },
        { axis: 'cap', value: -60 },
      ]),
    ).toEqual({ axis: 'cap', side: 'low' });
  });
  const vision = (rythme: number, cap: number, elan: number, confidence = 50): VisionProfile => ({
    ...EMPTY_VISION,
    rythme: { value: rythme, confidence },
    cap: { value: cap, confidence },
    elan: { value: elan, confidence },
  });
  it('nomme 8 types, seulement quand il en sait assez', () => {
    expect(minimoaTypeOf(EMPTY_VISION)).toBeNull();
    expect(minimoaTypeOf(vision(-50, 40, 30))).toBe('phare');
    expect(minimoaTypeOf(vision(60, -40, -30))).toBe('fanfare');
    expect(knowsLevelOf(EMPTY_VISION).level).toBe('little');
    expect(
      knowsLevelOf({
        ...vision(0, 0, 0, 80),
        foyer: { value: 0, confidence: 80 },
        ancrage: { value: 0, confidence: 80 },
      }).level,
    ).toBe('very_well');
  });
});

describe('Ton chemin : personne du jour', () => {
  const session = ['a1', 'a2', 'a3'].map((id) => ({
    question: catalogue.questions.get(id)!,
    answer: { optionId: 'a', value: null },
  }));
  it('préfère le plus de réponses en commun, puis la compatibilité', () => {
    const p = pickPersonOfDay(session, [
      { id: 'x', compatibility: 95, answers: new Map([['a1', { optionId: 'b', value: null }]]) },
      {
        id: 'y',
        compatibility: 75,
        answers: new Map(['a1', 'a2'].map((id) => [id, { optionId: 'a', value: null }])),
      },
      { id: 'z', compatibility: 80, answers: new Map() },
    ])!;
    expect(p).toMatchObject({ id: 'y', agree: ['a1', 'a2'], tags: ['calme'], openerQuestionId: 'a1' });
    expect(pickPersonOfDay(session, [])).toBeNull();
    expect(
      pickPersonOfDay(session, [{ id: 'z', compatibility: 80, answers: new Map() }])?.openerQuestionId,
    ).toBe('a1');
  });
});

describe('Série de Ton chemin', () => {
  it('un gel par mois en gratuit, un par semaine avec Minimoa+', () => {
    const free = cheminStreakRules(false);
    let s = completeStreakDay(
      { current: 0, best: 0, lastDoneOn: null, jokerDays: [] },
      '2026-11-02',
      free,
    ).state;
    s = completeStreakDay(s, '2026-11-04', free).state; // 3 nov. gelé
    expect(s.current).toBe(2);
    expect(jokersLeft(s, '2026-11-20', free)).toBe(0);
    expect(settleStreak(s, '2026-11-06', free).current).toBe(0); // 5 nov. : plus de gel ce mois-ci
    expect(jokersLeft(s, '2026-12-01', free)).toBe(1);
    const plus = cheminStreakRules(true);
    expect(settleStreak(s, '2026-11-06', plus).current).toBe(0); // même semaine que le 3
    expect(settleStreak(s, '2026-11-10', plus).current).toBe(0);
  });
  it('paliers 7, 30, 100, 365', () => {
    expect(CHEMIN_STREAK_MILESTONES).toEqual([7, 30, 100, 365]);
    const rules = cheminStreakRules(false);
    const six = { current: 6, best: 6, lastDoneOn: '2026-11-09', jokerDays: [] };
    expect(completeStreakDay(six, '2026-11-10', rules).milestone).toBe(7);
    expect(completeStreakDay({ ...six, current: 2, best: 2 }, '2026-11-10', rules).milestone).toBeNull();
    expect(nextStreakMilestone(100, 100, rules.milestones)).toEqual({ days: 365, itemId: null });
    expect(streakReward(7)).toBe('lunettes_etoile');
  });
});
