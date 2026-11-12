import { describe, expect, it } from 'vitest';

import { hashString, isNight, makeSeed } from './seed';

describe('hasard déterministe des pets (règle 8)', () => {
  it('même graine, même suite', () => {
    const a = makeSeed(hashString('pet-1') ^ 12345);
    const b = makeSeed(hashString('pet-1') ^ 12345);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('deux pets ne jouent pas la même suite', () => {
    const a = makeSeed(hashString('pet-1'));
    const b = makeSeed(hashString('pet-2'));
    expect(a.next()).not.toEqual(b.next());
  });

  it('jamais deux fois de suite la même blague', () => {
    const s = makeSeed(42);
    const jokes = ['hop', 'look', 'wiggle', 'mood'] as const;
    let last: (typeof jokes)[number] | undefined;
    for (let i = 0; i < 200; i++) {
      const next = s.pick(jokes, last);
      expect(next).not.toBe(last);
      last = next;
    }
  });

  it('range reste dans ses bornes', () => {
    const s = makeSeed(7);
    for (let i = 0; i < 100; i++) {
      const v = s.range(3500, 7000);
      expect(v).toBeGreaterThanOrEqual(3500);
      expect(v).toBeLessThan(7000);
    }
  });

  it('la nuit va de 22 h à 7 h', () => {
    expect(isNight(new Date(2026, 10, 12, 23, 0))).toBe(true);
    expect(isNight(new Date(2026, 10, 12, 6, 59))).toBe(true);
    expect(isNight(new Date(2026, 10, 12, 7, 0))).toBe(false);
    expect(isNight(new Date(2026, 10, 12, 21, 59))).toBe(false);
  });
});
