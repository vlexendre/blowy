import { describe, expect, it } from 'vitest';
import { approxCount } from './index.js';

describe('indicateurs de ville (V5.5 D-059) : seuil 10, arrondis', () => {
  it('sous 10 : pas assez de monde ; ensuite arrondis', () => {
    expect(approxCount(0)).toEqual({ notEnough: true });
    expect(approxCount(9)).toEqual({ notEnough: true });
    expect(approxCount(10).label).toBe('une dizaine');
    expect(approxCount(14).label).toBe('une dizaine');
    expect(approxCount(15).label).toBe('une vingtaine');
    expect(approxCount(31).label).toBe('une trentaine');
    expect(approxCount(37)).toMatchObject({ approx: 'ABOUT', value: 40, label: 'environ 40' });
    expect(approxCount(94)).toMatchObject({ value: 90 });
    expect(approxCount(120).label).toBe('plus de 100');
    expect(approxCount(212)).toMatchObject({ value: 200, label: 'environ 200' });
  });
  it('jamais un chiffre exact sous 35, jamais sous le seuil', () => {
    for (let n = 0; n < 35; n++) expect((approxCount(n) as { value?: number }).value).toBeUndefined();
    expect(approxCount(12, 20)).toEqual({ notEnough: true });
  });
});
