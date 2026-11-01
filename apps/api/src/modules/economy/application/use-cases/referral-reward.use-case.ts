import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import { LedgerKeys } from '../../domain/index.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import { ECONOMY_TOPICS } from '../economy-events.js';

export interface ReferralActivatedPayload {
  claimId: string;
  referrerUserId: string;
  refereeUserId: string;
  referrerCoins: number;
  refereeCoins: number;
}

/**
 * Récompense de parrainage (P-5.9) : +N au parrain (REFERRAL_REFERRER) et +N au filleul
 * (REFERRAL_REFEREE), UNE seule fois par claim. Idempotence à deux niveaux : déduplication du
 * consommateur (socle) + clé ledger unique `referral:<claimId>:<side>` (contrainte SQL) — un
 * rejeu ou une double livraison ne crédite jamais deux fois. Montants fournis par l'événement
 * (lus du tuning par social au moment de l'activation), bornés ici par sécurité.
 */
export class GrantReferralRewardUseCase {
  constructor(private readonly ledger: LedgerRepository) {}

  async execute(scope: TxScope, p: ReferralActivatedPayload): Promise<{ credited: number }> {
    if (p.referrerUserId === p.refereeUserId) return { credited: 0 }; // auto-parrainage : jamais récompensé
    const sides = [
      { userId: p.referrerUserId, amount: p.referrerCoins, reason: 'REFERRAL_REFERRER' as const, side: 'referrer' as const },
      { userId: p.refereeUserId, amount: p.refereeCoins, reason: 'REFERRAL_REFEREE' as const, side: 'referee' as const },
    ]
      .filter((s) => Number.isSafeInteger(s.amount) && s.amount > 0 && s.amount <= 10_000)
      // Ordre global des verrous : wallets triés par userId.
      .sort((a, b) => (a.userId < b.userId ? -1 : 1));
    let credited = 0;
    for (const s of sides) {
      const key = LedgerKeys.referral(p.claimId, s.side);
      if (await this.ledger.findByIdempotencyKey(scope, key)) continue;
      const wallet = await this.ledger.lockWallet(scope, s.userId);
      await this.ledger.append(scope, wallet, { amount: s.amount, reason: s.reason, source: 'REFERRAL', idempotencyKey: key, causeType: 'referral_claim', causeId: p.claimId });
      credited++;
    }
    if (credited > 0) {
      await scope.outbox.emit({ topic: ECONOMY_TOPICS.REFERRAL_REWARDED, aggregateType: 'ReferralClaim', aggregateId: p.claimId, payload: { claimId: p.claimId, referrerUserId: p.referrerUserId, refereeUserId: p.refereeUserId } });
    }
    return { credited };
  }
}
