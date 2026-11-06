/**
 * Économie V5 — règles PURES des places, crédits, remboursements et compensation lieu
 * (spec-v5 §6.2–6.4, D-018–D-020, V5.1 H.23, V5.2 H.25, V5.3 B.6 et C.10–C.11).
 * - Montants : centimes entiers (jamais de flottant), devise EUR, fixés par le serveur (tuning).
 * - Crédits : lots unitaires append-only (journal), consommés une seule fois (clé unique par lot),
 *   ordre `CREDIT_CONSUMPTION_ORDER` puis échéance la plus proche.
 * - Aucune règle ici ne touche composition, visibilité, quota hebdo, priorité, score ou votes.
 */
import { CREDIT_CONSUMPTION_ORDER, type CreditKind, type SeatFunding } from '@blowy/domain';
import { invalid } from './errors.js';

export const EUR = 'EUR' as const;

/** Montant en centimes : entier sûr strictement positif (sinon erreur, jamais d'arrondi silencieux). */
export function cents(n: number, label = 'amountCents'): number {
  if (!Number.isSafeInteger(n) || n <= 0) throw invalid(`${label} doit être un entier de centimes > 0.`, { label });
  return n;
}

// ------------------------------------------------------------------ crédits de sortie
/** Lot unitaire de crédit (une place). FREE_FIRST n'est pas un lot : dérivé des places (1ʳᵉ offerte). */
export interface CreditLot {
  readonly lotKey: string;
  readonly kind: Exclude<CreditKind, 'FREE_FIRST'>;
  readonly grantedAt: Date;
  readonly expiresAt: Date | null;
}

export interface CreditMovement {
  readonly kind: 'CREDIT_GRANT' | 'CREDIT_CONSUME' | 'CREDIT_REVERSAL';
  readonly lotKey: string;
  readonly creditKind?: Exclude<CreditKind, 'FREE_FIRST'>;
  readonly at: Date;
  readonly expiresAt?: Date | null;
}

/**
 * Lots disponibles à `now` : accordés, ni consommés ni contre-passés, non échus. Une expiration est
 * calculée (pas de report, affiché honnêtement) : aucun job n'est nécessaire pour qu'un lot échu
 * cesse d'être utilisable.
 */
