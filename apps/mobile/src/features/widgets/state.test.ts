import type { Link, RitualsToday, Streak } from '@blowy/contract';
import { describe, expect, it } from 'vitest';

import { challengeActivity, decideRunning, endOfDay, linkActivity, outingActivity, streakAfterMidnight, widgetSnapshot } from './state';

// Dimanche 15 novembre 2026, 16 h 42 à Paris (UTC+1).
const NOW = new Date('2026-11-15T15:42:00Z');
const MIDNIGHT = Date.parse('2026-11-15T23:00:00Z') / 1000;
const pet = { name: 'Nino', species: 'nino' as const, needs: { sociability: 64, hunger: 80, energy: 80, mood: 80 } };

const streak = (over: Partial<Streak> = {}): Streak => ({
  current: 12,
  best: 20,
  doneToday: false,
  atRisk: true,
  nextMilestone: { days: 14, itemId: null },
  jokersLeft: 0,
  jokersPerWeek: 1,
  week: Array.from({ length: 7 }, (_, i) => ({ day: `2026-11-${String(9 + i).padStart(2, '0')}`, status: 'done' as const })),
  ...over,
});

const today = (status: RitualsToday['challenge']['status'], s = streak()): RitualsToday =>
  ({
    day: '2026-11-15',
    challenge: { day: '2026-11-15', id: 'c', kind: 'photo', kindLabel: 'photo', text: 'Un café dehors', choices: null, howTo: '', status, present: false, answer: null },
    streak: s,
    outing: { question: '', answers: [], canAnswer: true, answer: null, confirmed: false },
    sociability: 64,
    needsOut: false,
    habitsDue: 0,
    proofAsked: [],
    unreadReviewId: null,
  }) as unknown as RitualsToday;

const link = (mine: boolean, theirs: boolean, streak = 4, id = '11111111-1111-4111-8111-111111111111'): Link =>
  ({ id, status: 'active', streak, other: { displayName: 'Léa' }, today: { day: '2026-11-15', mine, theirs, atStake: streak > 0 && !(mine && theirs), week: [] } }) as unknown as Link;

