import { describe, expect, it } from 'vitest';
import { color, displayFace, easing, keyframes, opticalSizes, shadow3d } from './index.js';

describe('jetons relevés', () => {
  it('toutes les couleurs sont des #RRGGBB', () => {
    for (const v of Object.values(color)) expect(v).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('style .d exact', () => {
    expect(displayFace).toEqual({ weight: 800, stretch: 85, letterSpacingEm: -0.03, lineHeight: 0.95 });
  });
  it('tailles optiques triées, uniques, dans 12..96', () => {
    for (const list of Object.values(opticalSizes)) {
      expect([...list].sort((a, b) => a - b)).toEqual([...list]);
      expect(new Set(list).size).toBe(list.length);
      for (const s of list) {
        expect(s).toBeGreaterThanOrEqual(12);
        expect(s).toBeLessThanOrEqual(96);
      }
    }
  });
  it('ombres 3D des boutons = maquette', () => {
    expect(shadow3d.b1).toEqual({ y: 5, color: '#C4341B' });
    expect(shadow3d.b2).toEqual({ y: 5, color: '#000000' });
    expect(shadow3d.b3).toEqual({ y: 5, color: '#E8D9C4' });
  });
  it.each(Object.entries(keyframes))('keyframes %s bien formées', (_n, k) => {
    expect(k.stops[0]!.at).toBe(0);
    expect(k.stops[k.stops.length - 1]!.at).toBe(1);
    for (let i = 1; i < k.stops.length; i++) expect(k.stops[i]!.at).toBeGreaterThan(k.stops[i - 1]!.at);
    const keys = Object.keys(k.stops[0]!).sort().join();
    for (const s of k.stops) expect(Object.keys(s).sort().join()).toBe(keys);
    expect(easing[k.easing]).toHaveLength(4);
  });
});
