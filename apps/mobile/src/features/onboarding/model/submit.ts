/**
 * Envoi du brouillon d'onboarding après la création du compte (cas d'usage, pur et testé avec des
 * ports factices). Ordre : profil (prénom, date de naissance, genre) → quartier (choisi, sinon 1ʳᵉ
 * correspondance de la saisie) → consentements (dont art. 9 seulement si accordé) → intentions →
 * mode discret → pet → fin d'onboarding. Chaque étape échouée est rapportée, jamais masquée ; les
 * suivantes continuent si elles n'en dépendent pas.
 */
import type { IntentionsV5Dto } from '@blowy/api-contract';
import type { Species } from '@blowy/domain';
import { intentionsOf, parseBirthDate, type OnboardingDraft } from './flow';

export interface SubmitPorts {
  updateProfile(body: {
    displayName?: string;
    birthDate?: string;
    gender?: OnboardingDraft['gender'] & string;
  }): Promise<unknown>;
  searchNeighborhoods(q: string): Promise<{ items: { id: string; status: string }[] }>;
  setNeighborhood(id: string): Promise<unknown>;
  consentVersions(): Promise<Record<string, string>>;
  recordConsents(items: { purpose: string; version: string; granted: boolean }[]): Promise<unknown>;
  putIntentions(body: IntentionsV5Dto): Promise<unknown>;
  putPrivacy(body: { discreetMode: boolean }): Promise<unknown>;
  createPet(species: Species): Promise<unknown>;
  completeOnboarding(): Promise<unknown>;
  /** Rejoindre la team de la personne qui a invité (`POST /v1/teams/join`). */
  joinTeam?(inviteRef: string): Promise<unknown>;
}

export type SubmitStep =
  'profile' | 'neighborhood' | 'consents' | 'intentions' | 'privacy' | 'pet' | 'team' | 'complete';
export interface SubmitReport {
  ok: boolean;
  failed: { step: SubmitStep; error: unknown }[];
}

export async function submitOnboarding(
  d: OnboardingDraft,
  opts: { displayName: string; discreet: boolean },
  ports: SubmitPorts,
): Promise<SubmitReport> {
  const failed: SubmitReport['failed'] = [];
  const run = async (step: SubmitStep, fn: () => Promise<unknown>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch (error) {
      failed.push({ step, error });
      return false;
    }
  };
  const birthDate = parseBirthDate(d.birthDate) ?? undefined;
  await run('profile', () =>
    ports.updateProfile({
      displayName: opts.displayName.trim() || undefined,
      ...(birthDate ? { birthDate } : null),
      ...(d.gender ? { gender: d.gender } : null),
    }),
  );
  await run('neighborhood', async () => {
    let hood = d.city.neighborhoodId;
    if (!hood && d.city.query.trim()) {
      const found = await ports.searchNeighborhoods(d.city.query.trim());
      hood = (found.items.find((n) => n.status === 'LIVE') ?? found.items[0])?.id ?? null;
    }
    if (!hood) throw new Error('NEIGHBORHOOD_NOT_FOUND');
    await ports.setNeighborhood(hood);
  });
  const consentsOk = await run('consents', async () => {
    const versions = await ports.consentVersions();
    const items: { purpose: string; version: string; granted: boolean }[] = (
      ['TERMS', 'PRIVACY', 'AI_MODERATION'] as const
    )
      .filter((p) => versions[p])
      .map((p) => ({ purpose: p, version: versions[p]!, granted: true }));
    if (d.sensitiveConsent && versions.SENSITIVE_PREFERENCES)
      items.push({
        purpose: 'SENSITIVE_PREFERENCES',
        version: versions.SENSITIVE_PREFERENCES,
        granted: true,
      });
    if (items.length) await ports.recordConsents(items);
  });
  const intentions = intentionsOf(d);
  if (intentions) {
    // Sans consentement enregistré, on n'envoie jamais de genres recherchés (art. 9).
    const safe = consentsOk
      ? intentions
      : { ...intentions, lookingFor: 'FRIENDS' as const, romanceGenders: [] };
    await run('intentions', () => ports.putIntentions(safe));
  }
  await run('privacy', () => ports.putPrivacy({ discreetMode: opts.discreet }));
  if (d.species) await run('pet', () => ports.createPet(d.species!));
  if (d.inviteRef && ports.joinTeam) await run('team', () => ports.joinTeam!(d.inviteRef!));
  await run('complete', () => ports.completeOnboarding());
  return { ok: failed.length === 0, failed };
}
