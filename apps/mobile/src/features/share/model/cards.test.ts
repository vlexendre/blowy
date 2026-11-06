import { describe, expect, it } from 'vitest';
import { isShareCard, newPeopleCount, SHARE_STYLES, venueCitableAt } from './cards';

describe('cartes de partage', () => {
  it('l’invitation est personnelle : jamais en story', () => {
    expect(SHARE_STYLES.invitation.actions).not.toContain('story');
  });
  it('compte des nouvelles personnes', () => {
    expect(newPeopleCount(5, 1)).toBe(3);
    expect(newPeopleCount(1, 3)).toBe(0);
  });
  it('lieu citable 12 h après la fin', () => {
    expect(new Date(venueCitableAt('2026-11-12T20:30:00.000Z')).toISOString()).toBe('2026-11-13T08:30:00.000Z');
  });
  it('garde-fou de route', () => {
    expect(isShareCard('soiree')).toBe(true);
    expect(isShareCard('n-importe')).toBe(false);
  });
});
