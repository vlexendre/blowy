import type { EntitlementKey } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import {
  BLOWY_PLUS_ENTITLEMENT,
  dateSlotsFor,
  effectiveEndsAt,
  effectiveKeys,
  isActiveState,
  planDerivedGrant,
  type BillingEnvironment,
  type DerivedSubscriptionState,
  type SubscriptionRecord,
} from '../domain/index.js';
import type { BillingProvider } from './ports/billing-provider.port.js';
import type { EntitlementRepository } from './ports/entitlement.repository.js';
import type { EconomyParamsProvider } from './ports/economy-config.port.js';
import { ECONOMY_TOPICS, type PlusCapacityReducedPayload } from './economy-events.js';

/**
 * Point UNIQUE d'écriture de l'état d'abonnement et des droits (utilisé par la réconciliation,
 * les webhooks, la démo locale et les jobs) : aucune duplication de règles.
 * Précondition : l'appelant a verrouillé l'utilisateur (scope.lock.users) dans la portée.
 */
export class EntitlementStateService {
  constructor(
    private readonly repo: EntitlementRepository,
    private readonly provider: BillingProvider,
    private readonly params: EconomyParamsProvider,
  ) {}

  get accepted(): ReadonlySet<BillingEnvironment> {
    return this.provider.acceptedEnvironments;
  }

  async keysOf(userId: string, at: Date, scope?: TxScope): Promise<Set<EntitlementKey>> {
    return effectiveKeys(await this.repo.listLiveGrants(userId, at, scope), at, this.accepted);
  }

  /**
   * Applique un état d'abonnement (issu du snapshot fournisseur ou d'un indice webhook).
   * `marker` : `reconciledAt` (autorité) ou `eventAt` (indice ordonné).
   */
  async applyState(
    scope: TxScope,
    userId: string,
    state: DerivedSubscriptionState,
    marker: { reconciledAt: Date } | { eventAt: Date },
  ): Promise<SubscriptionRecord> {
    const sub = await this.repo.upsertSubscription(scope, {
      userId,
      provider: this.provider.kind,
      environment: state.environment,
      entitlementId: BLOWY_PLUS_ENTITLEMENT,
      state: state.state,
      productId: state.productId,
      store: state.store,
      periodType: state.periodType,
      currentPeriodEndsAt: state.currentPeriodEndsAt,
      gracePeriodEndsAt: state.gracePeriodEndsAt,
      ...('reconciledAt' in marker ? { lastReconciledAt: marker.reconciledAt } : { lastProviderEventAt: marker.eventAt }),
    });
    if (!this.accepted.has(state.environment)) {
      // Environnement non accepté (ex. sandbox en production) : enregistré, jamais de droit.
      await this.repo.revokeOwnGrants(scope, sub.id, `ENV_NOT_ACCEPTED:${state.environment}`);
      return sub;
    }
    if (isActiveState(state.state)) {
      await this.repo.upsertOwnGrant(scope, sub, effectiveEndsAt(state), this.provider.kind === 'LOCAL_DEMO' ? 'LOCAL_DEMO' : 'STORE_SUBSCRIPTION');
    } else {
      await this.repo.revokeOwnGrants(scope, sub.id, state.state);
    }
    return sub;
  }

  /**
   * Après tout changement des droits propres du titulaire : prolonge, crée ou révoque les droits
   * dérivés du partenaire emménagé, puis émet la réduction de capacité si nécessaire.
   * `movedInPartner` est lu AVANT la transaction (port relations, pas d'appel réseau sous verrou).
   */
  async syncDerivedAndCapacity(
    scope: TxScope,
    userId: string,
    keysBefore: ReadonlySet<EntitlementKey>,
    movedInPartner: { partnerUserId: string; relationshipId: string } | null,
  ): Promise<void> {
    const now = scope.now;
    const holderGrants = await this.repo.listLiveGrants(userId, now, scope);
    const plan = movedInPartner
      ? planDerivedGrant({ holderUserId: userId, partnerUserId: movedInPartner.partnerUserId, relationshipId: movedInPartner.relationshipId, holderGrants, at: now, accepted: this.accepted })
      : null;
    const hasOwnSource = holderGrants.some((g) => g.beneficiaryUserId === userId && g.source !== 'DERIVED_PARTNER' && g.source !== 'STAFF_GRANT' && this.accepted.has(g.environment));
    if (hasOwnSource) {
      const endsAt = plan?.endsAt ?? null;
      await this.repo.extendDerivedFrom(scope, userId, endsAt);
      if (plan) {
        const existing = (await this.repo.listLiveGrants(plan.beneficiaryUserId, now, scope)).some(
          (g) => g.source === 'DERIVED_PARTNER' && g.derivedFromUserId === userId && g.relationshipId === plan.relationshipId,
        );
        if (!existing) {
          const partnerBefore = await this.keysOf(plan.beneficiaryUserId, now, scope);
          await this.repo.createDerivedGrant(scope, plan);
          await this.emitChanged(scope, plan.beneficiaryUserId, partnerBefore);
        }
      }
    } else {
      const revoked = await this.repo.revokeDerivedFrom(scope, userId, 'HOLDER_LOST_ENTITLEMENT');
      for (const g of revoked) await this.emitCapacityIfReduced(scope, g.beneficiaryUserId, null);
    }
    await this.emitChanged(scope, userId, keysBefore);
  }

  /** Émet ENTITLEMENTS_CHANGED et, si la capacité a baissé, PLUS_CAPACITY_REDUCED. */
  async emitChanged(scope: TxScope, userId: string, before: ReadonlySet<EntitlementKey>): Promise<void> {
    const after = await this.keysOf(userId, scope.now, scope);
    const same = before.size === after.size && [...before].every((k) => after.has(k));
    if (same) return;
    await scope.outbox.emit({
      topic: ECONOMY_TOPICS.ENTITLEMENTS_CHANGED,
      aggregateType: 'User',
      aggregateId: userId,
      payload: { userId, keys: [...after].sort(), occurredAt: scope.now.toISOString() },
    });
    await this.emitCapacityIfReduced(scope, userId, before, after);
  }

  private async emitCapacityIfReduced(scope: TxScope, userId: string, before: ReadonlySet<EntitlementKey> | null, afterKeys?: ReadonlySet<EntitlementKey>): Promise<void> {
    const p = this.params.current();
    const after = afterKeys ?? (await this.keysOf(userId, scope.now, scope));
    const beforeSlots = before ? dateSlotsFor(before, p) : p.plusDateSlots;
    const afterSlots = dateSlotsFor(after, p);
    if (afterSlots >= beforeSlots) return;
    const payload: PlusCapacityReducedPayload = { userId, newDateSlots: afterSlots, occurredAt: scope.now.toISOString() };
    await scope.outbox.emit({ topic: ECONOMY_TOPICS.PLUS_CAPACITY_REDUCED, aggregateType: 'User', aggregateId: userId, payload });
  }
}
