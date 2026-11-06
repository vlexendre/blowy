/**
 * Ports du sous-domaine paiements V5 (T3) : fournisseur de paiement (Stripe | LOCAL_DEMO), webhook
 * signé, journal économique append-only, lecture des places (tables `outings`, lecture seule).
 * Aucun appel réseau sous verrou : le fournisseur est appelé hors transaction (après commit, job).
 */
import type { SeatFunding, SeatStatus } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export type PaymentProviderKind = 'STRIPE' | 'LOCAL_DEMO';
export type PaymentEnvironment = 'PRODUCTION' | 'SANDBOX' | 'LOCAL_DEMO';

export interface SeatIntent {
  readonly providerPaymentId: string;
  /** Secret client (PaymentSheet / Apple Pay) : renvoyé au seul propriétaire, jamais journalisé ni loggé. */
  readonly clientSecret: string;
}

export interface ProviderRefund {
  readonly refundId: string;
  readonly status: 'SUCCEEDED' | 'PENDING';
}

/** V5.4 (C.10) : abonnement Blowy+ créé chez le fournisseur (Stripe Billing), en attente du 1ᵉʳ paiement. */
export interface PlusSubscriptionIntent {
  readonly customerRef: string;
  readonly subscriptionRef: string;
  /** Secret client de la 1ʳᵉ facture (PaymentSheet / Apple Pay) ; null si rien à payer. Jamais journalisé. */
  readonly clientSecret: string | null;
}

/**
 * Port fournisseur des PLACES et, depuis V5.4 (C.10), de Blowy+ (Stripe Billing) — Strategy :
 * StripePaymentProvider en production, LocalDemoPaymentProvider en local (Blowy+ démo via la démo locale).
 */
export interface PaymentProvider {
  readonly kind: PaymentProviderKind;
  readonly environment: PaymentEnvironment;
  /** Démo : la place est confirmée dans la transaction, sans débit réel (jamais en production). */
  readonly confirmsImmediately: boolean;
  createSeatIntent(i: { seatId: string; userId: string; amountCents: number; currency: 'EUR'; idempotencyKey: string }): Promise<SeatIntent>;
  refund(i: { providerPaymentId: string; seatId: string; amountCents: number; idempotencyKey: string }): Promise<ProviderRefund>;
  /** V5.4 (C.10) : crée (ou retrouve, clé idempotente) l'abonnement Blowy+ ; absent = fournisseur sans abonnement. */
  createPlusSubscription?(i: { userId: string; customerRef: string | null; priceId: string; idempotencyKey: string }): Promise<PlusSubscriptionIntent>;
  /** V5.4 (C.10) : résiliation à l'échéance (`cancel_at_period_end`). */
  cancelPlusSubscription?(i: { subscriptionRef: string; idempotencyKey: string }): Promise<void>;
}
export const PAYMENT_PROVIDER = Symbol('PaymentProvider');

/** Événement Stripe vérifié et normalisé (objet brut conservé pour la stratégie par type). */
export interface VerifiedProviderEvent {
  readonly id: string;
  readonly type: string;
  readonly createdAt: Date;
  readonly livemode: boolean;
  readonly object: Record<string, unknown>;
  /** Corps expurgé (sans `client_secret`) à conserver dans le journal des webhooks. */
  readonly redacted: unknown;
}

/** Vérification de signature sur le CORPS BRUT (HMAC-SHA256, tolérance d'horodatage). Lève si invalide. */
export interface SignedWebhookVerifier {
  verify(rawBody: Buffer, signatureHeader: string | undefined, now: Date): VerifiedProviderEvent;
}

// ------------------------------------------------------------------ journal économique
export type JournalKind =
  | 'CREDIT_GRANT'
  | 'CREDIT_CONSUME'
  | 'CREDIT_REVERSAL'
  | 'PAYMENT_INTENT'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'REFUND_REQUESTED'
  | 'REFUND_SETTLED'
  | 'REFUND_FAILED'
  | 'VENUE_COMPENSATION'
  | 'VENUE_COMPENSATION_REVERSAL';

