import { describe, expect, it } from 'vitest';
import { HOUR_MS } from '@blowy/domain';
import { splitDayNight, wallToUtc, daysFromCivil, localParts, dayKeyFromDays, civilFromDays, weekdayFromDays, subtractIntervals } from './index.js';

const W = { startHour: 23, endHour: 8 };
const utc = (y: number, m: number, d: number, h = 0) => daysFromCivil(y, m, d) * 86_400_000 + h * HOUR_MS;

describe('temps local IANA', () => {
  it('calendrier aller-retour', () => {
    for (const n of [-1000, 0, 20000, 20759]) {
      const c = civilFromDays(n);
      expect(daysFromCivil(c.y, c.m, c.d)).toBe(n);
    }
    expect(dayKeyFromDays(daysFromCivil(2026, 3, 29))).toBe('2026-03-29');
    expect(weekdayFromDays(daysFromCivil(2026, 11, 1))).toBe(0);
  });
  it('heure locale Paris en été/hiver', () => {
    expect(localParts(utc(2026, 7, 1, 12), 'Europe/Paris').hour).toBe(14);
    expect(localParts(utc(2026, 12, 1, 12), 'Europe/Paris').hour).toBe(13);
  });
  it('trou de mars : 02:30 inexistant → avancé', () => {
    const d = daysFromCivil(2026, 3, 29);
    expect(wallToUtc(d, 2 * 60 + 30, 'Europe/Paris')).toBe(utc(2026, 3, 29, 1) + 30 * 60_000);
    expect(wallToUtc(d, 8 * 60, 'Europe/Paris')).toBe(utc(2026, 3, 29, 6));
    expect(wallToUtc(d - 1, 23 * 60, 'Europe/Paris')).toBe(utc(2026, 3, 28, 22));
  });
  it('repli d’octobre : 02:30 ambigu → première occurrence', () => {
    const d = daysFromCivil(2026, 10, 25);
    expect(wallToUtc(d, 2 * 60 + 30, 'Europe/Paris')).toBe(utc(2026, 10, 25, 0) + 30 * 60_000);
    expect(wallToUtc(d, 8 * 60, 'Europe/Paris')).toBe(utc(2026, 10, 25, 7));
  });
  it('nuit de changement d’heure : 8 h en mars, 10 h en octobre', () => {
    const mar = splitDayNight(utc(2026, 3, 28, 12), utc(2026, 3, 29, 12), 'Europe/Paris', W).filter((s) => s.night);
    expect(mar).toHaveLength(1);
    expect((mar[0]!.endMs - mar[0]!.startMs) / HOUR_MS).toBe(8);
    const oct = splitDayNight(utc(2026, 10, 24, 12), utc(2026, 10, 25, 12), 'Europe/Paris', W).filter((s) => s.night);
    expect((oct[0]!.endMs - oct[0]!.startMs) / HOUR_MS).toBe(10);
  });
  it('segments contigus couvrant exactement l’intervalle', () => {
    const from = utc(2026, 3, 20, 5) + 123;
    const to = utc(2026, 4, 2, 17);
    const segs = splitDayNight(from, to, 'America/New_York', W);
    expect(segs[0]!.startMs).toBe(from);
    expect(segs.at(-1)!.endMs).toBe(to);
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i]!.startMs).toBe(segs[i - 1]!.endMs);
      expect(segs[i]!.night).not.toBe(segs[i - 1]!.night);
    }
  });
  it('soustraction de pauses chevauchantes', () => {
    expect(subtractIntervals(0, 100, [{ startMs: 10, endMs: 30 }, { startMs: 20, endMs: 40 }, { startMs: 90, endMs: 200 }])).toEqual([
      { startMs: 0, endMs: 10 },
      { startMs: 40, endMs: 90 },
    ]);
  });
});
