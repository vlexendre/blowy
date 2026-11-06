import { keyframes as KF } from '@blowy/design-tokens';
import { describe, expect, it } from 'vitest';
import { blurredDiscIntensity, blurredDiscStops, blobExtent } from './blur';
import {
  cubicBezierAt,
  directedProgress,
  restValues,
  sampleKeyframes,
  toTransform,
} from './keyframes';
import { screenPadding } from './layout';
import {
  ALL_FONT_FAMILIES,
  bodyFamily,
  bodyFont,
  displayFamily,
  displayFont,
  strongFamily,
} from './typography';

describe('cubic-bezier', () => {
  it('bornes et linéaire', () => {
    expect(cubicBezierAt(0.42, 0, 0.58, 1, 0)).toBe(0);
    expect(cubicBezierAt(0.42, 0, 0.58, 1, 1)).toBe(1);
    expect(cubicBezierAt(0, 0, 1, 1, 0.37)).toBeCloseTo(0.37, 6);
  });
  it('ease-in-out symétrique, pop dépasse 1 (rebond)', () => {
    expect(cubicBezierAt(0.42, 0, 0.58, 1, 0.5)).toBeCloseTo(0.5, 5);
    const overshoot = Math.max(
      ...Array.from({ length: 50 }, (_, i) => cubicBezierAt(0.2, 1.2, 0.3, 1, i / 50)),
    );
    expect(overshoot).toBeGreaterThan(1);
  });
});

describe('keyframes CSS', () => {
  it('sq : aux images clés exactes de la maquette', () => {
    const at = (p: number) => sampleKeyframes('sq', p * 2400);
    expect(at(0)).toMatchObject({ ty: 0, sx: 1, sy: 1 });
    expect(at(0.3).ty).toBeCloseTo(-12, 6);
    expect(at(0.3).sx).toBeCloseTo(0.96, 6);
    expect(at(0.3).sy).toBeCloseTo(1.05, 6);
    expect(at(0.52).sx).toBeCloseTo(1.05, 6);
    expect(at(0.7).ty).toBeCloseTo(-3, 6);
  });
  it('délai négatif = déphasage ; reverse = progression inversée', () => {
    expect(sampleKeyframes('sq', 0, { delayMs: -600 })).toEqual(sampleKeyframes('sq', 600));
    expect(
      directedProgress(KF.drift, 3000, { durationMs: 12000, delayMs: -5000, reverse: true }),
    ).toBeCloseTo(1 - 8000 / 12000, 9);
  });
  it('orbite : 24 s linéaire, 38,25° à 2 550 ms ; contre-rotation opposée', () => {
    expect(sampleKeyframes('orbit', 2550).r).toBeCloseTo(38.25, 6);
    expect(sampleKeyframes('orbit', 2550, { reverse: true }).r).toBeCloseTo(360 - 38.25, 6);
  });
  it('pop : invisible avant le délai (fill both), identité après', () => {
    expect(sampleKeyframes('pop', 100, { delayMs: 520 })).toMatchObject({ ty: 18, s: 0.94, o: 0 });
    expect(sampleKeyframes('pop', 2000, { delayMs: 520 })).toMatchObject({ ty: 0, s: 1, o: 1 });
  });
  it('repos (réduire les animations) : fin pour une entrée, début pour une boucle', () => {
    expect(restValues('pop').o).toBe(1);
    expect(restValues('sq')).toMatchObject({ ty: 0, sx: 1, sy: 1 });
    expect(restValues('orbit').r).toBe(0);
  });
  it('transformation RN dans l’ordre CSS translate → rotate → scale', () => {
    const tr = toTransform(sampleKeyframes('drift', 5000));
    expect(tr[0]).toEqual({ translateX: 24 });
    expect(tr[1]).toEqual({ translateY: -30 });
    expect(tr[3]).toEqual({ scaleX: 1.15 });
  });
  it('pulse : anneau de 7 px transparent à 70 %', () => {
    const v = sampleKeyframes('pulse', 0.7 * 1800);
    expect(v.spread).toBeCloseTo(7, 6);
    expect(v.a).toBeCloseTo(0, 6);
  });
});

describe('flou des halos', () => {
  it('disque large : plein au centre, moitié au bord, nul au-delà de 3σ', () => {
    expect(blurredDiscIntensity(0, 1000, 10)).toBeCloseTo(1, 3);
    expect(blurredDiscIntensity(1000, 1000, 10)).toBeCloseTo(0.5, 1);
    expect(blurredDiscIntensity(1040, 1000, 10)).toBeLessThan(0.001);
  });
  it('blob Welcome (Ø300, σ70) : profil décroissant, extrémité transparente', () => {
    const st = blurredDiscStops(150, 70, 0.8, 32);
    expect(blobExtent(150, 70)).toBe(360);
    expect(st[0]!.opacity).toBeLessThanOrEqual(0.8);
    for (let i = 1; i < st.length; i++)
      expect(st[i]!.opacity).toBeLessThanOrEqual(st[i - 1]!.opacity);
    expect(st.at(-1)).toEqual({ offset: 1, opacity: 0 });
  });
});

describe('typographie', () => {
  it('opsz exact pour les tailles de la maquette, plus proche sinon', () => {
    expect(displayFamily(56)).toBe('BricolageGrotesque-D56');
    expect(displayFamily(29)).toBe('BricolageGrotesque-D29');
    expect(displayFamily(120)).toBe('BricolageGrotesque-D96');
    expect(displayFamily(57)).toBe('BricolageGrotesque-D56');
    expect(strongFamily(18)).toBe('BricolageGrotesque-B18');
  });
  it('Inter 800 rendu 700 (non chargé par les maquettes)', () => {
    expect(bodyFamily(800)).toBe('Inter-700');
    expect(bodyFamily(600)).toBe('Inter-600');
  });
  it('style .d : −0,03 em, interligne 0,95', () => {
    const d = displayFont(56);
    expect(d.fontFamily).toBe('BricolageGrotesque-D56');
    expect(d.lineHeight).toBeCloseTo(53.2, 9);
    expect(d.letterSpacing).toBeCloseTo(-1.68, 9);
    expect(bodyFont(11, 700, 0.14)).toEqual({
      fontFamily: 'Inter-700',
      fontSize: 11,
      letterSpacing: 1.54,
    });
  });
  it('liste complète des familles à charger', () => {
    expect(ALL_FONT_FAMILIES).toHaveLength(27 + 9 + 4);
  });
});

describe('marges d’écran', () => {
  it('iPhone 390×844 (47/34) = maquette 56/22/26', () => {
    expect(screenPadding({ top: 47, bottom: 34, left: 0, right: 0 })).toEqual({
      paddingTop: 56,
      paddingBottom: 26,
      paddingLeft: 22,
      paddingRight: 22,
    });
  });
  it('îlot dynamique (59/34) : 9 pt sous la barre d’état', () => {
    expect(screenPadding({ top: 59, bottom: 34, left: 0, right: 0 }).paddingTop).toBe(68);
  });
});

describe('barre d’onglets .gnav', () => {
  it('à 18 px du bas sur iPhone 844 (indicateur 34)', async () => {
    const { tabBarBottom } = await import('./layout');
    expect(tabBarBottom(34)).toBe(18);
    expect(tabBarBottom(0)).toBe(18);
  });
  it('reflet : rayons CSS réduits proportionnellement', async () => {
    const { sheenPath } = await import('./layout');
    expect(sheenPath(306, 29)).toMatch(/^M18\.\d+,0 H287\.\d+/);
  });
});
