/**
 * Adapter RÉEL react-native-purchases 10.16.0 (version épinglée par l'orchestrateur : la 11.x casse
 * `pod install`). API utilisée, vérifiée dans node_modules/react-native-purchases/dist (10.16.0) :
 * configure({ apiKey, appUserID }), logIn, logOut, getOfferings, purchasePackage, restorePurchases,
 * checkTrialOrIntroductoryPriceEligibility (iOS), add/removeCustomerInfoUpdateListener.
 * Clé PUBLIQUE SDK uniquement (EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY) — jamais la clé secrète.
 */
import Purchases, { type CustomerInfoUpdateListener, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import type { IntroOffer, Offerings, PackagePeriod, PurchaseOutcome, PurchasesPort, StoreOffering, StorePackage } from '../model/purchases.port';

export interface RevenueCatAdapterOptions {
  apiKey: string;
  platform: 'ios' | 'android';
  /** Mode affiché : SANDBOX en dev/staging, LIVE seulement en build de production. */
  mode: 'LIVE' | 'SANDBOX';
}

// Enums exposés en membres statiques de `Purchases` en 10.16.0 (pas d'export nommé).
const { PACKAGE_TYPE, PRODUCT_CATEGORY, PURCHASES_ERROR_CODE, INTRO_ELIGIBILITY_STATUS } = Purchases;
const PERIOD: Partial<Record<string, PackagePeriod>> = {
  [PACKAGE_TYPE.WEEKLY]: 'WEEKLY',
  [PACKAGE_TYPE.MONTHLY]: 'MONTHLY',
  [PACKAGE_TYPE.ANNUAL]: 'ANNUAL',
};

export class RevenueCatPurchasesAdapter implements PurchasesPort {
  readonly mode: 'LIVE' | 'SANDBOX';
  private configured = false;
  private readonly packages = new Map<string, PurchasesPackage>();

  constructor(private readonly opts: RevenueCatAdapterOptions) {
    this.mode = opts.mode;
  }

  async identify(userId: string): Promise<void> {
    if (!this.configured) {
      Purchases.configure({ apiKey: this.opts.apiKey, appUserID: userId });
      this.configured = true;
      return;
    }
    if ((await Purchases.getAppUserID()) !== userId) await Purchases.logIn(userId);
  }

  async reset(): Promise<void> {
    if (!this.configured) return;
    this.packages.clear();
    try {
      await Purchases.logOut();
    } catch {
      /* déjà anonyme */
    }
  }

  async getOfferings(): Promise<Offerings> {
    this.ensureConfigured();
    const raw = await Purchases.getOfferings();
    const offerings = Object.values(raw.all);
    const eligibility = await this.introEligibility(offerings.flatMap((o) => o.availablePackages.map((p) => p.product.identifier)));
    this.packages.clear();
    const all = offerings.map((o) => this.mapOffering(o, raw.current?.identifier === o.identifier, eligibility));
    return { mode: this.mode, current: all.find((o) => o.isCurrent) ?? null, all };
  }

  async purchase(pkg: StorePackage): Promise<PurchaseOutcome> {
    this.ensureConfigured();
    const native = this.packages.get(pkg.id);
    if (!native) return { status: 'NOT_AVAILABLE', reason: 'PACKAGE_STALE' };
    try {
      await Purchases.purchasePackage(native);
      return { status: 'PURCHASED' };
    } catch (err) {
      const e = err as { code?: string; userCancelled?: boolean | null };
      if (e.userCancelled || e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { status: 'CANCELLED' };
      if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { status: 'PENDING' };
      throw err;
    }
  }

  async restore(): Promise<void> {
    this.ensureConfigured();
    await Purchases.restorePurchases();
  }

  onCustomerInfoChanged(listener: () => void): () => void {
    const l: CustomerInfoUpdateListener = () => listener();
    Purchases.addCustomerInfoUpdateListener(l);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(l);
    };
  }

  private ensureConfigured() {
    if (!this.configured) throw new Error('PurchasesPort.identify(userId) doit être appelé après authentification');
  }

  /** iOS : éligibilité calculée par le SDK. Android : le store ne renvoie l'offre d'essai que si éligible. */
  private async introEligibility(productIds: string[]): Promise<Record<string, boolean>> {
    if (this.opts.platform !== 'ios' || productIds.length === 0) return {};
    try {
      const res = await Purchases.checkTrialOrIntroductoryPriceEligibility([...new Set(productIds)]);
      return Object.fromEntries(Object.entries(res).map(([id, e]) => [id, e.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE]));
    } catch {
      return {}; // inconnu → pas d'essai affiché (règle SDK : ne pas induire en erreur)
    }
  }

  private mapOffering(o: PurchasesOffering, isCurrent: boolean, eligible: Record<string, boolean>): StoreOffering {
    return {
      id: o.identifier,
      isCurrent,
      metadata: o.metadata ?? {},
      packages: o.availablePackages.map((p) => {
        const id = `${o.identifier}:${p.identifier}`;
        this.packages.set(id, p);
        return this.mapPackage(id, o.identifier, p, eligible);
      }),
    };
  }

  private mapPackage(id: string, offeringId: string, p: PurchasesPackage, eligible: Record<string, boolean>): StorePackage {
    const product = p.product;
    const isSub = product.productCategory === PRODUCT_CATEGORY.SUBSCRIPTION;
    return {
      id,
      offeringId,
      productId: product.identifier,
      kind: isSub ? 'SUBSCRIPTION' : 'CONSUMABLE',
      period: PERIOD[p.packageType] ?? 'OTHER',
      title: product.title,
      priceString: product.priceString,
      price: product.price,
      currencyCode: product.currencyCode,
      pricePerMonthString: p.packageType === PACKAGE_TYPE.ANNUAL ? product.pricePerMonthString : null,
      introOffer: isSub ? this.introOf(product, eligible[product.identifier]) : null,
    };
  }

  private introOf(product: PurchasesPackage['product'], iosEligible: boolean | undefined): IntroOffer | null {
    if (this.opts.platform === 'ios') {
      if (iosEligible !== true || !product.introPrice) return null;
      const ip = product.introPrice;
      return { kind: ip.price === 0 ? 'FREE_TRIAL' : 'INTRO_PRICE', priceString: ip.priceString, period: ip.period, cycles: ip.cycles };
    }
    // Android (Play Billing) : l'option par défaut ne contient une phase gratuite/intro que si l'utilisateur y a droit.
    const opt = product.defaultOption;
    const phase = opt?.freePhase ?? opt?.introPhase ?? null;
    if (!phase) return null;
    return {
      kind: opt?.freePhase ? 'FREE_TRIAL' : 'INTRO_PRICE',
      priceString: phase.price.formatted,
      period: phase.billingPeriod.iso8601,
      cycles: phase.billingCycleCount ?? 1,
    };
  }
}
