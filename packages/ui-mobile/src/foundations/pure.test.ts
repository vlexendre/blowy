import { describe, expect, it } from 'vitest';
import { BREATH, breathAt, clamp, frameIndexAt, maxPanX } from './motion';
import { petAccessibilityLabel, type PetLabelWords } from './pet-a11y';

const words: PetLabelWords = {
  pose: (p) =>
    ({ JOYFUL: 'joyeux', SICK: 'malade', PRESENTATION: 'tranquille', ASLEEP: 'endormi' })[
      p as 'JOYFUL'
    ] ?? p,
  withOther: (n) => `avec ${n}`,
  overlay: (o) => ({ sick: 'malade', sleep: 'endormi', hungry: 'affamé', sad: 'triste' })[o],
  walkingTo: (p) => `en route vers ${p}`,
};

describe('petAccessibilityLabel', () => {
  it('« Nino, joyeux, avec Suzie »', () => {
    expect(petAccessibilityLabel({ name: 'Nino', pose: 'JOYFUL', otherName: 'Suzie' }, words)).toBe(
      'Nino, joyeux, avec Suzie',
    );
  });
  it("vocalise l'état même quand le dessin est un repli, sans doublon", () => {
    expect(petAccessibilityLabel({ name: 'Gaston', pose: 'SICK', overlay: 'sick' }, words)).toBe(
      'Gaston, malade',
    );
    expect(
      petAccessibilityLabel({ name: 'Pia', pose: 'PRESENTATION', overlay: 'hungry' }, words),
    ).toBe('Pia, tranquille, affamé');
  });
  it('ajoute déplacement et accessoires', () => {
    expect(
      petAccessibilityLabel(
        { name: 'Nino', pose: 'JOYFUL', walkingTo: 'Chez Suzie', accessories: ['bonnet'] },
        words,
      ),
    ).toBe('Nino, joyeux, en route vers Chez Suzie, bonnet');
  });
});

describe('motion', () => {
  it('respiration : repos aux bornes, étirement à 30 %, écrasement à 52 %', () => {
    expect(breathAt(0)).toEqual({ translateY: 0, scaleX: 1, scaleY: 1 });
    const up = breathAt(0.3);
    expect(up.translateY).toBeCloseTo(-BREATH.lift);
    expect(up.scaleY).toBeGreaterThan(1);
    const down = breathAt(0.52);
    expect(down.translateY).toBeCloseTo(0);
    expect(down.scaleX).toBeGreaterThan(1);
    expect(breathAt(0.999).scaleX).toBeCloseTo(1, 1);
  });
  it('amplitude 0 = immobile (mouvement réduit)', () => {
    expect(breathAt(0.3, 0)).toEqual({ translateY: -0, scaleX: 1, scaleY: 1 });
  });
  it('frames : boucle pour la marche, arrêt sur la dernière pour le saut', () => {
    expect(frameIndexAt(0, 140, 4)).toBe(0);
    expect(frameIndexAt(560, 140, 4)).toBe(0);
    expect(frameIndexAt(430, 140, 4)).toBe(3);
    expect(frameIndexAt(10_000, 160, 4, false)).toBe(3);
    expect(frameIndexAt(100, 140, 0)).toBe(0);
  });
  it('caméra : pan borné selon le zoom', () => {
    expect(maxPanX(390, 390 * 1.35, 1)).toBeCloseTo((390 * 0.35) / 2);
    expect(maxPanX(390, 300, 1)).toBe(0);
    expect(clamp(5, 0, 3)).toBe(3);
  });
});