describe('widgetSnapshot', () => {
  it('déroule 24 h par pas de 2 h, minuit compris, avec la sociabilité qui baisse', () => {
    const s = widgetSnapshot({ pet, readAt: NOW, streak: streak(), today: today('offered') });
    expect(s.v).toBe(1);
    expect(s.url).toBe('blowy://pet');
    const ats = s.frames.map((f) => f.at);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(ats).toContain(MIDNIGHT);
    expect(s.frames.length).toBeLessThanOrEqual(14);
    expect(ats.at(-1)! - ats[0]!).toBeGreaterThanOrEqual(22 * 3600);
    expect(s.frames[0]!.sociability).toBe(64);
    expect(s.frames.at(-1)!.sociability).toBeLessThan(40);
    // Les entrées sont espacées d'au moins 5 min (règle WidgetKit).
    for (let i = 1; i < ats.length; i++) expect(ats[i]! - ats[i - 1]!).toBeGreaterThanOrEqual(300);
  });

  it('montre le défi du jour jusqu’à minuit, puis un nouveau défi sans texte', () => {
    const s = widgetSnapshot({ pet, readAt: NOW, streak: streak(), today: today('accepted') });
    const before = s.frames.filter((f) => f.at < MIDNIGHT);
    const after = s.frames.filter((f) => f.at >= MIDNIGHT);
    expect(before.every((f) => f.challenge === 'accepted' && f.challengeText === 'Un café dehors' && f.streak === 12)).toBe(true);
    expect(after.every((f) => f.challenge === 'todo' && f.challengeText === null)).toBe(true);
    // Défi pas fait, pas de joker : la série repart de zéro après minuit.
    expect(after.every((f) => f.streak === 0)).toBe(true);
  });

  it('défi fait : « relevé » jusqu’à minuit, la série tient', () => {
    const s = widgetSnapshot({ pet, readAt: NOW, streak: streak({ current: 13, doneToday: true }), today: today('done') });
    expect(s.frames.filter((f) => f.at < MIDNIGHT).every((f) => f.challenge === 'done')).toBe(true);
    expect(s.frames.filter((f) => f.at >= MIDNIGHT).every((f) => f.streak === 13)).toBe(true);
  });

  it('un défi d’un autre jour n’est pas montré', () => {
    const old = { ...today('accepted'), day: '2026-11-14' } as RitualsToday;
    const s = widgetSnapshot({ pet, readAt: NOW, streak: null, today: old });
    expect(s.frames[0]!.challengeText).toBeNull();
    expect(s.frames[0]!.challenge).toBe('todo');
  });

  it('reste identique d’une lecture à l’autre si rien n’a bougé (pas de rechargement inutile)', () => {
    const a = widgetSnapshot({ pet, readAt: NOW, streak: streak(), today: null });
    const b = widgetSnapshot({ pet, readAt: new Date(NOW.getTime() + 60_000), streak: streak(), today: null });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('streakAfterMidnight', () => {
  it('un joker protège la série', () => {
    expect(streakAfterMidnight(streak({ jokersLeft: 1 }))).toBe(12);
    expect(streakAfterMidnight(streak())).toBe(0);
    expect(streakAfterMidnight(null)).toBe(0);
  });
});

describe('activités en direct', () => {
  const inputs = { pet, streak: streak(), links: [] as Link[], now: NOW };

  it('le défi accepté démarre une activité jusqu’à minuit, une fois par jour', () => {
    expect(challengeActivity({ ...inputs, today: today('offered') })).toBeNull();
    const a = challengeActivity({ ...inputs, today: today('accepted') })!;
    expect(a.key).toBe('challenge:2026-11-15');
    expect(a.state).toEqual({ endsAt: MIDNIGHT, streak: 12, title: 'Un café dehors', done: false });
    expect(a.attributes).toMatchObject({ kind: 'challenge', pet: { name: 'Nino', species: 'nino' }, url: 'blowy://pet' });
    expect(endOfDay(NOW)).toBe(MIDNIGHT);
  });

  it('défi fait : état final laissé 15 min ; jour passé : retirée', () => {
    const running = challengeActivity({ ...inputs, today: today('accepted') })!;
    const done = decideRunning(running, { ...inputs, streak: streak({ doneToday: true, current: 13 }), today: today('done') });
    expect(done).toEqual({ action: 'end', state: { ...running.state, done: true, streak: 13 }, dismissAfterSeconds: 900 });
    const later = decideRunning(running, { ...inputs, today: today('accepted'), now: new Date((MIDNIGHT + 60) * 1000) });
    expect(later).toMatchObject({ action: 'end', dismissAfterSeconds: 0 });
    expect(decideRunning(running, { ...inputs, today: today('accepted') })).toEqual({ action: 'keep' });
  });

  it('série d’un lien : le soir seulement, quand l’autre a écrit et pas toi ; finie quand tu écris', () => {
    const evening = new Date('2026-11-15T18:30:00Z'); // 19 h 30 à Paris
    expect(linkActivity({ ...inputs, today: null, links: [link(false, true)] })).toBeNull(); // 16 h 42 : trop tôt
    expect(linkActivity({ ...inputs, now: evening, today: null, links: [link(false, false)] })).toBeNull();
    expect(linkActivity({ ...inputs, now: evening, today: null, links: [link(true, true)] })).toBeNull();
    const longer = link(false, true, 9, '22222222-2222-4222-8222-222222222222');
    const a = linkActivity({ ...inputs, now: evening, today: null, links: [link(false, true), longer] })!;
    expect(a.key).toBe('link:22222222-2222-4222-8222-222222222222:2026-11-15');
    expect(a.attributes).toMatchObject({ kind: 'link', otherName: 'Léa', url: 'blowy://link/22222222-2222-4222-8222-222222222222' });
    expect(a.state).toMatchObject({ streak: 9, done: false, title: null });
    expect(decideRunning(a, { ...inputs, now: evening, today: null, links: [link(true, true, 10, '22222222-2222-4222-8222-222222222222')] })).toEqual({
      action: 'end',
      state: { ...a.state, done: true, streak: 10 },
      dismissAfterSeconds: 600,
    });
    expect(decideRunning(a, { ...inputs, now: evening, today: null, links: [longer] })).toEqual({ action: 'keep' });
    expect(decideRunning(a, { ...inputs, now: new Date((MIDNIGHT + 60) * 1000), today: null, links: [longer] })).toMatchObject({ action: 'end', dismissAfterSeconds: 0 });
  });

  it('la sortie dure 8 h au plus', () => {
    const a = outingActivity(pet, NOW, 12);
    expect(a.state.endsAt - a.attributes.startedAt).toBe(8 * 3600);
  });
});
