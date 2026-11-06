/**
 * Port de paiement V5 : places de sortie ET Blowy+ (V5.4 §C10 : Blowy+ payé par Apple Pay / Stripe
 * comme les places, plus d'achat intégré). Le serveur fixe toujours le montant et crée l'intention ;
 * l'app ne fait que présenter la feuille de paiement (Stripe PaymentSheet, Apple Pay en tête).
 */
export type PaymentProvider = 'STRIPE' | 'LOCAL_DEMO';

export interface PaymentRequest {
  provider: PaymentProvider;
  /** Secret client d'intention émis par l'API (jamais journalisé). */
  clientSecret: string;
  amountCents: number;
  currency: string;
  /** Libellé de la ligne Apple Pay (« Place · jeudi 19 h 30 », « Blowy+ · mois »). */
  label: string;
  /** Abonnement : Apple Pay présente un paiement récurrent mensuel. */
  recurring?: boolean;
}

export type PaymentOutcome = { status: 'PAID' } | { status: 'CANCELED' } | { status: 'FAILED'; reason: 'DECLINED' | 'UNAVAILABLE' | 'PROVIDER_MISMATCH' | 'UNKNOWN' };

export interface PaymentPort {
  readonly kind: PaymentProvider;
  /** Apple Pay disponible sur cet appareil (sinon carte dans la même feuille). */
  readonly applePay: boolean;
  pay(req: PaymentRequest): Promise<PaymentOutcome>;
}