export function availableLots(moves: readonly CreditMovement[], now: Date): CreditLot[] {
  const used = new Set(moves.filter((m) => m.kind !== 'CREDIT_GRANT').map((m) => m.lotKey));
  const order = (k: CreditKind) => CREDIT_CONSUMPTION_ORDER.indexOf(k);
  return moves
    .filter((m): m is CreditMovement & { creditKind: CreditLot['kind'] } => m.kind === 'CREDIT_GRANT' && !!m.creditKind && !used.has(m.lotKey))
    .map((m) => ({ lotKey: m.lotKey, kind: m.creditKind, grantedAt: m.at, expiresAt: m.expiresAt ?? null }))
    .filter((l) => l.expiresAt === null || l.expiresAt.getTime() > now.getTime())
    .sort(
      (a, b) =>
        order(a.kind) - order(b.kind) ||
        (a.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
        a.grantedAt.getTime() - b.grantedAt.getTime() ||
        a.lotKey.localeCompare(b.lotKey),
    );
}

/** Regroupement pour `GET /v1/outing-credits` (par type et échéance). */
export function summarizeLots(lots: readonly CreditLot[]): { kind: CreditLot['kind']; count: number; expiresAt: Date | null }[] {
  const m = new Map<string, { kind: CreditLot['kind']; count: number; expiresAt: Date | null }>();
  for (const l of lots) {
    const k = `${l.kind}|${l.expiresAt?.toISOString() ?? ''}`;
    const cur = m.get(k);
    if (cur) cur.count++;
    else m.set(k, { kind: l.kind, count: 1, expiresAt: l.expiresAt });
  }
  return [...m.values()];
}

// ------------------------------------------------------------------ financement d'une place
export type FundingChoice =
  | { kind: 'FREE_FIRST' }
  | { kind: 'REFERRAL_FREE' }
  | { kind: 'PLUS_INCLUDED' }
  | { kind: 'CREDIT'; lot: CreditLot }
  | { kind: 'PAY' };

/**
 * « Je viens » : 1ʳᵉ sortie offerte, puis Blowy+ (toutes les sorties incluses), puis un crédit, sinon
 * paiement de la place. `mode=PAY` = la personne choisit explicitement de payer (aucun crédit pris).
 */
export function chooseFunding(i: { mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean; plusActive: boolean; plusIncludesAllOutings: boolean; lots: readonly CreditLot[]; referralFreeAvailable?: boolean }): FundingChoice {
  if (i.mode === 'PAY') return { kind: 'PAY' };
  if (i.freeFirstAvailable) return { kind: 'FREE_FIRST' };
  // V5.5 (D-064) : sortie offerte par parrainage, après la 1ʳᵉ offerte et avant Blowy+.
  if (i.referralFreeAvailable) return { kind: 'REFERRAL_FREE' };
  if (i.plusActive && i.plusIncludesAllOutings) return { kind: 'PLUS_INCLUDED' };
  const lot = i.lots[0];
  return lot ? { kind: 'CREDIT', lot } : { kind: 'PAY' };
}

/** Le hold de paiement (place réservée pendant le paiement) est-il échu ? */
export const holdExpired = (holdExpiresAt: Date | null, now: Date) => holdExpiresAt !== null && now.getTime() >= holdExpiresAt.getTime();

// ------------------------------------------------------------------ remboursements (§6.4, D-019)
/**
 * Cause d'un remboursement, vue par l'économie :
 * - `OUTING_CANCELLED` : la sortie n'a pas lieu (sous-effectif, lieu, staff, quartier) ;
 * - `SYSTEM_REMOVAL` / `SAFETY_EXIT` : retrait système ou de sécurité ;
 * - `USER_EARLY` : annulation personnelle AVANT la confirmation (J-1 18 h, V5.3 B.6) ;
 * - `LATE_PAYMENT` : paiement arrivé après l'échéance du hold, place pleine ou sortie close ;
 * - `ACCOUNT_DELETED` : suppression du compte avec une place active.
 * L'annulation après la confirmation et l'absence ne remboursent rien (jamais appelées ici).
 */
export type RefundCause = 'OUTING_CANCELLED' | 'SYSTEM_REMOVAL' | 'SAFETY_EXIT' | 'USER_EARLY' | 'LATE_PAYMENT' | 'ACCOUNT_DELETED';

/** CARD = remboursement carte intégral ; REFUND_CREDIT = nouveau lot 90 j ; NONE = rien à écrire. */
export type RefundOutcome = 'CARD' | 'REFUND_CREDIT' | 'NONE';

export function refundOutcome(funding: SeatFunding | null, cause: RefundCause, ctx: { plusActive: boolean }): RefundOutcome {
  switch (funding) {
    case 'PAID':
      // V5.3 B.6 / D-042 : toujours la carte (annulation avant la confirmation comprise) ; plus de crédit 90 j.
      return 'CARD';
    case 'CREDIT':
      // Recrédit : le lot consommé est rendu sous forme d'un nouveau lot (validité 90 j).
      return cause === 'ACCOUNT_DELETED' ? 'NONE' : 'REFUND_CREDIT';
    case 'PLUS_INCLUDED':
      // D-042 : place incluse dans Blowy+ → sans objet (aucun crédit émis, même si l'abonnement a pris fin).
      void ctx;
      return 'NONE';
    case 'FREE_FIRST':
      // Dérivé des places : une 1ʳᵉ offerte recréditée redevient disponible (aucune écriture).
      return 'NONE';
    default:
      return 'NONE';
  }
}

// ------------------------------------------------------------------ compensation lieu (V5.3 C.11)
/**
 * Place non honorée APRÈS la confirmation du groupe (veille 18 h, V5.3 B.6) : absence sans prévenir ou
 * annulation après la confirmation. Écriture comptable interne (aucun paiement réel). Pas de
 * compensation si la sortie n'a pas eu lieu, ni pour un départ remboursé (sécurité, retrait système).
 */
export function venueCompensationCause(i: { attended?: boolean; cancelKind?: string | null; outingStatus: string; cancelledAfterLock?: boolean }): 'NO_SHOW' | 'LATE_CANCEL' | 'EMERGENCY' | 'SAFETY' | null {
  if (i.outingStatus === 'CANCELLED') return null;
  // V5.6 (A.1, E22) : sortie pour raison de sécurité APRÈS la confirmation (la table était réservée), y compris
  // après le check-in ou « je connais quelqu'un » : la personne est remboursée, Blowy verse 3 € HT au lieu.
  // V5.7 (§6.5) : idem pour un retrait système (blocage, « je connais quelqu'un » retiré) après la confirmation.
  if ((i.cancelKind === 'SAFETY_EXIT' || i.cancelKind === 'SYSTEM_REMOVAL') && i.cancelledAfterLock === true) return 'SAFETY';
  if (i.attended === false) return 'NO_SHOW';
  if (i.cancelKind === 'LATE') return 'LATE_CANCEL';
  // V5.4 (B.8) : « imprévu » après la confirmation — sans effet de fiabilité pour la personne, mais le lieu
  // est compensé exactement comme pour une absence (place non remboursée).
  if (i.cancelKind === 'EMERGENCY') return 'EMERGENCY';
  return null;
}

/**
 * V5.4 (C.12) : Blowy annule une sortie DÉJÀ CONFIRMÉE (manque de participants après la confirmation,
 * staff, quartier fermé, sécurité) → le lieu reçoit `[T] venues.compensationBlowyCancelSeatCents` (3 €) par
 * place réservée. Jamais quand le lieu est la cause (`VENUE_UNAVAILABLE`), jamais avant la confirmation.
 */
export const BLOWY_CANCEL_COMPENSATED_REASONS: ReadonlySet<string> = new Set(['UNDERSIZED', 'STAFF', 'NEIGHBORHOOD_CLOSED', 'SAFETY']);
/** V5.7 (D-079) : à toute heure après la confirmation et quel que soit le motif interne ; seule exception : le lieu est la cause. */
export function blowyCancelCompensated(i: { wasConfirmed: boolean; reason: string }): boolean {
  return i.wasConfirmed && i.reason !== 'VENUE_UNAVAILABLE';
}

/**
 * Montant reversé au lieu (V5.3 C.11, plus de forfait 15 €) : le prix de la place si elle était payée
 * (carte, ou crédit issu d'une place payée) ; sinon (1ʳᵉ offerte, Blowy+, staff) Blowy verse le
 * forfait « place offerte » (3 €, tuning).
 */
export function venueCompensationAmount(funding: SeatFunding | null, paidCents: number | null, p: Pick<PaymentsParams, 'seatPriceCents' | 'venueCompensationFreeSeatCents'>): { amountCents: number; basis: 'SEAT_PRICE' | 'FREE_SEAT'; taxBasis: 'HT' } {
  // V5.5 (D-067) : compensations exprimées HORS TAXE — la place payée est reversée à son prix HT (4,99 € TTC → 4,16 € HT).
  if (funding === 'PAID' || funding === 'CREDIT') return { amountCents: excludingVat(paidCents ?? p.seatPriceCents), basis: 'SEAT_PRICE', taxBasis: 'HT' };
  return { amountCents: cents(p.venueCompensationFreeSeatCents), basis: 'FREE_SEAT', taxBasis: 'HT' };
}

/** V5.5 (D-067) : TVA 20 % — montant HT (centimes entiers, arrondi au centime) d'un montant TTC. */
export const VAT_RATE_PERMILLE = 200;
export const excludingVat = (ttcCents: number): number => cents(Math.round((cents(ttcCents) * 1000) / (1000 + VAT_RATE_PERMILLE)));

/**
 * V5.10 (jury tour 11) : reversement au lieu de l'activité prépayée — intégral, au régime du lieu : TTC par défaut,
 * HT si le contrat le prévoit (Blowy garde alors la TVA collectée pour la reverser).
 */
export const activityPayoutAmount = (ttcCents: number, taxBasis: 'TTC' | 'HT'): number => (taxBasis === 'HT' ? excludingVat(ttcCents) : cents(ttcCents));

// ------------------------------------------------------------------ paramètres (depuis @blowy/tuning)
/** Paramètres V5 (lus du tuning ; valeurs absentes du tuning : `PENDING_PAYMENTS_TUNING`, demandées à B). */
export interface PaymentsParams {
  readonly tuningVersion: string;
  /** 4,99 € la place (V5.1 H.23), centimes entiers. */
  readonly seatPriceCents: number;
  readonly firstOutingFree: boolean;
  /** Durée de réservation de la place pendant le paiement (15 min). */
  readonly paymentHoldMinutes: number;
  /** Validité d'un crédit de remboursement (90 j). */
  readonly refundCreditValidityDays: number;
  /** Blowy+ 9,99 €/mois (référence ; le prix facturé est celui du fournisseur). */
  readonly plusMonthlyPriceCents: number;
  readonly plusIncludesAllOutings: boolean;
  readonly plusDuoUnlimited: boolean;
  /** 1 duo actif gratuit (V5.2 H.25). */
  readonly freeActiveDuos: number;
  /** V5.3 C.11 : versé par Blowy au lieu pour une place OFFERTE non honorée (3 €). Place payée : son prix. */
  readonly venueCompensationFreeSeatCents: number;
  /** V5.4 (C.12) : par place réservée, si Blowy annule une sortie confirmée (3 €). */
  readonly venueCompensationBlowyCancelCents: number;
  /** V5.4 (C.10) : canal de vente de Blowy+ (`STRIPE_BILLING` ; l'achat intégré RevenueCat est désactivé). */
  readonly plusBilling: 'STRIPE_BILLING' | 'IN_APP_PURCHASE';
}
