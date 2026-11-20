import { describe, expect, it } from 'vitest';
import { MESSAGE_SPARKS_CAP, NO_ACTIVITY, TROPHY_COUNT, rankLeague, trophies, trophiesWon, weekEnd, weekStart, weeklySparks } from './progression';

describe('progression', () => {
  it('la semaine commence le lundi', () => {
    expect(weekStart('2026-11-20')).toBe('2026-11-16'); // vendredi → lundi
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // dimanche
    expect(weekEnd('2026-11-20')).toBe('2026-11-22');
  });
  it('les messages rapportent peu et sont plafonnés', () => {
    expect(weeklySparks(NO_ACTIVITY)).toBe(0);
    expect(weeklySparks({ sessions: 2, messages: 3, waves: 1, links: 1 })).toBe(20 + 3 + 5 + 20);
    expect(weeklySparks({ ...NO_ACTIVITY, messages: 10_000 })).toBe(MESSAGE_SPARKS_CAP);
  });
  it('classement stable, pas de podium à zéro', () => {
    const r = rankLeague([{ userId: 'b', sparks: 0 }, { userId: 'a', sparks: 30 }, { userId: 'c', sparks: 30 }]);
    expect(r.map((e) => [e.userId, e.rank, e.podium])).toEqual([['a', 1, true], ['c', 2, true], ['b', 3, false]]);
  });
  it('18 trophées, trois seuils par famille', () => {
    const t = trophies({ waves: 12, bestStreak: 30, messages: 0, links: 0, sessions: 0, places: 0 });
    expect(t.find((x) => x.family === 'bonjour')).toMatchObject({ won: 2, next: 50 });
    expect(t.find((x) => x.family === 'serie')).toMatchObject({ won: 3, next: null });
    expect(trophiesWon(t)).toBe(5);
    expect(TROPHY_COUNT).toBe(18);
  });
});
