import { describe, expect, it } from 'vitest';
import { petAccessibilityLabel } from '@blowy/ui-mobile/pure';
import { resolveSprite } from '@blowy/sprites';
import { actionAvailability } from './actions';
import { gaugeRows, petLabelWords } from './presentation';

const ctx = { hasRelationship: true, bothHere: true, myPetHere: true, capabilities: ['HUG', 'PLAY'] as const, online: true };

describe('actions du Nid', () => {
  it('câlin : capacité, présence des deux, réseau', () => {
    expect(actionAvailability('HUG', ctx)).toEqual({ enabled: true });
    expect(actionAvailability('HUG', { ...ctx, bothHere: false })).toEqual({ enabled: false, reason: 'NEEDS_PARTNER' });
    expect(actionAvailability('HUG', { ...ctx, capabilities: [] })).toEqual({ enabled: false, reason: 'NOT_UNLOCKED' });
    expect(actionAvailability('HUG', { ...ctx, online: false })).toEqual({ enabled: false, reason: 'NEEDS_NETWORK' });
  });
  it('soins disponibles hors ligne (file)', () => {
    expect(actionAvailability('FEED', { ...ctx, online: false, hasRelationship: false })).toEqual({ enabled: true });
  });
});

describe('présentation & accessibilité', () => {
  it('libellé VoiceOver en français', () => {
    expect(petAccessibilityLabel({ name: 'Nino', pose: 'JOYFUL', otherName: 'Suzie' }, petLabelWords)).toBe('Nino, joyeux, avec Suzie');
  });
  it('pose de repli : état vocalisé (Gaston malade)', () => {
    const r = resolveSprite('GASTON', 'YOUNG', 'SICK');
    expect(petAccessibilityLabel({ name: 'Gaston', pose: 'SICK', overlay: r.overlay }, petLabelWords)).toBe('Gaston, malade');
  });
  it('jauges : valeur écrite + alerte textuelle (pas que la couleur)', () => {
    const rows = gaugeRows({ satiety: 20, energy: 80, mood: 50, health: 90 });
    expect(rows[0]).toMatchObject({ key: 'satiety', label: 'Faim', valueText: '20 / 100', criticalLabel: 'Critique' });
    expect(rows[1]?.criticalLabel).toBeNull();
  });
});
