/**
 * Adapter de DÉMONSTRATION locale (aucun store, aucune clé) — étiqueté LOCAL_DEMO partout.
 * Les « offres » listent les produits connus du serveur SANS prix (aucun prix inventé : l'UI
 * affiche « Démo locale » à la place). L'achat appelle POST /v1/purchases/local-demo, qui passe
 * par la même réconciliation serveur que la production. Refusé par le serveur hors local_demo.
 */
import type {
  Offerings,
  PurchaseOutcome,
  PurchasesPort,
  StorePackage,
} from '../model/purchases.port';
import type { PurchasesApi } from '../api/purchases.api';

const LOCAL_DEMO_PRICE_LABEL = ''; // volontairement vide : l'UI montre l'étiquette « Démo locale » (texte externalisé)

export class LocalDemoPurchasesAdapter implements PurchasesPort {
  readonly mode = 'LOCAL_DEMO' as const;
  private readonly listeners = new Set<() => void>();
  private userId: string | null = null;

  constructor(
    private readonly api: PurchasesApi,
    private readonly newCommandId: () => string,
  ) {}

  async identify(userId: string): Promise<void> {
    this.userId = userId;
  }

  async reset(): Promise<void> {
    this.userId = null;
  }

  async getOfferings(): Promise<Offerings> {
    const { products } = await this.api.products();
    const packages: StorePackage[] = products.map((p) => ({
      id: `local_demo:${p.id}`,
      offeringId: 'local_demo',
      productId: p.id,
      kind: p.kind === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'CONSUMABLE',
      period: /weekly$/.test(p.id)
        ? 'WEEKLY'
        : /monthly$/.test(p.id)
          ? 'MONTHLY'
          : /annual$/.test(p.id)
            ? 'ANNUAL'
            : 'OTHER',
      title: p.id,
      priceString: LOCAL_DEMO_PRICE_LABEL,
      price: 0,
      currencyCode: '',
      pricePerMonthString: null,
      introOffer: null, // aucun essai fabriqué
    }));
    const current = { id: 'local_demo', isCurrent: true, metadata: { localDemo: true }, packages };
    return { mode: 'LOCAL_DEMO', current, all: [current] };
  }

  async purchase(pkg: StorePackage): Promise<PurchaseOutcome> {
    if (!this.userId) return { status: 'NOT_AVAILABLE', reason: 'NOT_IDENTIFIED' };
    await this.api.localDemo(
      this.newCommandId(),
      pkg.kind === 'SUBSCRIPTION'
        ? { action: 'SUBSCRIBE', productId: pkg.productId, trial: false }
        : { action: 'BUY_COINS', productId: pkg.productId },
    );
    this.listeners.forEach((l) => l());
    return { status: 'PURCHASED' };
  }

  async restore(): Promise<void> {
    /* rien à restaurer côté store : l'état démo vit côté serveur */
  }

  onCustomerInfoChanged(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