export type JournalRefs = Readonly<Record<string, string | number | boolean | null>>;

export interface JournalDraft {
  /** Clé d'idempotence UNIQUE (fabrique `LedgerKeys`) : rejouer la même cause n'écrit rien. */
  readonly key: string;
  readonly kind: JournalKind;
  /** Compte : `user:<id>` (crédits, paiements) ou `venue:<id>` (compensation). */
  readonly account: string;
  readonly userId: string | null;
  /** Entier signé : unités de crédit (±1) ou centimes. */
  readonly amount: number;
  readonly unit: 'CREDIT' | 'EUR_CENTS';
  readonly refs: JournalRefs;
}

export interface JournalEntry extends JournalDraft {
  readonly id: string;
  readonly at: Date;
}

/**
 * Journal économique append-only (patron du ledger : clé d'idempotence unique en base, jamais de
 * mise à jour, corrections par contre-écriture). Écritures dans la transaction de l'appelant.
 */
export interface EconomyJournal {
  append(scope: TxScope, draft: JournalDraft): Promise<{ entry: JournalEntry; inserted: boolean }>;
  byKey(scope: TxScope | null, key: string): Promise<JournalEntry | null>;
  forUser(scope: TxScope | null, userId: string, kinds: readonly JournalKind[]): Promise<JournalEntry[]>;
  /** Entrées d'un type portant `refs[ref] = value` (ex. paiement d'une place). */
  byRef(scope: TxScope | null, kind: JournalKind, ref: string, value: string): Promise<JournalEntry[]>;
  /** Remboursements demandés non encore réglés (job `economy.refunds`). */
  pendingRefunds(limit: number): Promise<JournalEntry[]>;
  forAccount(account: string, kinds: readonly JournalKind[], limit: number): Promise<JournalEntry[]>;
}
export const ECONOMY_JOURNAL = Symbol('EconomyJournal');

// ------------------------------------------------------------------ lecture des places (outings, lecture seule)
export interface SeatFacts {
  readonly seatId: string;
  readonly userId: string;
  readonly outingId: string;
  readonly venueId: string;
  readonly outingStatus: string;
  readonly status: SeatStatus;
  readonly funding: SeatFunding | null;
  readonly cancelKind: string | null;
  /** V5.6 (E22) : la place a été annulée après `lockAt` (table réservée au lieu). */
  readonly cancelledAfterLock?: boolean;
}

export interface SeatDirectory {
  seat(seatId: string): Promise<SeatFacts | null>;
  /** 1ʳᵉ sortie offerte déjà utilisée (même règle que `outings` : FREE_FIRST non recréditée). */
  usedFreeFirst(userId: string): Promise<boolean>;
}
export const SEAT_DIRECTORY = Symbol('SeatDirectory');

/** V5.5 (D-064) : sorties offertes par parrainage (port ; adaptateur Prisma `ReferralReward`). */
export interface ReferralFreeStore {
  /** Accorde au parrain une sortie offerte : au plus 1 par mois (`period`) et jamais plus d'une en attente. */
  grant(scope: TxScope, i: { referrerUserId: string; refereeUserId: string; period: string }): Promise<boolean>;
  available(scope: TxScope | null, userId: string): Promise<{ id: string } | null>;
  usedThisPeriod(userId: string, period: string): Promise<boolean>;
  /** V5.7 (E28) : mois civil `YYYY-MM` de la personne (son fuseau). */
  periodOf(scope: TxScope | null, userId: string, at: Date): Promise<string>;
  consume(scope: TxScope, rewardId: string, seatId: string): Promise<boolean>;
  /** « Reste offerte » (annulation gratuite, sortie annulée) : la récompense redevient disponible. */
  release(scope: TxScope, seatId: string): Promise<boolean>;
}

