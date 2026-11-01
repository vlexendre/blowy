import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { ConsentFact } from '../../domain/consents.js';
import type { PauseSpan } from '../../domain/pause.js';

export interface UserAggregate {
  id: string;
  status: string;
  birthDate: Date | null;
  timezone: string;
  zoneCode: string | null;
  reliability: number;
  onboardedAt: Date | null;
  isFictional: boolean;
  displayName: string | null;
  gender: 'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED';
  primaryPetId: string | null;
  preferences: {
    ageMin: number;
    ageMax: number;
    maxDistanceKm: number;
    seekingGenders: ('WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED')[];
    intention: 'FRIENDS_ONE' | 'FRIENDS_GROUP' | 'OPEN_TO_MORE' | 'LET_IT_HAPPEN';
    widenConsented: boolean;
  } | null;
  privacy: { photoPreference: 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER'; ageDisplay: 'EXACT' | 'RANGE'; mapVisible: boolean };
  verification: {
    status: 'NOT_STARTED' | 'PENDING' | 'NEEDS_RETRY' | 'HUMAN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    kind: 'SELFIE_QUALITY' | 'SELFIE_HUMAN_REVIEW' | 'LIVENESS' | 'IDENTITY_AGE' | null;
    provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO' | null;
    expiresAt: Date | null;
    sessionUrl?: string | null;
  };
  activePause: { id: string; contextId: string | null; startsAt: Date; endsAt: Date } | null;
}

export interface ProfilePatch {
  displayName?: string | undefined;
  gender?: UserAggregate['gender'] | undefined;
  birthDate?: Date | undefined;
  timezone?: string | undefined;
  zoneCode?: string | undefined;
}

export interface UserProfileRepository {
  load(userId: string, at: Date): Promise<UserAggregate | null>;
  zoneExists(code: string): Promise<boolean>;
  patchProfile(scope: TxScope, userId: string, patch: ProfilePatch): Promise<void>;
  savePreferences(scope: TxScope, userId: string, prefs: NonNullable<UserAggregate['preferences']>): Promise<void>;
  savePrivacy(scope: TxScope, userId: string, privacy: UserAggregate['privacy']): Promise<void>;
  appendConsents(scope: TxScope, userId: string, items: { purpose: string; version: string; granted: boolean }[]): Promise<void>;
  listConsents(userId: string): Promise<ConsentFact[]>;
  pausesInPeriod(scope: TxScope, userId: string, periodKey: string): Promise<(PauseSpan & { id: string; contextId: string | null })[]>;
  createPause(scope: TxScope, p: { id: string; userId: string; contextId: string | null; startsAt: Date; endsAt: Date; periodKey: string }): Promise<void>;
  endPause(scope: TxScope, userId: string, pauseId: string): Promise<boolean>;
  markOnboarded(scope: TxScope, userId: string): Promise<void>;
  createVerification(scope: TxScope, v: { id: string; userId: string; kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE'; provenance: 'PROVIDER' | 'LOCAL_DEMO'; status: 'PENDING' | 'VERIFIED'; providerRef: string; expiresAt: Date | null }): Promise<void>;
  isParticipant(userId: string, contextId: string): Promise<boolean>;
}
export const USER_PROFILE_REPOSITORY = Symbol('UserProfileRepository');
