import { describe, expect, it } from 'vitest';
import { alternateMondays, alternateWeekKeys, isoWeekKey, nextMondays } from './weeks';

describe('une semaine sur deux', () => {
  const now = Date.parse('2026-11-09T20:40:00+01:00'); // lundi 9 nov.
  it('propose les deux lundis suivants', () => {
    expect(nextMondays(now).map((t) => new Date(t).toISOString().slice(0, 10))).toEqual(['2026-11-16', '2026-11-23']);
  });
  it('semaines ISO', () => {
    expect(isoWeekKey(Date.parse('2026-11-16T00:00:00Z'))).toBe('2026-W47');
    expect(isoWeekKey(Date.parse('2027-01-04T00:00:00Z'))).toBe('2027-W01');
    expect(isoWeekKey(Date.parse('2026-12-28T00:00:00Z'))).toBe('2026-W53');
  });
  it('16, 30 nov., 14, 28 déc. puis 13 semaines au plus (contrat : 26)', () => {
    const from = nextMondays(now)[0]!;
    expect(alternateMondays(from, 4).map((t) => new Date(t).toISOString().slice(5, 10))).toEqual(['11-16', '11-30', '12-14', '12-28']);
    const keys = alternateWeekKeys(from);
    expect(keys).toHaveLength(13);
    expect(new Set(keys).size).toBe(13);
  });
});
