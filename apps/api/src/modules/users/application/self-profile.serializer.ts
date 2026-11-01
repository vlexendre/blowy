/** Sérialiseur explicite SelfProfile (jamais un modèle Prisma brut). */
import type { SelfProfile } from '@blowy/api-contract';
import { ageOn, localCivilDate } from '../domain/age.js';
import type { UserAggregate } from './ports/user-profile.repository.js';

export function toSelfProfile(u: UserAggregate, now: Date, verificationMode: 'LIVE' | 'LOCAL_DEMO' | 'NOT_CONFIGURED'): SelfProfile {
  const birth = u.birthDate ? { y: u.birthDate.getUTCFullYear(), m: u.birthDate.getUTCMonth() + 1, d: u.birthDate.getUTCDate() } : null;
  return {
    userId: u.id,
    displayName: u.displayName,
    gender: u.gender,
    birthDate: u.birthDate ? u.birthDate.toISOString().slice(0, 10) : null,
    age: birth ? ageOn(birth, localCivilDate(now, u.timezone)) : null,
    timezone: u.timezone,
    zoneCode: u.zoneCode,
    reliability: u.reliability,
    onboarded: u.onboardedAt !== null,
    primaryPetId: u.primaryPetId,
    preferences: u.preferences,
    privacy: u.privacy,
    verification: {
      status: u.verification.status,
      kind: u.verification.kind,
      provenance: u.verification.provenance,
      mode: u.verification.provenance === 'LOCAL_DEMO' ? 'LOCAL_DEMO' : u.verification.provenance ? 'LIVE' : verificationMode,
      expiresAt: u.verification.expiresAt?.toISOString() ?? null,
    },
    activePause: u.activePause
      ? { id: u.activePause.id, relationshipId: u.activePause.contextId, startsAt: u.activePause.startsAt.toISOString(), endsAt: u.activePause.endsAt.toISOString() }
      : null,
    isFictional: u.isFictional,
  };
}
