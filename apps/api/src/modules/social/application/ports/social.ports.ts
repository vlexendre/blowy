import type { Species } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface PublicTarget {
  userId: string;
  slug: string;
  displayName: string;
  enabled: boolean;
  status: string;
  pet: { name: string; species: Species; stage: 'BABY' | 'YOUNG' | 'ADULT' } | null;
}

export interface AnonymousRepository {
  findTargetBySlug(slug: string): Promise<PublicTarget | null>;
  /** Consomme un nonce de formulaire (anti-rejeu) ; false si déjà consommé. */
  consumeNonce(scope: TxScope, targetUserId: string, nonce: string): Promise<boolean>;
  insert(scope: TxScope, r: { id: string; targetUserId: string; words: string[]; visitorTokenHash: string }): Promise<'CREATED' | 'DUPLICATE'>;
  countForTargetSince(scope: TxScope, targetUserId: string, since: Date): Promise<number>;
  /** Recalcule l'agrégat de réputation depuis les réponses visibles (non farmable). */
  recomputeReputation(scope: TxScope, targetUserId: string, scoreMilli: (words: number) => number): Promise<void>;
  listOwn(userId: string, cursor: string | undefined, limit: number): Promise<{ items: { id: string; words: string[]; createdAt: Date; hiddenAt: Date | null; reportedAt: Date | null }[]; nextCursor: string | null }>;
  ownPage(userId: string): Promise<{ slug: string | null; enabled: boolean }>;
  setPageEnabled(scope: TxScope, userId: string, enabled: boolean): Promise<{ slug: string | null }>;
  /** Le propriétaire masque (retire) ou signale UNE de SES réponses. */
  hideOwn(scope: TxScope, userId: string, responseId: string): Promise<boolean>;
  reportOwn(scope: TxScope, userId: string, responseId: string): Promise<boolean>;
  /** Masquage staff (modération d'une réponse abusive). */
  hideAny(scope: TxScope, responseId: string): Promise<{ targetUserId: string } | null>;
}
export const ANONYMOUS_REPOSITORY = Symbol('AnonymousRepository');

/** Quotas/throttling (Strategy Redis/mémoire). */
export interface QuotaCounter {
  hit(key: string, windowSec: number): Promise<number>;
}
export const SOCIAL_QUOTA = Symbol('SocialQuota');

export interface ReferralRepository {
  /** Lien actif du parrain (créé s'il n'existe pas ou s'il a expiré) — code unique. */
  activeLink(userId: string, now: Date): Promise<{ id: string; code: string; expiresAt: Date } | null>;
  createLink(scope: TxScope, l: { id: string; userId: string; code: string; expiresAt: Date }): Promise<boolean>;
  findLinkByCode(scope: TxScope | null, code: string): Promise<{ id: string; userId: string; code: string; expiresAt: Date; revokedAt: Date | null; createdAt: Date } | null>;
  inviterPreview(userId: string): Promise<{ displayName: string; petName: string | null; species: Species | null } | null>;
  userOnboardedAt(scope: TxScope, userId: string): Promise<Date | null>;
  claimOf(scope: TxScope | null, refereeUserId: string): Promise<{ id: string; status: 'PENDING_ACTIVATION' | 'REWARDED' | 'REJECTED'; referrerUserId: string; claimedAt: Date; rewardedAt: Date | null } | null>;
  createClaim(scope: TxScope, c: { id: string; linkId: string; referrerUserId: string; refereeUserId: string }): Promise<'CREATED' | 'EXISTS'>;
  pendingClaims(limit: number): Promise<string[]>;
  activationFacts(scope: TxScope, userId: string, now: Date): Promise<{ accountActive: boolean; adult: boolean; hasPrimaryPet: boolean; verifications: { provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO'; status: string }[]; hasFirstAction: boolean }>;
  /** Marque REWARDED (garde : PENDING_ACTIVATION) ; false si déjà traité. */
  markRewarded(scope: TxScope, claimId: string, at: Date): Promise<boolean>;
  markRejected(scope: TxScope, claimId: string): Promise<boolean>;
  referrerActive(scope: TxScope, userId: string): Promise<boolean>;
}
export const REFERRAL_REPOSITORY = Symbol('ReferralRepository');

export interface SocialConfig {
  publicLinkSecret: string;
  publicWebOrigin: string;
  inviteTtlDays: number;
  /** Vérification LOCAL_DEMO admise pour l'activation (fixture explicite, jamais en production). */
  allowLocalDemoVerification: boolean;
}
export const SOCIAL_CONFIG = Symbol('SocialConfig');
