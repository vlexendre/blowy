/**
 * Topics outbox du module économie (Observer interdomaine). Les consommateurs sont idempotents
 * (ConsumerDeduplication du socle). Economy n'écrit JAMAIS les tables des autres modules.
 */
export const ECONOMY_TOPICS = {
  /** Consommé par relationships : relations au-delà de la capacité → LEGACY (P-5.13). */
  PLUS_CAPACITY_REDUCED: 'economy.plus_capacity_reduced',
  /** Informatif (notifications, admin) : droits changés. */
  ENTITLEMENTS_CHANGED: 'economy.entitlements_changed',
  /** Consommé par matching : boost actif pour le prochain lot éligible. */
  BOOST_ACTIVATED: 'economy.visibility_boost_activated',
  /** Informatif (social/notifications) : récompense de parrainage créditée. */
  REFERRAL_REWARDED: 'economy.referral_rewarded',
} as const;

/** Topic émis par social (agent F) à l'activation admissible d'un parrainage, consommé ici. */
export const SOCIAL_TOPICS = {
  REFERRAL_ACTIVATED: 'referral.activated',
} as const;

/** Topics émis par relationships (agent C) et consommés ici. */
export const RELATIONSHIP_TOPICS = {
  MOVED_IN: 'relationship.moved_in',
  ENDED: 'relationship.ended',
} as const;

export interface PlusCapacityReducedPayload {
  userId: string;
  newDateSlots: number;
  occurredAt: string;
  [k: string]: unknown;
}
