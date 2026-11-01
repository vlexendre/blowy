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
  type LocalDemoPurchaseRequest,
  type PageQuery,
} from '@blowy/api-contract';
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
  async purchaseItem(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('itemId', new ZodPipe(CatalogItemIdParamSchema)) itemId: string) {
    const out = await this.purchase.execute(u.userId, cid, itemId);
    return CatalogPurchaseResponseSchema.parse({ ...out.result, replayed: out.replayed });
  }

  @Post('streak-freezes/use')
  @HttpCode(200)
  async useFreeze(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    const out = await this.freeze.execute(u.userId, cid);
    return UseStreakFreezeResponseSchema.parse({ ...out.result, replayed: out.replayed });
  }

  @Get('subscriptions/me')
  async mySubscription(@CurrentUser() u: AuthenticatedUser) {
    return SubscriptionMeResponseSchema.parse(await this.subscription.execute(u.userId));
  }

  /** Produits connus du serveur (identifiants store + pièces). Prix = store uniquement. */
  @Get('purchases/products')
  async products() {
    const list = (await this.records.listStoreProducts()).filter((p) => p.active);
    return StoreProductsResponseSchema.parse({ mode: this.provider.mode, products: list.map((p) => ({ id: p.id, kind: p.kind, coinsAmount: p.coinsAmount })) });
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
