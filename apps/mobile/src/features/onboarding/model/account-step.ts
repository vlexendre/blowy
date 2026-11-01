/**
 * Orchestration pure de l'étape compte : après la session, on enregistre profil (date de
 * naissance, genre), consentements versionnés, puis on crée le pet principal depuis le brouillon.
 * Le contrôle 18+ fait foi côté serveur (AGE_RESTRICTED) ; le client ne fait qu'un pré-contrôle.
 */
import type { ConsentState, CreatePrimaryPetRequest, RecordConsentsRequest } from '@blowy/api-contract';
import { REQUIRED_SOCIAL_PURPOSES } from '@blowy/api-contract';
import type { OnboardingDraft } from './flow';
import { fallbackSpecies, isPremium } from './flow';

export function consentsRequest(state: ConsentState | undefined, granted: { terms: boolean; privacy: boolean; moderation: boolean }): RecordConsentsRequest | null {
  if (!state) return null;
  const map = { TERMS: granted.terms, PRIVACY: granted.privacy, AI_MODERATION: granted.moderation } as const;
  const items = REQUIRED_SOCIAL_PURPOSES.map((purpose) => ({ purpose, version: state.currentVersions[purpose] ?? '1', granted: map[purpose] }));
  return { items };
}

/**
 * Corps de création du pet. Espèce premium : adoptée seulement si le droit est déjà valide ;
 * sinon on crée l'espèce gratuite de repli et la vision est conservée (P-5.11).
 */
export function petCreationRequest(d: OnboardingDraft, hasPremiumSpeciesRight: boolean): CreatePrimaryPetRequest | null {
  if (!d.school || !d.sunday || !d.limit || d.passions.length === 0) return null;
  const species = isPremium(d.species) && !hasPremiumSpeciesRight ? fallbackSpecies(d.species) : d.species;
  return {
    name: d.petName.trim() || 'Nino',
    species,
    vision: { axes: d.axes, school: d.school, sunday: d.sunday, passions: d.passions, limit: d.limit },
  };
}
