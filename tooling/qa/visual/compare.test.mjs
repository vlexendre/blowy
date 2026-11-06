// Non-régression du comparateur lui-même (aucun navigateur requis).
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { compareImages, decodePng, encodePng, maskBitmap } from './lib/compare.mjs';
import { parseArgs } from './lib/args.mjs';
import { sortResults, summarize } from './lib/report.mjs';
import { loadRoutes, routesFileFor } from './screens.mjs';

function solid(w, h, rgb) {
  const p = new PNG({ width: w, height: h });
  for (let i = 0; i < p.data.length; i += 4) p.data.set([...rgb, 255], i);
  return p;
}
function paint(p, [x, y, w, h], rgb) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) p.data.set([...rgb, 255], (yy * p.width + xx) * 4);
  return p;
}

describe('compareImages', () => {
  it('image identique → 0 %', () => {
    const a = solid(40, 80, [255, 247, 236]);
    const r = compareImages(a, decodePng(encodePng(a)), { scale: 1 });
    expect(r.diffPixels).toBe(0);
    expect(r.diffRatio).toBe(0);
    expect(r.lowresDelta).toBe(0);
  });

  it('image totalement différente → 100 %', () => {
    const r = compareImages(solid(40, 80, [255, 255, 255]), solid(40, 80, [0, 0, 0]), { scale: 1 });
    expect(r.diffRatio).toBe(1);
    expect(r.lowresDelta).toBeCloseTo(1, 5);
  });

  it('un carré différent = sa surface exacte', () => {
    const ref = solid(100, 100, [255, 255, 255]);
    const app = paint(solid(100, 100, [255, 255, 255]), [10, 10, 20, 10], [255, 90, 60]);
    const r = compareImages(ref, app, { scale: 1 });
    expect(r.diffPixels).toBe(200);
    expect(r.diffRatio).toBeCloseTo(0.02, 6);
  });

  it('une zone masquée est ignorée (px CSS × échelle) et retirée du dénominateur', () => {
    const ref = solid(100, 100, [255, 255, 255]);
    const app = paint(solid(100, 100, [255, 255, 255]), [10, 10, 20, 10], [0, 0, 0]);
    const r = compareImages(ref, app, { masks: [[5, 5, 10, 5]], scale: 2 });
    expect(r.diffPixels).toBe(0);
    expect(r.maskedPixels).toBe(200);
    expect(r.comparedPixels).toBe(10_000 - 200);
  });

  it('variation de teinte sous le seuil ignorée, mauvais jeton détecté', () => {
    const ref = solid(10, 10, [255, 247, 236]);
    expect(compareImages(ref, solid(10, 10, [254, 246, 235]), { scale: 1 }).diffPixels).toBe(0);
    expect(compareImages(ref, solid(10, 10, [255, 255, 255]), { scale: 1, threshold: 0.01 }).diffPixels).toBe(100);
  });

  it('taille différente : signalée, complétée et comptée comme écart', () => {
    const r = compareImages(solid(10, 20, [255, 255, 255]), solid(10, 10, [255, 255, 255]), { scale: 1 });
    expect(r.sizeMismatch).toBe(true);
    expect(r.diffPixels).toBe(100);
  });

  it('maskBitmap borne les rectangles à l’image', () => {
    const m = maskBitmap(4, 4, [[-1, 0, 10, 1]], 1);
    expect(m.slice(0, 4).every((v) => v === 1)).toBe(true);
    expect(m.slice(4).every((v) => v === 0)).toBe(true);
  });
});

describe('rapport', () => {
  it('trie absents puis du pire au meilleur ; moyenne avec et sans absents', () => {
    const rs = [
      { ref: 'A', diffRatio: 0.1, lowresDelta: 0.05 },
      { ref: 'B', diffRatio: null },
      { ref: 'C', diffRatio: 0.5, lowresDelta: 0.2 },
    ];
    expect(sortResults(rs).map((r) => r.ref)).toEqual(['B', 'C', 'A']);
    const s = summarize(rs);
    expect(s.meanDiffRatio).toBeCloseTo(0.3);
    expect(s.meanDiffRatioCountingAbsentAs100).toBeCloseTo(1.6 / 3);
  });
});

describe('configuration', () => {
  it('options --clé valeur et --clé=valeur', () => {
    expect(parseArgs(['--', '--ref', 'design/v5/renders', '--only=V4-Nid', '--rebuild'])).toEqual({ ref: 'design/v5/renders', only: 'V4-Nid', rebuild: true });
  });
  it('correspondance par jeu de références : v4 par défaut, v5 déduit', () => {
    expect(routesFileFor(undefined)).toMatch(/routes\.v4\.json$/);
    expect(routesFileFor('design/v5/renders')).toMatch(/routes\.v5\.json$/);
    const v4 = loadRoutes(routesFileFor());
    expect(v4.screens).toHaveLength(39);
    expect(new Set(v4.screens.map((s) => s.ref)).size).toBe(39);
    const v5 = loadRoutes(routesFileFor('design/v5/renders')).screens;
    expect(v5.length).toBeGreaterThan(0);
    expect(new Set(v5.map((s) => s.ref)).size).toBe(v5.length); // une référence = une route
    for (const s of v5) expect(s.ref).toMatch(/^(V5|W|L)-/);
  });
});

describe('route de travail (--route)', () => {
  it('retire les groupes expo-router et exige un seul écran', async () => {
    const { applyOverrides, toUrlPath } = await import('./lib/args.mjs');
    expect(toUrlPath('/(dev)/kitchen-sink')).toBe('/kitchen-sink');
    expect(toUrlPath('/(tabs)/nest/fiche')).toBe('/nest/fiche');
    const one = [{ ref: 'V4-Welcome', target: 'mobile', route: '/welcome', account: null }];
    expect(applyOverrides(one, { route: '/(dev)/kitchen-sink' })[0].route).toBe('/kitchen-sink');
    expect(applyOverrides(one, { account: 'alex' })[0].account).toBe('alex');
    expect(() => applyOverrides([...one, ...one], { route: '/x' })).toThrow();
    expect(applyOverrides(one, {})).toBe(one);
  });
});
