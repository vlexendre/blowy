import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, Req } from '@nestjs/common';
import {
  CatalogItemIdParamSchema,
  CatalogPurchaseResponseSchema,
  CatalogResponseSchema,
  LocalDemoPurchaseRequestSchema,
  PurchasesSyncResponseSchema,
  StoreProductsResponseSchema,
  SubscriptionMeResponseSchema,
  UseStreakFreezeResponseSchema,
  WalletQuerySchema,
  WalletResponseSchema,
  WebhookAckSchema,
  AllowancesViewSchema,
  OutingCreditsViewSchema,
  PlusCheckoutResponseSchema,
  PlusCancelResponseSchema,
  ProductsResponseV5Schema,
  StripeWebhookAckSchema,
  STRIPE_SIGNATURE_HEADER,
  type LocalDemoPurchaseRequest,
  type PageQuery,
} from '@blowy/api-contract';
import { Errors } from '../../../../shared/domain/errors.js';
import { Public } from '../../../../shared/interface/auth.guard.js';
import { CommandId, CurrentUser } from '../../../../shared/interface/decorators.js';
import type { AuthenticatedUser, BlowyRequest } from '../../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../../shared/interface/zod.pipe.js';
import { PurchaseCatalogItemUseCase } from '../../application/use-cases/purchase-catalog-item.use-case.js';
import { UseStreakFreezeUseCase } from '../../application/use-cases/use-streak-freeze.use-case.js';
import { GetCatalogQuery, GetMySubscriptionQuery, GetWalletQuery } from '../../application/use-cases/queries.js';
import { SyncPurchasesUseCase } from '../../application/use-cases/sync-purchases.use-case.js';
import { ReceiveWebhookUseCase } from '../../application/use-cases/process-webhook.use-case.js';
import { LocalDemoPurchaseUseCase } from '../../application/use-cases/local-demo-purchase.use-case.js';
import { BILLING_PROVIDER, type BillingProvider } from '../../application/ports/billing-provider.port.js';
import { BILLING_RECORD_REPOSITORY, type BillingRecordRepository } from '../../application/ports/billing-record.repository.js';
import { toCatalogDto, toInventoryDto, toLedgerDto } from './economy.mappers.js';
import type { EconomyGraph } from '../../economy.composition.js';

/** Jeton du graphe (défini ici pour éviter un import circulaire module ↔ contrôleur). */
export const ECONOMY_GRAPH_TOKEN = Symbol.for('blowy.economy.graph');

@Controller('v1')
export class EconomyController {
  constructor(
    @Inject(GetCatalogQuery) private readonly catalog: GetCatalogQuery,
    @Inject(GetWalletQuery) private readonly wallet: GetWalletQuery,
    @Inject(PurchaseCatalogItemUseCase) private readonly purchase: PurchaseCatalogItemUseCase,
    @Inject(UseStreakFreezeUseCase) private readonly freeze: UseStreakFreezeUseCase,
    @Inject(GetMySubscriptionQuery) private readonly subscription: GetMySubscriptionQuery,
    @Inject(SyncPurchasesUseCase) private readonly sync: SyncPurchasesUseCase,
    @Inject(LocalDemoPurchaseUseCase) private readonly localDemo: LocalDemoPurchaseUseCase,
    @Inject(BILLING_PROVIDER) private readonly provider: BillingProvider,
    @Inject(BILLING_RECORD_REPOSITORY) private readonly records: BillingRecordRepository,
    @Inject(ECONOMY_GRAPH_TOKEN) private readonly graph: EconomyGraph,
  ) {}

  @Get('catalog')
  async getCatalog() {
    return CatalogResponseSchema.parse({ items: (await this.catalog.execute()).map(toCatalogDto) });
  }

