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

describe('contrastes ajoutés (relevé V4 exhaustif)', () => {
  it.each([
    ['navInk/white (onglets inactifs)', color.navInk, color.white, 4.5],
    ['ink/lime (onglet actif, tampon)', color.ink, color.lime, 4.5],
    ['white/ink (.cap, « PET. »)', color.white, color.ink, 4.5],
    ['white/pink (badge compteur, 9px gras)', color.white, color.pink, 3.0],
    ['white/violet (« PLUS »)', color.white, color.violet, 4.5],
    ['sig/cream', color.sig, color.cream, 4.5],
    ['ink/sunLight', color.ink, color.sunLight, 4.5],
    ['cyanDeep/cyanLight', color.cyanDeep, color.cyanLight, 4.5],
  ])('%s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

/**
 * Écart de la maquette documenté (docs/design/design-language.md §Accessibilité) : corail sur crème
 * = 2,92:1 (< 3:1 « grand texte »). Toléré uniquement pour du display ≥ 40 px doublé d'un texte
 * lisible ; ce test échoue si la paire se dégrade davantage.
 */
it('coral/cream reste au niveau maquette (2,9:1, exception display)', () => {
  expect(contrastRatio(color.coral, color.cream)).toBeGreaterThanOrEqual(2.9);
});
