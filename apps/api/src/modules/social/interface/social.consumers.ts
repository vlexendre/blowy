/**
 * Observer : réévalue l'activation d'un parrainage après les événements qui peuvent la compléter
 * (pet créé, soin/jeu, vérification, onboarding). L'activation elle-même est transactionnelle et
 * idempotente (garde de statut) ; la tentative est faite HORS de la transaction du consommateur.
 * Filet : job périodique `social.referral_activation`.
 */
import type { OutboxEffect, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { ReferralUseCases } from '../application/use-cases/referral.use-cases.js';

const userOf = (e: OutboxEnvelope): string[] => {
  const p = e.payload;
  if (e.aggregateType === 'User') return [e.aggregateId];
  if (typeof p['ownerId'] === 'string') return [p['ownerId']];
  if (Array.isArray(p['ownerIds'])) return p['ownerIds'].filter((x): x is string => typeof x === 'string');
  // V5 : `outing.attendance_recorded {userId, attended}` — la 1ʳᵉ sortie vécue active le parrainage.
  if (e.topic === 'outing.attendance_recorded' && p['attended'] === true && typeof p['userId'] === 'string') return [p['userId']];
  return [];
};

export class ReferralActivationEffect implements OutboxEffect {
  readonly name = 'social.referral_activation';
  readonly topics = ['pet.created', 'pet.updated', 'user.verification_changed', 'user.onboarded', 'outing.attendance_recorded'];
  constructor(private readonly referrals: ReferralUseCases) {}
  async run(event: OutboxEnvelope): Promise<void> {
    for (const u of userOf(event)) await this.referrals.tryActivate(u);
  }
}

export interface SocialJob {
  name: string;
  everyMs: number;
  run(): Promise<unknown>;
}
export const socialJobs = (referrals: ReferralUseCases): SocialJob[] => [{ name: 'social.referral_activation', everyMs: 15 * 60_000, run: () => referrals.activatePending() }];
