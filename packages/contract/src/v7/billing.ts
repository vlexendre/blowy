/**
 * Minimoa+ (chantier « facturation-admin ») : paywall, état de l'abonnement, achats vérifiés par l'API.
 *
 * Parcours de l'app :
 * 1. `GET plusPaywall` : offres (identifiants produit, montants facturés et périodes en données), essai, avantages,
 *    nombre réel de personnes compatibles dans la zone (0 : ne pas montrer ce bloc), liens légaux.
 *    L'app affiche les prix localisés de StoreKit ; `billed` ne sert que de repli.
 * 2. Achat StoreKit 2 avec `appAccountToken` = identifiant de la personne (`Me.id`), puis
 *    `POST plusPurchases` avec `Transaction.jwsRepresentation` (et, si disponible, la `renewalInfo` signée).
 *    Même appel pour « Restaurer mes achats » (avec la transaction la plus récente de `Transaction.currentEntitlements`).
 * 3. `GET plusSubscription` : état à afficher dans « Moi » (essai jusqu'au…, se renouvelle le…, expiré).
 * Le serveur reçoit aussi les notifications d'Apple (`plusAppleNotifications`, appelé par Apple, pas par l'app).
 */
import { COLLECTION_IDS, ITEM_IDS, PLANS, PLUS_MOMENTS, PLUS_PERKS, PLUS_TRIGGERS } from '@blowy/domain';
import { z } from 'zod';

const API = '/v1';

export const PlanZ = z.enum(PLANS);
export type PlanDto = z.infer<typeof PlanZ>;
export const PlusPerkZ = z.enum(PLUS_PERKS);
export const PlusPhaseZ = z.enum(['none', 'trial', 'active', 'grace', 'billing_retry', 'expired', 'refunded', 'revoked']);
export type PlusPhase = z.infer<typeof PlusPhaseZ>;
export const StoreZ = z.enum(['apple', 'google']);

/** Montant en centimes et son affichage français de repli (« 59,99 € »). */
export const MoneyZ = z.object({ amountMinor: z.number().int().nonnegative(), currency: z.literal('EUR'), display: z.string() });
export type Money = z.infer<typeof MoneyZ>;

export const PaywallOfferZ = z.object({
  plan: PlanZ,
  /** Identifiant du produit dans App Store Connect (à passer à `Product.products(for:)`). */
  productId: z.string(),
  /** Période facturée (l'hebdomadaire est présentée après l'annuelle et la mensuelle). */
  period: z.enum(['year', 'month', 'week']),
  /** Montant réellement facturé à chaque période : c'est le prix le plus visible (règle Apple 3.1.2). */
  billed: MoneyZ,
  /** Équivalent mensuel, à afficher en petit sous le prix facturé (annuel seulement). */
  perMonth: MoneyZ.nullable(),
  /** Jours d'essai gratuit (0 : pas d'essai). */
  trialDays: z.number().int().nonnegative(),
  /** Remise exacte par rapport à douze mensualités (annuel seulement, jamais calculée sur l'hebdomadaire), en pour cent. */
  discountPercent: z.number().int().nullable(),
  /** Textes de repli prêts à afficher (si StoreKit ne répond pas). */
  labels: z.object({
    /** « 59,99 € par an » */
    price: z.string(),
    /** « soit 4,99 € par mois » ou null */
    perMonth: z.string().nullable(),
    /** « 7 jours gratuits, puis 59,99 € par an » ou null */
    trial: z.string().nullable(),
    /** « Abonnement annuel Minimoa+ » */
    name: z.string(),
  }),
});
export type PaywallOffer = z.infer<typeof PaywallOfferZ>;

export const TrialStepZ = z.object({ day: z.number().int().nonnegative(), title: z.string(), text: z.string() });

