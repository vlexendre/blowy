/**
 * Intégration réelle : nouveau compte local → profil (18+), consentements versionnés,
 * préférences, création du pet depuis le brouillon d'onboarding, fin d'onboarding, lot d'onboarding.
 */
import { describe, expect, it } from 'vitest';
import { createApi } from '../core/api/client';
import { BlowyApiError } from '../core/api/errors';
import { createAccountRepository } from '../features/account/api/account.repository';
import { createMatchingRepository } from '../features/matching/api/matching.repository';
import { consentsRequest, petCreationRequest } from '../features/onboarding/model/account-step';
import { defaultPreferences, initialDraft } from '../features/onboarding/model/flow';
import { createPetsRepository } from '../features/pets/api/pets.repository';

const randomUUID = (): string => globalThis.crypto.randomUUID();

const BASE = process.env.BLOWY_API_URL ?? 'http://localhost:3999';
let token: string | null = null;
const api = createApi({ baseUrl: BASE, getToken: () => token, newCommandId: randomUUID });
const account = createAccountRepository(api, 'ios');
const pets = createPetsRepository(api);
const matching = createMatchingRepository(api);

describe('onboarding mobile ↔ API locale (compte neuf)', () => {
  const key = `it-${randomUUID().slice(0, 8)}`;

  it('nouveau compte → onboarding requis', async () => {
    const s = await account.signIn({ provider: 'local', credential: key }, 'integration');
    token = s.accessToken;
    expect(s.isNewUser).toBe(true);
    expect(s.onboardingRequired).toBe(true);
  });

  it('mineur refusé par le serveur (AGE_RESTRICTED)', async () => {
    const e = await account.updateProfile(randomUUID(), { birthDate: '2015-01-01' }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(BlowyApiError);
    expect((e as BlowyApiError).code).toBe('AGE_RESTRICTED');
  });

  it('profil, consentements, préférences, pet, fin d’onboarding', async () => {
    await account.updateProfile(randomUUID(), { birthDate: '1998-03-14', gender: 'UNDISCLOSED', timezone: 'Europe/Paris', zoneCode: 'PARIS_11' });
    const req = consentsRequest(await account.consents(), { terms: true, privacy: true, moderation: true });
    const consents = await account.recordConsents(randomUUID(), req!);
    expect(consents.socialAllowed).toBe(true);
    await account.putPreferences(randomUUID(), { ...defaultPreferences(28, 'LET_IT_HAPPEN'), seekingGenders: ['WOMAN', 'MAN', 'NON_BINARY', 'UNDISCLOSED'] });
    const draft = { ...initialDraft, petName: 'Biscotte', species: 'SUZIE' as const, school: 'CIRQUE' as const, sunday: 'RANDO' as const, passions: ['SPORT' as const], limit: 'JUGER' as const, intention: 'LET_IT_HAPPEN' as const, hatched: true };
    // Espèce premium sans droit → repli Gaston, vision conservée (P-5.11).
    const pet = await pets.create(randomUUID(), petCreationRequest(draft, false)!);
    expect(pet.species).toBe('GASTON');
    expect(pet.vision?.school).toBe('CIRQUE');
    await account.startVerification(randomUUID());
    const me = await account.completeOnboarding(randomUUID());
    expect(me.onboarded).toBe(true);
    const feed = await matching.onboardingBatch();
    expect(feed.items.length > 0 || feed.emptyReason !== null).toBe(true);
  });
});
