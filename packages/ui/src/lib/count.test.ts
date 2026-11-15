import { describe, expect, it } from 'vitest';

import { digitPosition, readCounter, shownCount } from './count';

/** Les valeurs prises par l'animation : montée avec dépassement (comme `useAnimatedNumber`, overshoot 0,04), puis retour. */
const animation = (from: number, target: number): number[] => {
  const peak = target + (target - from) * 0.04;
  const up = Array.from({ length: 41 }, (_, i) => from + ((peak - from) * i) / 40);
  const back = Array.from({ length: 11 }, (_, i) => peak + ((target - peak) * i) / 10);
  // Le ressort repasse un peu sous la cible avant de s'arrêter.
  return [...up, ...back, target - (target - from) * 0.01, target];
};

describe('compteur mécanique (jauge de sociabilité)', () => {
  it('compter de 0 à 100 ne montre jamais plus que 100 (« 102 % » vu une fois)', () => {
    for (const v of animation(0, 100)) {
      const shown = shownCount(v, 0, 100);
      expect(shown).toBeLessThanOrEqual(100);
      expect(Number(readCounter(shown, 3))).toBeLessThanOrEqual(100);
    }
    expect(readCounter(shownCount(104, 0, 100), 3)).toBe('100');
  });

  it('une cible à deux chiffres ne passe pas par « 02 » en dépassant 100', () => {
    for (const v of animation(0, 99)) expect(Number(readCounter(shownCount(v, 0, 99), 2))).toBeLessThanOrEqual(99);
    expect(readCounter(shownCount(102.96, 0, 99), 2)).toBe('99');
  });

  it('en descendant, le nombre ne passe pas sous la cible', () => {
    for (const v of animation(80, 40)) expect(shownCount(v, 80, 40)).toBeGreaterThanOrEqual(40);
  });

  it('les colonnes lisent le bon nombre une fois arrivé', () => {
    expect(readCounter(100, 3)).toBe('100');
    expect(readCounter(64, 2)).toBe('64');
    expect(digitPosition(9.5, 10)).toBeCloseTo(0.5);
  });
});
