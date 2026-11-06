import { describe, expect, it, vi } from 'vitest';
import { initialDraft, type OnboardingDraft } from './flow';
import { submitOnboarding, type SubmitPorts } from './submit';

const ports = (over: Partial<SubmitPorts> = {}): SubmitPorts => ({
  updateProfile: vi.fn(async () => ({})),
  searchNeighborhoods: vi.fn(async () => ({ items: [{ id: 'h1', status: 'LIVE' }] })),
  setNeighborhood: vi.fn(async () => ({})),
  consentVersions: vi.fn(async () => ({ TERMS: '1', PRIVACY: '1', AI_MODERATION: '1', SENSITIVE_PREFERENCES: '1' })),
  recordConsents: vi.fn(async () => ({})),
  putIntentions: vi.fn(async () => ({})),
  putPrivacy: vi.fn(async () => ({})),
  createPet: vi.fn(async () => ({})),
  completeOnboarding: vi.fn(async () => ({})),
  joinTeam: vi.fn(async () => ({})),
  ...over,
});

const draft: OnboardingDraft = { ...initialDraft, city: { query: 'Paris 11e', neighborhoodId: null, name: null, live: null }, birthDate: { day: '3', month: '4', year: '1998' }, gender: 'MAN', species: 'NINO', meetingMode: 'BOTH', lookingFor: 'FRIENDS', sensitiveConsent: false, completed: true };

describe('envoi du brouillon après le compte', () => {
  it('quartier saisi résolu, mode discret explicite, team rejointe', async () => {
    const p = ports();
    const r = await submitOnboarding({ ...draft, inviteRef: 'r8Tz4w' }, { displayName: 'Alex', discreet: true }, p);
    expect(r.ok).toBe(true);
    expect(p.setNeighborhood).toHaveBeenCalledWith('h1');
    expect(p.putPrivacy).toHaveBeenCalledWith({ discreetMode: true });
    expect(p.joinTeam).toHaveBeenCalledWith('r8Tz4w');
  });

  it('art. 9 jamais envoyé sans accord', async () => {
    const p = ports();
    await submitOnboarding(draft, { displayName: 'Alex', discreet: false }, p);
    const items = (p.recordConsents as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as { purpose: string }[];
    expect(items.some((i) => i.purpose === 'SENSITIVE_PREFERENCES')).toBe(false);
  });

  it('une étape en échec est rapportée, les autres continuent', async () => {
    const p = ports({ createPet: vi.fn(async () => Promise.reject(new Error('VISION_REQUIRED'))) });
    const r = await submitOnboarding(draft, { displayName: 'Alex', discreet: false }, p);
    expect(r.ok).toBe(false);
    expect(r.failed.map((f) => f.step)).toEqual(['pet']);
    expect(p.completeOnboarding).toHaveBeenCalled();
  });
});
