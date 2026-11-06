import { describe, expect, it } from 'vitest';
import { firstOffSaturday, isoWeekMonday, onFreeWeekend } from './weekend';

describe('week-end sur deux', () => {
  it('lundi de la semaine ISO', () => {
    expect(new Date(isoWeekMonday('2026-W46')).toISOString().slice(0, 10)).toBe('2026-11-09');
    expect(new Date(firstOffSaturday('2026-W46')).toISOString().slice(0, 10)).toBe('2026-11-14');
  });
  it('sam. 21 nov. est libre, sam. 14 et 28 nov. ne le sont pas', () => {
    expect(onFreeWeekend('2026-11-21T14:00:00.000Z', '2026-W46')).toBe(true);
    expect(onFreeWeekend('2026-11-22T14:00:00.000Z', '2026-W46')).toBe(true);
    expect(onFreeWeekend('2026-11-14T14:00:00.000Z', '2026-W46')).toBe(false);
    expect(onFreeWeekend('2026-11-28T14:00:00.000Z', '2026-W46')).toBe(false);
    expect(onFreeWeekend('2026-11-19T18:30:00.000Z', '2026-W46')).toBe(false);
    expect(onFreeWeekend('2026-11-21T14:00:00.000Z', null)).toBe(false);
  });
});
