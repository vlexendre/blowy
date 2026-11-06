import { describe, expect, it } from 'vitest';
import { badgeStyle, BUTTON_SURFACE, cardStyle, chipStyle, labelStyle, pressable3DStyle, resolveButton, stampStyle } from './styles';

const shadowOf = (s: { boxShadow?: unknown }) => (s.boxShadow as Array<{ offsetY: number; color: string; spreadDistance: number }> | undefined)?.[0];

describe('Button (.btn .b1 .b2 .b3 .bl)', () => {
  it('surfaces et ombres exactes', () => {
    expect(BUTTON_SURFACE.b1).toEqual({ bg: '#FF5A3C', fg: '#FFFFFF', shadow: '#C4341B' });
    expect(BUTTON_SURFACE.b2).toEqual({ bg: '#16110D', fg: '#FFFFFF', shadow: '#000000' });
    expect(BUTTON_SURFACE.b3).toEqual({ bg: '#FFFFFF', fg: '#16110D', shadow: '#E8D9C4' });
    expect(BUTTON_SURFACE.lime).toEqual({ bg: '#C8F542', fg: '#16110D', shadow: '#16110D' });
  });
  it('anciens noms conservés (primary = b1, dark = b2, secondary = b3)', () => {
    expect(resolveButton('primary').surface).toEqual(BUTTON_SURFACE.b1);
    expect(resolveButton('dark').surface).toEqual(BUTTON_SURFACE.b2);
    expect(resolveButton('secondary').surface).toEqual(BUTTON_SURFACE.b3);
  });
  it('typo : Bricolage largeur normale 18 px, capitales, .01em ; lien : Inter 13 px 700', () => {
    expect(resolveButton('b1').text).toMatchObject({ fontFamily: 'BricolageGrotesque-B18', fontSize: 18, letterSpacing: 0.18, textTransform: 'uppercase' });
    expect(resolveButton('b1').box).toMatchObject({ minHeight: 56, paddingHorizontal: 20, gap: 10 });
    expect(resolveButton('link').text).toMatchObject({ fontFamily: 'Inter-700', fontSize: 13 });
    expect(resolveButton('link').box.minHeight).toBe(44);
  });
  it('appui : descend de 4 px et perd l’ombre', () => {
    const up = pressable3DStyle('#FF5A3C', '#C4341B', 5, 4, 18, false, false);
    const down = pressable3DStyle('#FF5A3C', '#C4341B', 5, 4, 18, true, false);
    expect(shadowOf(up)).toMatchObject({ offsetY: 5, color: '#C4341B' });
    expect(down.boxShadow).toBeUndefined();
    expect(down.transform).toEqual([{ translateY: 4 }]);
  });
});

describe('Chip, Badge, Stamp, Card, Label', () => {
  it('puce md : 6/12, ombre .07 si blanche ; colorée sans ombre', () => {
    const w = chipStyle('white', 'md', 'soft');
    expect(w.box).toMatchObject({ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#FFFFFF' });
    expect(shadowOf(w.box)).toMatchObject({ offsetY: 2, color: 'rgba(0,0,0,0.07)' });
    expect(chipStyle('ink', 'sm', 'none').box.boxShadow).toBeUndefined();
  });
  it('badge compteur 16 px rose, anneau blanc 2 px', () => {
    const b = badgeStyle('count', '#FF3D7F', true);
    expect(b).toMatchObject({ minWidth: 16, height: 16, paddingHorizontal: 4 });
    expect(shadowOf(b)).toMatchObject({ spreadDistance: 2, color: 'rgba(255,255,255,0.9)' });
  });
  it('tampons « PET. » et lime', () => {
    expect(stampStyle('ink')).toMatchObject({ backgroundColor: '#16110D', borderRadius: 16, paddingTop: 0, paddingHorizontal: 12, paddingBottom: 6, transform: [{ rotate: '-3deg' }] });
    expect(shadowOf(stampStyle('ink'))).toMatchObject({ offsetY: 5, color: '#FF5A3C' });
    expect(stampStyle('lime')).toMatchObject({ backgroundColor: '#C8F542', borderRadius: 14, paddingTop: 2, transform: [{ rotate: '-2deg' }] });
  });
  it('carte rayon 22 + ombre 4 px #EEDFCB', () => {
    expect(cardStyle()).toMatchObject({ borderRadius: 22, backgroundColor: '#FFFFFF' });
    expect(shadowOf(cardStyle())).toMatchObject({ offsetY: 4, color: '#EEDFCB' });
  });
  it('.lbl 11 px 700 .14em capitales', () => {
    expect(labelStyle()).toMatchObject({ fontSize: 11, letterSpacing: 1.54, textTransform: 'uppercase', fontFamily: 'Inter-700' });
  });
});
