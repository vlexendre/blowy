import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import type { Clock } from '../../../../shared/application/clock.js';
import type { RelationshipReader } from '../../../../shared/application/ports/relationship-reader.port.js';
import { unauthenticatedWebhook } from '../../domain/index.js';
import type { BillingProvider, NormalizedWebhookEvent, ReconcileScheduler, WebhookAuthenticator } from '../ports/billing-provider.port.js';
import type { BillingRecordRepository } from '../ports/billing-record.repository.js';
import type { EntitlementRepository } from '../ports/entitlement.repository.js';
import type { UserDirectory } from '../ports/economy-config.port.js';
import type { EntitlementStateService } from '../entitlement-state.service.js';
import type { StoreCreditService } from '../store-credit.service.js';
import { isPlusSubscriptionEvent, type WebhookStrategyRegistry } from '../webhook/webhook-strategies.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ReceiveWebhookResult {
  status: 'ACCEPTED' | 'DUPLICATE';
  eventId: string;
}

/**
 * Réception d'un webhook : authentification (header Authorization, temps constant), journal
 * ProviderWebhookEvent UNIQUE (provider, id), puis traitement. Le traitement est rapide
 * (base locale) ; la réconciliation réseau est planifiée APRÈS commit (ReconcileScheduler)
 * — RevenueCat recommande de répondre vite et d'appeler GET /subscribers ensuite.
 * Un doublon (retry RevenueCat) répond 200 sans aucun effet.
 */
export class ReceiveWebhookUseCase {
  constructor(
    private readonly auth: WebhookAuthenticator,
    private readonly parse: (body: unknown) => NormalizedWebhookEvent,
    private readonly records: BillingRecordRepository,
    private readonly processor: ProcessWebhookEventUseCase,
    private readonly clock: Clock,
    private readonly providerName: string,
  ) {}

  async execute(authorization: string | undefined, body: unknown): Promise<ReceiveWebhookResult> {
    if (!this.auth.isAuthentic(authorization)) throw unauthenticatedWebhook();
    const event = this.parse(body);
    const appUserId = event.appUserIds.find((id) => UUID_RE.test(id)) ?? null;
    const { record, duplicate } = await this.records.recordWebhook(event, this.providerName, appUserId, body, this.clock.now());
    if (duplicate && (record.status === 'PROCESSED' || record.status === 'IGNORED')) return { status: 'DUPLICATE', eventId: record.id };
    await this.processor.execute(record.id);
    return { status: duplicate ? 'DUPLICATE' : 'ACCEPTED', eventId: record.id };
  }
}

/**
 * Traitement idempotent d'un événement enregistré (appelé à la réception et par le job de
 * reprise). Verrou de l'événement + verrou User ; stratégie par type ; demande de réconciliation.
 */
export class ProcessWebhookEventUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly records: BillingRecordRepository,
    private readonly entitlements: EntitlementRepository,
    private readonly state: EntitlementStateService,
    private readonly credits: StoreCreditService,
    private readonly registry: WebhookStrategyRegistry,
    private readonly provider: BillingProvider,
    private readonly relationships: RelationshipReader,
    private readonly users: UserDirectory,
    private readonly parse: (body: unknown) => NormalizedWebhookEvent,
    private readonly scheduler: ReconcileScheduler,
  ) {}

  async execute(webhookEventId: string): Promise<'PROCESSED' | 'IGNORED' | 'SKIPPED'> {
    const out = await this.process(webhookEventId);
    if (out.userId) this.scheduler.schedule(out.userId, `webhook:${out.type}`);
    return out.outcome;
  }

  private async process(webhookEventId: string): Promise<{ outcome: 'PROCESSED' | 'IGNORED' | 'SKIPPED'; userId: string | null; type: string }> {
    const loaded = await this.records.getWebhookPayload(webhookEventId);
    if (!loaded) return { outcome: 'SKIPPED', userId: null, type: '' };
    const { record } = loaded;
    const userId = record.appUserId && (await this.users.exists(record.appUserId)) ? record.appUserId : null;
    const partner = userId ? await this.relationships.findMovedInPartner(userId) : null;
    const products = await this.credits.productsById();
    try {
      return await this.uow.run(async (scope) => {
        if (userId) await scope.lock.users([userId]);
        const claimed = await this.records.claimWebhook(scope, webhookEventId);
        if (!claimed) return { outcome: 'SKIPPED' as const, userId: null, type: record.eventType };
        if (!userId) {
          // appUserID inconnu (anonyme RevenueCat, compte supprimé) : aucun effet, tracé.
          await this.records.completeWebhook(scope, webhookEventId, 'IGNORED', scope.now);
          return { outcome: 'IGNORED' as const, userId: null, type: record.eventType };
        }
        const event = this.parse(loaded.payload);
        const product = products.get(event.productId ?? '');
        const subs = await this.entitlements.lockSubscriptions(scope, userId);
        const subscription = subs.find((s) => s.provider === this.provider.kind && s.environment === event.environment) ?? null;
        const before = await this.state.keysOf(userId, scope.now, scope);
        const outcome = await this.registry.resolve(event.type).handle({
          scope,
          userId,
          event,
          provider: this.provider.kind,
          product,
          isPlusSubscription: isPlusSubscriptionEvent(event, product),
          subscription,
          state: this.state,
          credits: this.credits,
        });
        await this.state.syncDerivedAndCapacity(scope, userId, before, partner);
        await this.records.completeWebhook(scope, webhookEventId, outcome, scope.now);
        // Réconciliation avec l'autorité fournisseur planifiée après commit (voir execute).
        return { outcome, userId, type: event.type };
      });
    } catch (err) {
      await this.records.failWebhook(webhookEventId, err instanceof Error ? err.message.slice(0, 500) : 'erreur');
      throw err;
    }
  }
}
