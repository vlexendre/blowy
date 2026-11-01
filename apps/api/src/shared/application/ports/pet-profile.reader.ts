import type { PublicPetProfile } from '@blowy/api-contract';
/** Lecture de profils publics de pets (fournie par le module pets). */
export interface PetProfileReader {
  publicProfiles(petIds: string[], at: Date): Promise<Map<string, PublicPetProfile>>;
}
export const PET_PROFILE_READER = Symbol('PetProfileReader');