export const SubscriptionZ = z.object({
  /** Même valeur que `Me.plus`. */
  plus: z.boolean(),
  phase: PlusPhaseZ,
  plan: PlanZ.nullable(),
  productId: z.string().nullable(),
  store: StoreZ.nullable(),
  /** Fin de l'essai gratuit (phase `trial` seulement). */
  trialEndsAt: z.string().nullable(),
  /** Fin de la période en cours, ou de l'accès s'il ne se renouvelle pas. */
  currentPeriodEndsAt: z.string().nullable(),
  willRenew: z.boolean(),
  /** Date du prochain paiement, si renouvellement prévu. */
  renewsAt: z.string().nullable(),
  /** Page du magasin où gérer ou annuler l'abonnement. */
  manageUrl: z.string().nullable(),
  /** Phrase d'état prête à afficher (« Essai gratuit jusqu'au 22 novembre. »). */
  summary: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionZ>;

/** D'où la feuille a été ouverte (mesure de la conversion par déclencheur, docs/DESIR.md). */
export const PlusTriggerZ = z.enum(PLUS_TRIGGERS);
export type PlusTriggerDto = z.infer<typeof PlusTriggerZ>;

/**
 * Collection saisonnière en cours : une vraie date de fin, tenue par le serveur (docs/DESIR.md). Après `until`, ses
 * objets ne sont plus donnés ; ceux qui les ont eus avec Minimoa+ pendant la collection les gardent.
 */
export const SeasonalCollectionZ = z.object({
  id: z.enum(COLLECTION_IDS),
  /** Dernier jour (inclus, heure de Paris), « AAAA-MM-JJ ». */
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Jours restants, aujourd'hui et le dernier jour compris. */
  daysLeft: z.number().int().positive(),
  items: z.array(z.enum(ITEM_IDS as [string, ...string[]])),
  /** Tu as Minimoa+ : ces objets sont à toi et le restent après la fin (tant que Minimoa+ est actif). */
  kept: z.boolean(),
});
export type SeasonalCollectionDto = z.infer<typeof SeasonalCollectionZ>;

export const PaywallZ = z.object({
  offers: z.array(PaywallOfferZ),
  /** Offre présélectionnée. */
  defaultPlan: PlanZ,
  trial: z.object({
    days: z.number().int(),
    /** Jour du rappel envoyé avant le premier paiement (réellement envoyé par le serveur). */
    reminderDay: z.number().int(),
    /** La frise : aujourd'hui → rappel → premier paiement. */
    timeline: z.array(TrialStepZ),
    /** Faux si un essai a déjà été utilisé sur ce compte (StoreKit `isEligibleForIntroOffer` reste la référence). */
    eligible: z.boolean(),
  }),
  perks: z.array(z.object({ key: PlusPerkZ, label: z.string() })),
  /** Preuve concrète : nombre réel de personnes compatibles dans sa zone. 0 : ne pas afficher le bloc. */
  teaser: z.object({ compatibleNearby: z.number().int().nonnegative(), label: z.string().nullable() }),
  /** Renouvellement automatique et comment annuler, à afficher sans défilement. */
  renewalNotice: z.string(),
  legal: z.object({ termsUrl: z.string(), privacyUrl: z.string(), plusTermsUrl: z.string() }),
  /** « Continuer gratuitement » : toujours présent. */
  continueFreeLabel: z.string(),
  restoreLabel: z.string(),
  subscription: SubscriptionZ,
  /** Collection saisonnière en cours (vitrine de la feuille), null hors saison. */
  collection: SeasonalCollectionZ.nullable().default(null),
});
export type Paywall = z.infer<typeof PaywallZ>;

const Jws = z.string().min(20).max(20_000);

/** Après un achat ou une restauration StoreKit 2. */
export const SubmitPurchaseBody = z.object({
  store: z.literal('apple'),
  /** `Transaction.jwsRepresentation` */
  signedTransaction: Jws,
  /** `Product.SubscriptionInfo.RenewalInfo` signé (`jwsRepresentation`), si l'app l'a. */
  signedRenewalInfo: Jws.optional(),
  /** D'où la feuille avait été ouverte (compté par déclencheur, sans personne derrière). */
  trigger: PlusTriggerZ.optional(),
});
export type SubmitPurchaseBody = z.infer<typeof SubmitPurchaseBody>;

/** Corps envoyé par Apple (App Store Server Notifications V2). */
/** La feuille s'est ouverte (compteur du jour par déclencheur). */
export const PlusOpenBody = z.object({ trigger: PlusTriggerZ });
export type PlusOpenBody = z.infer<typeof PlusOpenBody>;

/**
 * Moment clé à saluer d'une proposition Minimoa+ (première rencontre réussie, 7 jours de série), décidé et réservé par
 * le serveur : une fois par moment, jamais deux propositions fortes en moins de 3 jours. null : rien à proposer.
 */
export const PlusMomentZ = z.object({ moment: z.enum(PLUS_MOMENTS).nullable() });
export type PlusMomentDto = z.infer<typeof PlusMomentZ>;

export const AppleNotificationBody = z.object({ signedPayload: z.string().min(20).max(100_000) });


export const billingRoutes = {
  plusPaywall: () => `${API}/plus/paywall`,
  plusSubscription: () => `${API}/plus/subscription`,
  plusPurchases: () => `${API}/plus/purchases`,
  /** `POST` (`PlusOpenBody`) : la feuille s'est ouverte. */
  plusOpens: () => `${API}/plus/opens`,
  /** `POST` : y a-t-il un moment clé à saluer maintenant ? (réservé s'il y en a un). */
  plusMoment: () => `${API}/plus/moment`,
  /** URL à déclarer dans App Store Connect (production et bac à sable). */
  plusAppleNotifications: () => `${API}/plus/apple/notifications`,
} as const;
