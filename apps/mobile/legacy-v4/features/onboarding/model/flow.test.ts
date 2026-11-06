import { describe, expect, it } from 'vitest';
import { consentsRequest, petCreationRequest } from './account-step';
import { ageAt, axisBucket, canContinue, defaultPreferences, fallbackSpecies, initialDraft, parseFrenchDate, resumeStep, togglePassion, type OnboardingDraft } from './flow';

const complete: OnboardingDraft = { ...initialDraft, petName: 'Nino', school: 'BEAUX_ARTS', sunday: 'BRUNCH', passions: ['SPORT'], limit: 'GHOSTER', intention: 'OPEN_TO_MORE', hatched: true };

describe('onboarding', () => {
  it('reprise : retombe sur la première étape incomplète', () => {
    expect(resumeStep({ ...complete, step: 'intention', sunday: null }, false)).toBe('sunday');
    expect(resumeStep({ ...complete, step: 'hatch' }, false)).toBe('hatch');
  });
  it('reprise : étapes post-compte exigent une session', () => {
    expect(resumeStep({ ...complete, step: 'verify' }, false)).toBe('account');
    expect(resumeStep({ ...complete, step: 'verify' }, true)).toBe('verify');
  });
  it('passions : 4 maximum, bascule', () => {
    let l = togglePassion([], 'SPORT');
    l = togglePassion(l, 'ART');
    l = togglePassion(l, 'JEUX');
    l = togglePassion(l, 'DANSE');
    expect(togglePassion(l, 'VOYAGE')).toHaveLength(4);
    expect(togglePassion(l, 'ART')).not.toContain('ART');
  });
  it('CTA désactivé tant que l’étape est incomplète', () => {
    expect(canContinue(initialDraft, 'species')).toBe(false);
    expect(canContinue(complete, 'species')).toBe(true);
    expect(canContinue({ ...complete, intention: null }, 'intention')).toBe(false);
  });
  it('dates et âge (18+ pré-contrôle)', () => {
    expect(parseFrenchDate('14/03/1998')).toBe('1998-03-14');
    expect(parseFrenchDate('31/02/2000')).toBeNull();
    expect(ageAt('2008-11-02', new Date(Date.UTC(2026, 10, 1)))).toBe(17);
    expect(ageAt('2008-11-01', new Date(Date.UTC(2026, 10, 1)))).toBe(18);
  });
  it('axes en 5 crans', () => {
    expect(axisBucket(-1)).toBe('strongLeft');
    expect(axisBucket(0.1)).toBe('balanced');
    expect(axisBucket(0.4)).toBe('right');
  });
  it('préférences par défaut affichées, majeures', () => {
    const p = defaultPreferences(19, 'FRIENDS_ONE');
    expect(p.ageMin).toBe(18);
    expect(p.intention).toBe('FRIENDS_ONE');
  });
  it('espèce premium sans droit → repli gratuit, vision conservée', () => {
    expect(fallbackSpecies('SUZIE')).toBe('GASTON');
    const req = petCreationRequest({ ...complete, species: 'PIA' }, false);
    expect(req?.species).toBe('GASTON');
    expect(req?.vision.school).toBe('BEAUX_ARTS');
    expect(petCreationRequest({ ...complete, species: 'PIA' }, true)?.species).toBe('PIA');
  });
  it('consentements versionnés à partir de l’état serveur', () => {
    const r = consentsRequest({ items: [], currentVersions: { TERMS: '3', PRIVACY: '2', AI_MODERATION: '1', AI_SUGGESTIONS: '1', AI_NARRATION: '1', SENSITIVE_PREFERENCES: '1' }, socialAllowed: false }, { terms: true, privacy: true, moderation: false });
    expect(r?.items).toEqual([
      { purpose: 'TERMS', version: '3', granted: true },
      { purpose: 'PRIVACY', version: '2', granted: true },
      { purpose: 'AI_MODERATION', version: '1', granted: false },
    ]);
  });
});
