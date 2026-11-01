/**
 * PurchasesPort — interface UNIQUE des achats côté mobile.
 * Écrite par l'agent G faute de `apps/mobile/src/core/ports/purchases.ts` (agent D) au moment du
 * codage : D peut la ré-exporter tel quel depuis core/ports (aucune deuxième interface).
 *
 * Principes :
 * - prix, devise, période, essai et réductions viennent UNIQUEMENT du store (offerings RevenueCat) ;
 *   aucun prix ni « −60 % » codé en dur : une offre n'est affichée que si elle existe dans les offerings ;
 * - l'essai n'est affiché que si le store déclare l'utilisateur éligible ;
 * - après achat/restauration, l'app appelle POST /v1/purchases/sync : les DROITS sont lus depuis
 *   le backend, jamais déduits du CustomerInfo client.
 */
import type { IntegrationMode } from '@blowy/api-contract';

export type PackagePeriod = 'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'OTHER';

export interface IntroOffer {
  /** Gratuit (essai) ou prix réduit introductif — libellés localisés fournis par le store. */
  readonly kind: 'FREE_TRIAL' | 'INTRO_PRICE';
  readonly priceString: string;
  /** Période ISO 8601 du store (ex. 'P3D'). */
  readonly period: string;
  readonly cycles: number;
}

export interface StorePackage {
  /** Identifiant opaque du package (pour purchase). */
  readonly id: string;
  readonly offeringId: string;
  readonly productId: string;
  readonly kind: 'SUBSCRIPTION' | 'CONSUMABLE';
  readonly period: PackagePeriod;
  readonly title: string;
  /** Prix localisé exact du store (ex. « 59,88 € »). */
  readonly priceString: string;
  readonly price: number;
  readonly currencyCode: string;
  /** Équivalent mensuel localisé fourni par le store (annuel), sinon null. */
  readonly pricePerMonthString: string | null;
  /** Présent seulement si le store déclare l'utilisateur ÉLIGIBLE. */
  readonly introOffer: IntroOffer | null;
}

export interface StoreOffering {
  readonly id: string;
  readonly isCurrent: boolean;
  /** Métadonnées dashboard (ex. { placement: 'onboarding_later' } pour l'offre −60 % réelle). */
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly packages: readonly StorePackage[];
}

export interface Offerings {
  readonly mode: IntegrationMode;
  readonly current: StoreOffering | null;
  readonly all: readonly StoreOffering[];
}

export type PurchaseOutcome =
  | { readonly status: 'PURCHASED' }
  | { readonly status: 'CANCELLED' }
  | { readonly status: 'PENDING' }
  | { readonly status: 'NOT_AVAILABLE'; readonly reason: string };

export interface PurchasesPort {
  readonly mode: IntegrationMode;
  /** Configure le SDK et associe l'appUserID = identifiant utilisateur Blowy stable (jamais l'email). */
  identify(userId: string): Promise<void>;
  /** Déconnexion : revient à un utilisateur anonyme côté SDK. */
  reset(): Promise<void>;
  getOfferings(): Promise<Offerings>;
  purchase(pkg: StorePackage): Promise<PurchaseOutcome>;
  restore(): Promise<void>;
  /** Changement CustomerInfo côté SDK (renouvellement, autre appareil) → l'app resynchronise le serveur. */
  onCustomerInfoChanged(listener: () => void): () => void;
}
