import { describe, expect, it } from 'vitest';
import { LEAGUE_TIER_MIN, MESSAGE_SPARKS_CAP, leagueTierOf, nextLeague, sessionSparks, speedSparks, NO_ACTIVITY, TROPHY_COUNT, rankLeague, trophies, trophiesWon, weekEnd, weekStart, weeklySparks } from './progression';

describe('progression', () => {
  it('la semaine commence le lundi', () => {
    expect(weekStart('2026-11-20')).toBe('2026-11-16'); // vendredi → lundi
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // dimanche
    expect(weekEnd('2026-11-20')).toBe('2026-11-22');
  });
  it('les messages rapportent peu et sont plafonnés', () => {
    expect(weeklySparks(NO_ACTIVITY)).toBe(0);
    expect(weeklySparks({ sessions: 2, sessionSparks: 20, messages: 3, waves: 1, links: 1 })).toBe(20 + 3 + 5 + 20);
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

  it('séance : 10, plus la vitesse, plus la cohérence, 25 au plus', () => {
    // 5 réponses en 40 s (8 s chacune), toutes cohérentes avec la réponse d'avant : 10 + 5 + 10.
    const same = Array.from({ length: 5 }, () => ({ value: 50, previous: 40, axis: null }));
    expect(sessionSparks(same, 40)).toMatchObject({ total: 25, speed: 5, coherence: 10, checked: 5, coherent: 5 });
    // Trop vite (5 s pour 5 réponses) et au hasard : 10, rien de plus.
    const random = Array.from({ length: 5 }, () => ({ value: -80, previous: 60, axis: null }));
    expect(sessionSparks(random, 5)).toMatchObject({ total: 10, speed: 0, coherence: 0, coherent: 0 });
    // Nouveau : rien à comparer (axe peu sûr) : 1 par réponse.
    const fresh = Array.from({ length: 5 }, () => ({ value: 10, previous: null, axis: { value: 90, confidence: 10 } }));
    expect(sessionSparks(fresh, 120)).toMatchObject({ total: 16, speed: 1, coherence: 5, checked: 0 });
    expect(speedSparks(80, 5)).toBe(3);
  });
  it('ligues : la semaine d’avant décide, le seuil suivant est connu', () => {
    expect(leagueTierOf(0)).toBe('plume');
    expect(leagueTierOf(LEAGUE_TIER_MIN.houppette)).toBe('houppette');
    expect(leagueTierOf(10_000)).toBe('etoile');
    expect(nextLeague('pompon')).toEqual({ tier: 'houppette', sparks: 150 });
    expect(nextLeague('etoile')).toBeNull();
  });
});
