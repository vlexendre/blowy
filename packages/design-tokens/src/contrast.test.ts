import { describe, expect, it } from 'vitest';
import { color, contrastRatio } from './index.js';

describe('contrastes des paires texte/fond utilisées', () => {
  it.each([
    ['ink/cream', color.ink, color.cream, 4.5],
    ['inkSoft/cream', color.inkSoft, color.cream, 4.5],
    ['muted/white (petits labels)', color.muted, color.white, 3.0],
    ['white/ink', color.white, color.ink, 4.5],
    ['ink/lime', color.ink, color.lime, 4.5],
    ['white/violet', color.white, color.violet, 4.5],
    ['ink/sun', color.ink, color.sun, 4.5],
    ['white/coral (texte bouton ≥18px gras)', color.white, color.coral, 3.0],
  ])('%s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
