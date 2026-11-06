import { ENTITLEMENT_KEYS_V5, type EntitlementKey, type EntitlementKeyV5 } from '@blowy/domain';
import type { EntitlementsReader } from '../../../../shared/application/ports/entitlements-reader.port.js';
import type { Clock } from '../../../../shared/application/clock.js';
import { dateSlotsFor, effectiveEndsAt, keysOfGrant, liveAcceptedGrants, type CatalogItem, type LedgerEntry } from '../../domain/index.js';
import type { BillingProvider } from '../ports/billing-provider.port.js';
import type { CatalogRepository, InventoryRecord } from '../ports/catalog.repository.js';
import type { EntitlementRepository } from '../ports/entitlement.repository.js';
import type { LedgerRepository } from '../ports/ledger.repository.js';
import type { EconomyParamsProvider } from '../ports/economy-config.port.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';

/** GET /v1/catalog : objets actifs (prix en pièces du catalogue serveur). */
export class GetCatalogQuery {
  constructor(private readonly catalog: CatalogRepository) {}
  async execute(): Promise<CatalogItem[]> {
    return (await this.catalog.listActive()).filter((i) => i.stockLimit === null || i.soldCount < i.stockLimit);
  }
}

/** GET /v1/wallet : solde (projection) + historique paginé + inventaire + gels disponibles. */
export class GetWalletQuery {
  constructor(
    private readonly ledger: LedgerRepository,
    private readonly catalog: CatalogRepository,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string, cursor: string | undefined, limit: number): Promise<{ balance: number; entries: { items: LedgerEntry[]; nextCursor: string | null }; inventory: InventoryRecord[]; availableFreezes: number }> {
    const [balance, entries, inventory, availableFreezes] = await Promise.all([
      this.ledger.balanceOf(userId),
      this.ledger.listEntries(userId, cursor, limit),
      cursor ? Promise.resolve([] as InventoryRecord[]) : this.catalog.listInventory(userId),
      this.catalog.countAvailableFreezes(null, userId, this.clock.now()),
    ]);
    return { balance, entries, inventory, availableFreezes };
  }
}

export interface SubscriptionView {
  mode: BillingProvider['mode'];
  state: string;
  environment: string | null;
  productId: string | null;
  store: string | null;
  currentPeriodEndsAt: string | null;
  willRenew: boolean;
  lastReconciledAt: string | null;
  dateSlots: number;
  entitlements: { key: EntitlementKey; source: string; endsAt: string | null; derivedFromUserId: string | null }[];
  /** V5 (§6.3) : droits de Blowy+ dérivés de l'entitlement `blowy_plus` (titulaire, abonnement actif). */
  v5Entitlements: { key: EntitlementKeyV5; expiresAt: string | null }[];
}

/**
 * GET /v1/subscriptions/me : état + droits + source + échéance + mode.
 * `derivedFromUserId` n'est exposé qu'au bénéficiaire (son propre partenaire emménagé).
 */
export class GetMySubscriptionQuery {
  constructor(
    private readonly repo: EntitlementRepository,
    private readonly state: EntitlementStateService,
    private readonly provider: BillingProvider,
    private readonly params: EconomyParamsProvider,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<SubscriptionView> {
    const now = this.clock.now();
    const [subs, grants] = await Promise.all([this.repo.listSubscriptions(userId), this.repo.listLiveGrants(userId, now)]);
    // V5.4 (C.10) : Blowy+ via Stripe Billing compte comme l'abonnement du fournisseur configuré.
    const accepted = subs.filter((s) => this.state.accepted.has(s.environment) && (s.provider === this.provider.kind || s.provider === 'STRIPE'));
    const main = accepted.sort((a, b) => (b.currentPeriodEndsAt?.getTime() ?? 0) - (a.currentPeriodEndsAt?.getTime() ?? 0))[0] ?? null;
    const keys = await this.state.keysOf(userId, now);
    const entitlements: SubscriptionView['entitlements'] = liveAcceptedGrants(grants, now, this.state.accepted).flatMap((g) =>
      keysOfGrant(g).map((key) => ({ key, source: g.source, endsAt: g.endsAt?.toISOString() ?? null, derivedFromUserId: g.derivedFromUserId })),
    );
    return {
      mode: this.provider.mode,
      state: main?.state ?? 'NONE',
      environment: main?.environment ?? null,
      productId: main?.productId ?? null,
      store: main?.store ?? null,
      currentPeriodEndsAt: main ? (effectiveEndsAt(main)?.toISOString() ?? null) : null,
      willRenew: main?.state === 'ACTIVE' || main?.state === 'TRIAL' || main?.state === 'GRACE_PERIOD',
      lastReconciledAt: main?.lastReconciledAt?.toISOString() ?? null,
      dateSlots: dateSlotsFor(keys, this.params.current()),
      entitlements,
      v5Entitlements: keys.has('PLUS_MONTHLY_BENEFITS') ? ENTITLEMENT_KEYS_V5.map((key) => ({ key, expiresAt: main ? (effectiveEndsAt(main)?.toISOString() ?? null) : null })) : [],
    };
  }
}

/** Implémentation réelle du port partagé EntitlementsReader (consommé par pets, relations, matching). */
export class EconomyEntitlementsReader implements EntitlementsReader {
  constructor(
    private readonly state: EntitlementStateService,
    private readonly params: EconomyParamsProvider,
  ) {}
  activeKeys(userId: string, at: Date): Promise<ReadonlySet<EntitlementKey>> {
    return this.state.keysOf(userId, at);
  }
  async dateSlots(userId: string, at: Date): Promise<number> {
    return dateSlotsFor(await this.state.keysOf(userId, at), this.params.current());
  }
}
