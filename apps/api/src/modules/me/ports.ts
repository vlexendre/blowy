import type { Day } from '@blowy/domain';

export interface Profile {
  id: string;
  displayName: string;
  birthdate: Day;
  city: string | null;
  avatarPath: string | null;
  inviteCode: string;
  wordsCode: string;
  plusUntil: string | null;
  welcomeSentAt: string | null;
  createdAt: string;
}

export type ProfilePatch = Partial<Pick<Profile, 'displayName' | 'city' | 'avatarPath' | 'welcomeSentAt'>>;

export interface ProfilesRepository {
  findById(id: string): Promise<Profile | null>;
  findByIds(ids: readonly string[]): Promise<Profile[]>;
  findByInviteCode(code: string): Promise<Profile | null>;
  findByWordsCode(code: string): Promise<Profile | null>;
  /** Vrai si le code est déjà pris (invitation ou « 3 mots »). */
  codeTaken(code: string): Promise<boolean>;
  create(profile: Profile): Promise<void>;
  update(id: string, patch: ProfilePatch): Promise<Profile>;
  /** Profils les plus récents, hors `excludeId` : vivier des rencontres. */
  listRecent(limit: number, excludeId: string): Promise<Profile[]>;
}

/** Appelé après une création de pet réussie (monde de démo en local ; rien en production). */
export interface OnboardedHook {
  onOnboarded(userId: string): Promise<void>;
}