  @Get('wallet')
  async getWallet(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(WalletQuerySchema)) q: PageQuery) {
    const w = await this.wallet.execute(u.userId, q.cursor, q.limit);
    return WalletResponseSchema.parse({
      balance: w.balance,
      availableStreakFreezes: w.availableFreezes,
      ...(q.cursor ? {} : { inventory: w.inventory.map(toInventoryDto) }),
      history: { items: w.entries.items.map(toLedgerDto), nextCursor: w.entries.nextCursor },
    });
  }

  @Post('catalog/:itemId/purchase')
  @HttpCode(200)
  async purchaseItem(@CurrentUser() _u: AuthenticatedUser, @Param('itemId', new ZodPipe(CatalogItemIdParamSchema)) _itemId: string): Promise<never> {
    // V5 (D-020, spec §7.7) : gels, boost, œufs rares, accessoires vendus → 410 GONE (catalogue en lecture seule).
    void this.purchase;
    void CatalogPurchaseResponseSchema;
    throw Errors.gone();
  }

  @Post('streak-freezes/use')
  @HttpCode(200)
  async useFreeze(@CurrentUser() _u: AuthenticatedUser): Promise<never> {
    // V5 (D-020) : plus de séries ni de gels → 410 GONE.
    void this.freeze;
    void UseStreakFreezeResponseSchema;
    throw Errors.gone();
  }

  @Get('subscriptions/me')
  async mySubscription(@CurrentUser() u: AuthenticatedUser) {
    return SubscriptionMeResponseSchema.parse(await this.subscription.execute(u.userId));
  }

  /**
   * Produits (V5, compatible V4) : forme `{mode, products}` conservée — abonnements seulement, les packs
   * de pièces ne sont plus vendus (D-020) — + place (4,99 €, 1ʳᵉ offerte), Blowy+ (9,99 €/mois), duos.
   */
  @Get('purchases/products')
  async products() {
    const list = (await this.records.listStoreProducts()).filter((p) => p.active && p.kind === 'SUBSCRIPTION');
    void StoreProductsResponseSchema;
    // V5.4 (C.10) : plus aucun produit store quand Blowy+ passe par Stripe Billing (achat intégré désactivé).
    const iap = this.graph.payments.params().plusBilling === 'IN_APP_PURCHASE';
    return ProductsResponseV5Schema.parse({ mode: this.provider.mode, products: iap ? list.map((p) => ({ id: p.id, kind: p.kind, coinsAmount: p.coinsAmount })) : [], ...this.graph.payments.queries.productsV5() });
  }

  /** `GET /v1/outing-credits` : 1ʳᵉ offerte disponible + lots de crédit (type, nombre, échéance). */
  @Get('outing-credits')
  async outingCredits(@CurrentUser() u: AuthenticatedUser) {
    return OutingCreditsViewSchema.parse(await this.graph.payments.queries.credits(u.userId));
  }

  /** `GET /v1/me/allowances` : 1ʳᵉ offerte, Blowy+, duos actifs autorisés (V5.4 : 3 pour tous), crédits. */
  @Get('me/allowances')
  async allowances(@CurrentUser() u: AuthenticatedUser) {
    return AllowancesViewSchema.parse(await this.graph.payments.queries.allowances(u.userId));
  }

  /**
   * `POST /v1/subscriptions/plus/checkout` — V5.4 (C.10) : abonnement Stripe Billing (Apple Pay / carte via
   * PaymentSheet) ; Blowy+ n'est actif qu'au webhook signé. 503 `PLUS_UNAVAILABLE` sans prix configuré.
   */
  @Post('subscriptions/plus/checkout')
  @HttpCode(200)
  async plusCheckout(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return PlusCheckoutResponseSchema.parse(await this.graph.payments.plusCheckout.execute(u.userId, cid));
  }

  /** V5.5 (D-064) : parrainage — ma prochaine sortie est-elle offerte (1ʳᵉ sortie vécue d'un·e filleul·e, ≤ 1 par mois) ? */
  @Get('me/referral-reward')
  async referralReward(@CurrentUser() u: AuthenticatedUser) {
    return this.graph.payments.queries.referralStatus(u.userId);
  }

  /** V5.4 (C.10) : résiliation EN APP (abonnement Stripe, hors store) à l'échéance ; 412 `PLUS_NOT_ACTIVE`. */
  @Post('subscriptions/plus/cancel')
  @HttpCode(200)
  async plusCancel(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return PlusCancelResponseSchema.parse(await this.graph.payments.plus.cancel(u.userId, cid));
  }

  /** Le corps (s'il existe) est volontairement ignoré : seule la session détermine l'appUserID. */
  @Post('purchases/sync')
  @HttpCode(200)
  async syncPurchases(@CurrentUser() u: AuthenticatedUser) {
    return PurchasesSyncResponseSchema.parse(await this.sync.execute(u.userId));
  }

  /** Démonstration locale étiquetée (NOT_CONFIGURED hors BILLING_PROVIDER=local_demo). */
  @Post('purchases/local-demo')
  @HttpCode(200)
  async localDemoPurchase(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(LocalDemoPurchaseRequestSchema)) body: LocalDemoPurchaseRequest) {
    // V5 (D-020) : les pièces ne sont plus vendues, même en démo.
    if (body.action === 'BUY_COINS') throw Errors.gone();
    return PurchasesSyncResponseSchema.parse(await this.localDemo.execute(u.userId, cid, body));
  }
}

/** Webhook public (pas de session) authentifié par le header Authorization configuré chez RevenueCat. */
@Controller('v1/webhooks')
export class RevenueCatWebhookController {
  constructor(@Inject(ReceiveWebhookUseCase) private readonly receive: ReceiveWebhookUseCase) {}

  @Public()
  @Post('revenuecat')
  @HttpCode(200)
  async revenuecat(@Req() req: BlowyRequest, @Body() body: unknown) {
    const r = await this.receive.execute(req.headers.authorization, body);
    return WebhookAckSchema.parse({ status: r.status });
  }
}

/**
 * Webhook Stripe public (pas de session), exclu du limiteur par IP (`/v1/webhooks/*`) : signature
 * `Stripe-Signature` vérifiée sur le CORPS BRUT (`rawBody: true`) ; 401 sans enregistrement si
 * invalide ; 200 `DUPLICATE` pour un rejeu ; 500 → Stripe relivre.
 */
@Controller('v1/webhooks')
export class StripeWebhookController {
  constructor(@Inject(ECONOMY_GRAPH_TOKEN) private readonly graph: EconomyGraph) {}

  @Public()
  @Post('stripe')
  @HttpCode(200)
  async stripe(@Req() req: BlowyRequest) {
    const sig = req.headers[STRIPE_SIGNATURE_HEADER];
    const r = await this.graph.payments.stripeWebhook.execute(req.rawBody, Array.isArray(sig) ? sig[0] : sig);
    return StripeWebhookAckSchema.parse(r);
  }
}
