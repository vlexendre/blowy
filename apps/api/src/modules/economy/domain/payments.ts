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
  | { kind: 'PLUS_INCLUDED' }
  | { kind: 'CREDIT'; lot: CreditLot }
  | { kind: 'PAY' };

/**
 * « Je viens » : 1ʳᵉ sortie offerte, puis Blowy+ (toutes les sorties incluses), puis un crédit, sinon
 * paiement de la place. `mode=PAY` = la personne choisit explicitement de payer (aucun crédit pris).
 */
export function chooseFunding(i: { mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean; plusActive: boolean; plusIncludesAllOutings: boolean; lots: readonly CreditLot[] }): FundingChoice {
  if (i.mode === 'PAY') return { kind: 'PAY' };
  if (i.freeFirstAvailable) return { kind: 'FREE_FIRST' };
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
 * - `USER_EARLY` : annulation personnelle AVANT la révélation des visages (V5.2 C.8) ;
 * - `LATE_PAYMENT` : paiement arrivé après l'échéance du hold, place pleine ou sortie close ;
 * - `ACCOUNT_DELETED` : suppression du compte avec une place active.
 * L'annulation après la révélation des visages et l'absence ne remboursent rien (jamais appelées ici).
 */
export type RefundCause = 'OUTING_CANCELLED' | 'SYSTEM_REMOVAL' | 'SAFETY_EXIT' | 'USER_EARLY' | 'LATE_PAYMENT' | 'ACCOUNT_DELETED';

/** CARD = remboursement carte intégral ; REFUND_CREDIT = nouveau lot 90 j ; NONE = rien à écrire. */
export type RefundOutcome = 'CARD' | 'REFUND_CREDIT' | 'NONE';

export function refundOutcome(funding: SeatFunding | null, cause: RefundCause, ctx: { plusActive: boolean }): RefundOutcome {
  switch (funding) {
    case 'PAID':
      // Annulation perso ≥ seuil : crédit 90 j (remboursement carte sur demande au support). Le reste : carte.
      return cause === 'USER_EARLY' ? 'REFUND_CREDIT' : 'CARD';
    case 'CREDIT':
      // Recrédit : le lot consommé est rendu sous forme d'un nouveau lot (validité 90 j).
      return cause === 'ACCOUNT_DELETED' ? 'NONE' : 'REFUND_CREDIT';
    case 'PLUS_INCLUDED':
      // Abonné·e toujours actif·ve : rien à rendre (toutes les sorties sont incluses) ; sinon crédit 90 j.
      return cause === 'ACCOUNT_DELETED' || ctx.plusActive ? 'NONE' : 'REFUND_CREDIT';
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
export function venueCompensationCause(i: { attended?: boolean; cancelKind?: string | null; outingStatus: string }): 'NO_SHOW' | 'LATE_CANCEL' | null {
  if (i.outingStatus === 'CANCELLED') return null;
  if (i.attended === false) return 'NO_SHOW';
  if (i.cancelKind === 'LATE') return 'LATE_CANCEL';
  return null;
}

/**
 * Montant reversé au lieu (V5.3 C.11, plus de forfait 15 €) : le prix de la place si elle était payée
 * (carte, ou crédit issu d'une place payée) ; sinon (1ʳᵉ offerte, Blowy+, staff) Blowy verse le
 * forfait « place offerte » (3 €, tuning).
 */
export function venueCompensationAmount(funding: SeatFunding | null, paidCents: number | null, p: Pick<PaymentsParams, 'seatPriceCents' | 'venueCompensationFreeSeatCents'>): { amountCents: number; basis: 'SEAT_PRICE' | 'FREE_SEAT' } {
  if (funding === 'PAID' || funding === 'CREDIT') return { amountCents: cents(paidCents ?? p.seatPriceCents), basis: 'SEAT_PRICE' };
  return { amountCents: cents(p.venueCompensationFreeSeatCents), basis: 'FREE_SEAT' };
}

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
}
