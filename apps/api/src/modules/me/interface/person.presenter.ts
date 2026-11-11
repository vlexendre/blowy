import type { Person, PublicPet } from '@blowy/contract';
import type { FaceVisibility } from '@blowy/domain';
import type { Profile } from '../ports';

/** Une personne vue par une autre. L'URL de l'avatar n'est fournie que si le visage n'est pas caché. */
export const toPerson = (profile: Profile, pet: PublicPet, face: FaceVisibility, avatarUrl: string | null): Person => ({
  id: profile.id,
  displayName: profile.displayName,
  city: profile.city,
  pet,
  face,
  avatarUrl: face === 'hidden' ? null : avatarUrl,
});
