import type { Profile } from '../ports';

/** Minimoa+ actif à l'instant `now`. */
export const hasPlus = (profile: Pick<Profile, 'plusUntil'> | null, now: Date): boolean =>
  profile?.plusUntil != null && new Date(profile.plusUntil) > now;
