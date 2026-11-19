import { describe, expect, it } from 'vitest';

import {
  answerQuestion,
  answersBody,
  canSkip,
  currentQuestionId,
  distanceBand,
  pathWindow,
  profilGauges,
  reactionFor,
  seanceDone,
  skipQuestion,
  startSeance,
  todayView,
} from './logic';

const step = (id: string, state: 'done' | 'current' | 'locked') => ({ id, title: id, state });
const unit = (id: string, state: 'done' | 'current' | 'locked', steps: ReturnType<typeof step>[]) => ({ id, title: `U ${id}`, subtitle: '', icon: '🌱', state, done: 0, total: steps.length, steps });

const units = [
  unit('a', 'done', [step('a1', 'done'), step('a2', 'done')]),
  unit('b', 'current', [step('b1', 'done'), step('b2', 'current')]),
  unit('c', 'locked', [step('c1', 'locked'), step('c2', 'locked')]),
  unit('d', 'locked', [step('d1', 'locked'), step('d2', 'locked')]),
];

describe('pathWindow', () => {
  it('montre deux étapes faites, celle du jour, puis la suite avec un coffre par unité', () => {
    const w = pathWindow({ units, currentStepId: 'b2' });
    expect(w.map((n) => `${n.key}=${n.kind}`)).toEqual(['a:chest=chestOpen', 'b:b1=done', 'b:b2=current', 'b:chest=chest', 'c:c1=locked', 'c:c2=locked', 'c:chest=chest']);
  });
  it('parcours fini : les dernières étapes, toutes faites', () => {
    const done = units.map((u) => ({ ...u, state: 'done' as const, steps: u.steps.map((s) => ({ ...s, state: 'done' as const })) }));
    const w = pathWindow({ units: done, currentStepId: null });
    expect(w).toHaveLength(7);
    expect(w.every((n) => n.kind === 'done' || n.kind === 'chestOpen')).toBe(true);
  });
});

describe('todayView', () => {
  const quota = { free: 1, bonus: 0, bonusReason: null, used: 1, left: 0, nextSlot: null, bonusHint: 'Invite un pote.' };
  const map = (state: 'todo' | 'done' | 'bonus' | 'all_done') => ({ units, currentStepId: 'b2', title: 'Ton chemin', today: { day: '2026-11-19', state, quota, line: '' } });
  it("dit le thème de l'unité en cours quand la séance attend", () => {
    expect(todayView(map('todo'))).toEqual({ kind: 'todo', unitTitle: 'U b', questions: 5 });
    expect(todayView(map('bonus')).kind).toBe('bonus');
  });
  it('séance faite : comment gagner le bonus ; tout fait : repos', () => {
    expect(todayView(map('done'))).toEqual({ kind: 'done', hint: 'Invite un pote.' });
    expect(todayView(map('all_done'))).toEqual({ kind: 'rest', hint: null });
  });
});

const r = (text: string) => ({ text, animation: null });
const session = {
  id: '00000000-0000-4000-8000-000000000001',
  questions: [
    { id: 'q1', options: [{ id: 'a', label: 'A', icon: '🍝', reaction: r('Miam') }, { id: 'b', label: 'B', icon: '🪩', reaction: r('Oh') }], slider: null },
    { id: 'q2', options: [{ id: 'a', label: 'Calme', icon: '', reaction: r('bas') }, { id: 'b', label: 'Fête', icon: '', reaction: r('haut') }], slider: { min: 0 as const, max: 100 as const, start: 50, reactions: { low: r('bas'), mid: r('milieu'), high: r('haut') } } },
    { id: 'q3', options: [{ id: 'a', label: 'X', icon: '', reaction: r('x') }, { id: 'b', label: 'Y', icon: '', reaction: r('y') }], slider: null },
  ],
};

describe('séance', () => {
  it('« Passer » remet la question à la fin, jamais la dernière sans réponse', () => {
    let p = startSeance(session);
    expect(currentQuestionId(p)).toBe('q1');
    p = skipQuestion(p);
    expect(currentQuestionId(p)).toBe('q2');
    expect(p.queue).toEqual(['q2', 'q3', 'q1']);
    p = answerQuestion(p, 'q2', { value: 80 });
    p = answerQuestion(p, 'q3', { optionId: 'a' });
    expect(currentQuestionId(p)).toBe('q1');
    expect(canSkip(p)).toBe(false);
    expect(skipQuestion(p)).toBe(p);
    p = answerQuestion(p, 'q1', { optionId: 'b' });
    expect(seanceDone(p)).toBe(true);
  });
  it("envoie toutes les réponses dans l'ordre de la séance, curseur arrondi", () => {
    let p = startSeance(session);
    p = answerQuestion(p, 'q3', { optionId: 'b' });
    p = answerQuestion(p, 'q1', { optionId: 'a' });
    p = answerQuestion(p, 'q2', { value: 72.6 });
    expect(answersBody(session, p)).toEqual({
      sessionId: session.id,
      answers: [
        { questionId: 'q1', optionId: 'a' },
        { questionId: 'q2', value: 73 },
        { questionId: 'q3', optionId: 'b' },
      ],
    });
  });
  it('la réaction du curseur suit le bout ou le milieu', () => {
    const q2 = session.questions[1]!;
    expect(reactionFor(q2, { value: 10 })?.text).toBe('bas');
    expect(reactionFor(q2, { value: 50 })?.text).toBe('milieu');
    expect(reactionFor(q2, { value: 90 })?.text).toBe('haut');
    expect(reactionFor(session.questions[0]!, { optionId: 'b' })?.text).toBe('Oh');
    expect(reactionFor(session.questions[0]!, undefined)).toBeNull();
  });
});

describe('distanceBand', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  it('dit la distance à gros grains, jamais au mètre', () => {
    expect(distanceBand(paris, { latitude: 48.86, longitude: 2.36 })).toBe('neighborhood');
    expect(distanceBand(paris, { latitude: 48.88, longitude: 2.39 })).toBe('near');
    expect(distanceBand(paris, { latitude: 48.95, longitude: 2.5 })).toBe('around');
  });
});

describe('profilGauges', () => {
  it('met les jauges floues à la fin', () => {
    const g = (axis: string, confidence: number) => ({ axis, name: axis, about: '', lowLabel: '', highLabel: '', value: 10, confidence, side: 'center', line: '' });
    const out = profilGauges({ gauges: [g('foyer', 10), g('cap', 70), g('elan', 40)] as never });
    expect(out.map((x) => [x.axis, x.foggy])).toEqual([
      ['cap', false],
      ['elan', false],
      ['foyer', true],
    ]);
  });
});
