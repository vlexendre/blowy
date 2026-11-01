/**
 * Client REST économie (contrats Zod @blowy/api-contract). Le transport HTTP authentifié est
 * injecté (fourni par le client API de l'app — agent D / @blowy/api-client) : aucune forme inventée.
 */
import {
  CatalogPurchaseResponseSchema,
  CatalogResponseSchema,
  IDEMPOTENCY_HEADER,
  PurchasesSyncResponseSchema,
  StoreProductsResponseSchema,
  SubscriptionMeResponseSchema,
  UseStreakFreezeResponseSchema,
  WalletResponseSchema,
  type LocalDemoPurchaseRequest,
} from '@blowy/api-contract';

/** Transport minimal : méthode, chemin /v1/..., corps JSON, en-têtes ; renvoie le JSON ou lève l'ApiError. */
export type HttpTransport = (req: { method: 'GET' | 'POST'; path: string; body?: unknown; headers?: Record<string, string> }) => Promise<unknown>;

export function createPurchasesApi(http: HttpTransport) {
  const command = (commandId: string) => ({ [IDEMPOTENCY_HEADER]: commandId });
  return {
    catalog: async () => CatalogResponseSchema.parse(await http({ method: 'GET', path: '/v1/catalog' })),
    wallet: async (cursor?: string) => WalletResponseSchema.parse(await http({ method: 'GET', path: `/v1/wallet${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}` })),
    purchaseItem: async (commandId: string, itemId: string) =>
      CatalogPurchaseResponseSchema.parse(await http({ method: 'POST', path: `/v1/catalog/${encodeURIComponent(itemId)}/purchase`, headers: command(commandId) })),
    useStreakFreeze: async (commandId: string) => UseStreakFreezeResponseSchema.parse(await http({ method: 'POST', path: '/v1/streak-freezes/use', headers: command(commandId) })),
    subscription: async () => SubscriptionMeResponseSchema.parse(await http({ method: 'GET', path: '/v1/subscriptions/me' })),
    /** Aucun corps : le serveur réconcilie avec RevenueCat à partir de la session uniquement. */
    sync: async () => PurchasesSyncResponseSchema.parse(await http({ method: 'POST', path: '/v1/purchases/sync' })),
    products: async () => StoreProductsResponseSchema.parse(await http({ method: 'GET', path: '/v1/purchases/products' })),
    localDemo: async (commandId: string, req: LocalDemoPurchaseRequest) =>
      PurchasesSyncResponseSchema.parse(await http({ method: 'POST', path: '/v1/purchases/local-demo', body: req, headers: command(commandId) })),
  };
}
export type PurchasesApi = ReturnType<typeof createPurchasesApi>;
