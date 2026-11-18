/**
 * Minimoa+ : la feuille d'offre (paywall de l'inscription, « Moi › Minimoa+ » et tous les points d'entrée de l'app via
 * `openPlus(raison)`), les achats StoreKit vérifiés par l'API, la restauration et la synchronisation au lancement.
 *
 * Les faits viennent de l'API (`api.plus.paywall()` : offres, essai, avantages, nombre réel de personnes compatibles,
 * mentions). Là où l'on peut acheter, les prix et la durée de l'essai viennent du magasin seul (StoreKit, localisés) :
 * s'il ne répond pas, aucun prix ni bouton d'achat (jamais un prix inventé). Les prix de l'API ne servent qu'à présenter
 * l'offre là où rien n'est vendu (web, Android). Règles Apple suivies : `docs/AUDIT-APPLE.md` (« Minimoa+ et App Review »).
 */
import { ApiError } from '@blowy/api-client';
import type { Paywall, PaywallOffer, PlanDto, Subscription } from '@blowy/contract';
import { ITEMS, type ItemSlot, OFFERS, type Outfit, PLUS_PERKS, PLUS_TRIGGERS, type PlusPerk, collectionOfItem, type PlusTrigger, type Species, yearlyDiscountPercent } from '@blowy/domain';
import { type IconName, PlusTemplate, type PlusHeroPose, type PlusOfferView, type PlusPerkView, SheetTemplate } from '@blowy/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { keys, type SignedPurchase, type StoreProduct, useApi, usePorts, useSession } from '@/core';
import { openLegal } from '@/features/me/links';
import { itemLabel } from '@/locales/content';
import { common } from '@/locales/common';
import { plus as t } from '@/locales/plus';
import { formatDate, formatPrice } from '@/locales/runtime';
import { noteReviewPurchase } from '@/features/review';

// ── Ouvrir la feuille depuis n'importe où ────────────────────────────────────

/**
 * Ce que la personne vient d'essayer de faire, ou le moment qui l'amène : le titre de la feuille et l'avantage mis en
 * tête en dépendent, et chaque ouverture est comptée par déclencheur (docs/DESIR.md). Liste du domaine.
 */
export const PLUS_REASONS = PLUS_TRIGGERS;
export type PlusReason = PlusTrigger;

const REASON_PERK: Partial<Record<PlusReason, PlusPerk>> = {
  premium_item: 'premium_items',
  map: 'map_everywhere',
  change_city: 'map_everywhere',
  habits_limit: 'more_habits',
  rename: 'free_rename',
  detailed_review: 'detailed_review',
  jokers: 'streak_jokers',
  encounters: 'more_encounters',
  far_away: 'map_everywhere',
  try_on: 'premium_items',
  worn_by: 'premium_items',
  collection: 'premium_items',
  moment_first_link: 'more_encounters',
  moment_streak_7: 'streak_jokers',
};

/** Raisons dont le titre parle de l'objet touché (essayé, vu sur un autre minimoa). */
const ITEM_REASONS: readonly PlusReason[] = ['premium_item', 'try_on', 'worn_by'];

/**
 * Ouvre la feuille Minimoa+ par-dessus l'écran courant (modale transparente `moi/blowy-plus`). `item` : l'objet premium
 * touché (il flotte près du minimoa). La fermer revient à l'écran d'en dessous.
 */
export function openPlus(reason: PlusReason = 'generic', opts: { item?: string } = {}): void {
  router.push({ pathname: '/moi/blowy-plus', params: { reason, ...(opts.item ? { item: opts.item } : {}) } });
}

export const isPlusReason = (v: unknown): v is PlusReason => typeof v === 'string' && (PLUS_REASONS as readonly string[]).includes(v);

// ── Données ──────────────────────────────────────────────────────────────────

export const plusKeys = { paywall: ['plus', 'paywall'] as const, subscription: ['plus', 'subscription'] as const };

export function usePaywall() {
  const api = useApi();
  const session = useSession();
  return useQuery({ queryKey: plusKeys.paywall, queryFn: api.plus.paywall, enabled: !!session });
}

export function useSubscription(enabled = true) {
  const api = useApi();
  const session = useSession();
  return useQuery({ queryKey: plusKeys.subscription, queryFn: api.plus.subscription, enabled: enabled && !!session });
}

/** Prix localisés du magasin pour ces produits (erreur : le magasin n'a pas répondu ; rien n'est alors proposé). */
export function useStoreProducts(productIds: readonly string[]) {
  const { purchases } = usePorts();
  return useQuery({
    queryKey: ['plus', 'store', ...productIds],
    queryFn: () => purchases.products(productIds),
    enabled: purchases.available && productIds.length > 0,
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

/**
 * Les avantages de Minimoa+, une seule source pour toute l'app : la liste et la phrase de l'API (`paywall.perks`, tirée de
 * `entitlements`), avec leur forme courte de l'app. Avant que l'API ait répondu : les clés du domaine (`PLUS_PERKS`).
 * La feuille, l'onglet Moi et les rencontres lisent tous ici (jamais une phrase d'avantage écrite ailleurs).
 */
export function usePlusPerks(petName: string): { key: PlusPerk; label: string | null; short: readonly string[] }[] {
  const paywall = usePaywall();
  const short = t.perks(petName) as Record<PlusPerk, readonly string[]>;
  const fromApi = paywall.data?.perks;
  if (fromApi?.length) return fromApi.map((p) => ({ key: p.key, label: p.label, short: short[p.key] ?? [p.label] }));
  return PLUS_PERKS.map((key) => ({ key, label: null, short: short[key] }));
}

/** Les avantages en une ligne (« Toute la carte · Changer de ville · … »), pour un bandeau. */
export function plusPerksLine(perks: ReturnType<typeof usePlusPerks>, max = 4): string {
  return perks.flatMap((p) => p.short).slice(0, max).join(' · ');
}

/** Envoie une transaction signée à l'API, puis la termine chez Apple (seulement si l'API l'a acceptée). */
async function submit(api: ReturnType<typeof useApi>, p: SignedPurchase, trigger?: PlusReason): Promise<Subscription> {
  const sub = await api.plus.submitPurchase({
    store: 'apple',
    signedTransaction: p.signedTransaction,
    ...(p.signedRenewalInfo ? { signedRenewalInfo: p.signedRenewalInfo } : {}),
    ...(trigger ? { trigger } : {}),
  });
  await p.finish();
  return sub;
}

function useRefreshPlus() {
  const qc = useQueryClient();
  return (sub?: Subscription) => {
    if (sub) qc.setQueryData(plusKeys.subscription, sub);
    void qc.invalidateQueries({ queryKey: keys.me });
    void qc.invalidateQueries({ queryKey: plusKeys.paywall });
    if (!sub) void qc.invalidateQueries({ queryKey: plusKeys.subscription });
  };
}

export type BuyResult = { status: 'purchased'; subscription: Subscription } | { status: 'pending' } | { status: 'cancelled' };

/** Achat : StoreKit (lié au compte par `appAccountToken`), vérification par l'API, puis `me` relu. */
export function usePurchase(trigger?: PlusReason) {
  const api = useApi();
  const { purchases } = usePorts();
  const qc = useQueryClient();
  const refresh = useRefreshPlus();
  return useMutation({
    mutationFn: async (productId: string): Promise<BuyResult> => {
      const me = qc.getQueryData<{ id: string }>(keys.me) ?? (await api.me.get());
      const out = await purchases.purchase(productId, me.id);
      if (out.status !== 'purchased') return out;
      try {
        return { status: 'purchased', subscription: await submit(api, out.purchase, trigger) };
      } catch (e) {
        // Payé chez Apple mais pas encore activé : la transaction reste ouverte, StoreKit la redonnera (et « restaurer »).
        throw new PlusActivationError(e);
      }
    },
    onSuccess: (r) => {
      // Pas de demande de note juste après un achat (features/review).
      if (r.status !== 'cancelled') noteReviewPurchase();
      if (r.status === 'purchased') refresh(r.subscription);
    },
  });
}

export class PlusActivationError extends Error {
  constructor(readonly cause: unknown) {
    super('activation');
  }
}

/** « Restaurer mes achats » : resynchronise avec le magasin et fait vérifier chaque abonnement en cours. */
export function useRestore() {
  const api = useApi();
  const { purchases } = usePorts();
  const refresh = useRefreshPlus();
  return useMutation({
    mutationFn: async (): Promise<Subscription | null> => {
      const list = await purchases.restore();
      let last: Subscription | null = null;
      for (const p of list) last = await submit(api, p);
      return last;
    },
    onSuccess: (sub) => refresh(sub ?? undefined),
  });
}

/**
 * Au lancement (connecté, inscrit) : chaque transaction qui arrive hors d'un achat (renouvellement, achat « en
 * attente » validé, achat fait ailleurs) est envoyée à l'API, puis `me` est relu. Rien sur le web ni en mode local.
 */
export function usePlusSync(enabled: boolean) {
  const api = useApi();
  const { purchases } = usePorts();
  const refresh = useRefreshPlus();
  useEffect(() => {
    if (!enabled || !purchases.available || purchases.simulated) return;
    return purchases.onUpdates((p) => {
      void submit(api, p)
        .then((sub) => refresh(sub))
        .catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, purchases, api]);
}

// ── Mesure et moments clés (docs/DESIR.md) ───────────────────────────────────

/** Compte l'ouverture de la feuille par déclencheur, une fois par ouverture (jamais bloquant, rien pour un membre). */
function usePlusOpened(reason: PlusReason, enabled: boolean) {
  const api = useApi();
  useEffect(() => {
    if (enabled) api.plus.opened(reason).catch(() => undefined);
    // Une fois par feuille.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

let momentAsked = false;
/**
 * Moment clé (premier lien, 7 jours de série) : quand l'accueil est calme, demande une fois par lancement au serveur
 * s'il y a un moment à saluer ; le serveur décide et plafonne (une fois par moment, jamais deux propositions fortes en
 * moins de 3 jours, jamais le jour de l'inscription, jamais avec Minimoa+). Alors seulement, la feuille s'ouvre.
 */
export function usePlusMoment(calm: boolean, plus: boolean | undefined) {
  const api = useApi();
  useEffect(() => {
    if (!calm || plus !== false || momentAsked) return;
    momentAsked = true;
    // Le serveur a réservé le moment : la feuille s'ouvre même si l'accueil change entre-temps.
    api.plus
      .moment()
      .then(({ moment }) => {
        if (moment) setTimeout(() => openPlus(moment === 'first_link' ? 'moment_first_link' : 'moment_streak_7'), 700);
      })
      .catch(() => undefined);
  }, [calm, plus, api]);
}

// ── La feuille ───────────────────────────────────────────────────────────────

/**
 * Prix d'une offre. Là où l'on achète : seulement ceux du magasin (montant facturé, équivalent mensuel calculé dessus) ;
 * produit absent : l'offre n'est pas proposée. Ailleurs (web, Android) : les prix de référence de l'API, pour information.
 */
function offerPrices(
  o: PaywallOffer,
  store: StoreProduct | undefined,
  sellable: boolean,
): { amount: string; price: string; perMonth: string | null; perMonthShort: string | null } | null {
  if (store) {
    const perMonth =
      o.period === 'year' && store.price !== null && store.currency ? formatPrice(Math.round((store.price * 100) / 12), store.currency) : null;
    return {
      amount: store.displayPrice,
      price: t.price[o.period](store.displayPrice),
      perMonth: perMonth ? t.perMonth(perMonth) : null,
      perMonthShort: perMonth ? t.perMonthShort(perMonth) : null,
    };
  }
  if (sellable) return null;
  return { amount: o.billed.display, price: o.labels.price, perMonth: o.labels.perMonth, perMonthShort: o.perMonth ? t.perMonthShort(o.perMonth.display) : null };
}

/**
 * Remise de l'annuel sur douze mensualités, calculée sur les prix du magasin (même devise) ; sinon aucune pastille.
 * Jamais contre l'hebdomadaire (52 semaines donneraient un chiffre plus flatteur, mais trompeur).
 */
function storeDiscount(yearly: StoreProduct | undefined, monthly: StoreProduct | undefined): number | null {
  if (!yearly?.price || !monthly?.price || !yearly.currency || yearly.currency !== monthly.currency) return null;
  // Même règle que l'API (domaine), appliquée aux montants du magasin.
  const pct = yearlyDiscountPercent({ ...OFFERS.yearly, amountMinor: Math.round(yearly.price * 100) }, { ...OFFERS.monthly, amountMinor: Math.round(monthly.price * 100) });
  return pct >= 5 ? pct : null;
}

/** Objets premium montrés autour du minimoa : celui qu'on vient de toucher d'abord. */
const PREMIUM = ITEMS.filter((i) => i.unlock.kind === 'premium' && !collectionOfItem(i.id)).map((i) => i.id);
function floatingFor(item: string | undefined): string[] {
  const rest = ['lunettes_pixel', 'aureole', ...PREMIUM].filter((id, i, all) => id !== item && all.indexOf(id) === i);
  return item && PREMIUM.includes(item) ? [item, rest[0] ?? 'aureole'] : rest.slice(0, 2);
}

const TEASER_SPECIES: readonly Species[] = ['suzie', 'gaston', 'pia'];

/** Ordre des lignes d'avantages (après celui de la raison). */
const PERK_ORDER: readonly PlusPerk[] = ['more_encounters', 'map_everywhere', 'premium_items', 'streak_jokers', 'detailed_review', 'more_habits', 'free_rename'];
/** Icône 3D de chaque avantage. */
const PERK_ICON: Record<PlusPerk, IconName> = {
  more_encounters: 'coeurs',
  map_everywhere: 'balle',
  premium_items: 'cadeau',
  streak_jokers: 'flamme',
  detailed_review: 'eclair',
  more_habits: 'etoiles',
  free_rename: 'confettis',
};
/** Les trois avantages illustrés par une pose du minimoa, sous le titre (le dernier en tenue premium). */
const HERO: readonly { perk: PlusPerk; pose: PlusHeroPose['pose'] }[] = [
  { perk: 'more_encounters', pose: 'coucou' },
  { perk: 'map_everywhere', pose: 'marche' },
  { perk: 'premium_items', pose: 'fier' },
];

/**
 * Tenue de la vitrine : la collection saisonnière en cours (venue de l'API, avec sa vraie date de fin), sinon des objets
 * premium permanents (jamais l'objet d'une collection finie, qu'on ne peut plus avoir). L'objet touché prend sa place.
 */
const SHOWCASE: Outfit = { head: 'aureole', face: 'lunettes_pixel', body: 'chaine_or' };
function showcaseFor(item: string | undefined, collection: readonly string[] | null): Outfit {
  const base: Outfit = { ...SHOWCASE };
  if (collection?.length) {
    for (const slot of ['head', 'body', 'toy'] as const) {
      const pick = ITEMS.find((i) => i.slot === slot && collection.includes(i.id));
      if (pick) base[slot] = pick.id;
    }
    if (collection.some((id) => ITEMS.find((i) => i.id === id)?.slot === 'face')) delete base.face;
  }
  const touched = item ? ITEMS.find((i) => i.id === item && i.unlock.kind === 'premium') : undefined;
  return touched ? { ...base, [touched.slot as ItemSlot]: touched.id } : base;
}

function headlineFor(reason: PlusReason, petName: string, item?: string, collectionUntil?: string | null): string {
  const label = item ? itemLabel[item as keyof typeof itemLabel] : undefined;
  if (ITEM_REASONS.includes(reason)) {
    return label ? t.headline[reason as 'premium_item' | 'try_on' | 'worn_by'](label) : typeof t.headline.generic === 'function' ? t.headline.generic(petName) : t.headline.generic;
  }
  // La date de fin vient du serveur ; hors saison, le titre général.
  if (reason === 'collection') return collectionUntil ? t.headline.collection(collectionUntil) : t.headline.generic(petName);
  const h = t.headline[reason];
  return typeof h === 'function' ? h(petName) : h;
}

export interface PlusOfferProps {
  pet: { name: string; species: Species; outfit?: Record<string, string> | null };
  reason?: PlusReason;
  /** Objet premium touché (raison `premium_item`). */
  item?: string;
  /** Membre ou non (`me.plus`). */
  member?: boolean;
  onClose: () => void;
  /** « Continuer gratuitement » (le paywall de l'inscription mène à l'app, ailleurs on revient en arrière). */
  onContinue: () => void;
}

export function PlusOffer({ pet, reason = 'generic', item, member = false, onClose, onContinue }: PlusOfferProps) {
  const { purchases } = usePorts();
  const paywall = usePaywall();
  const data: Paywall | undefined = paywall.data;
  const offers = data?.offers ?? [];
  const store = useStoreProducts(offers.map((o) => o.productId));
  const [plan, setPlan] = useState<PlanDto | null>(null);
  const buy = usePurchase(reason);
  usePlusOpened(reason, !member);
  const restore = useRestore();
  const [status, setStatus] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(null);
  const sub = data?.subscription;
  const isMember = member || !!sub?.plus;

  const byId = useMemo(() => new Map((store.data ?? []).map((p) => [p.productId, p])), [store.data]);
  const highlight = REASON_PERK[reason];
  // Une phrase « Titre : explication » par avantage (celle de l'API reste celle du lecteur d'écran), celui de la raison en tête.
  const lines: Record<PlusPerk, readonly string[]> = t.perkLines(pet.name, PREMIUM.length);
  const perkKeys: PlusPerk[] = data?.perks.length ? data.perks.map((p) => p.key).filter((k) => k in lines) : [...PLUS_PERKS];
  const perks: PlusPerkView[] = perkKeys
    .map((key) => {
      const [title = '', text = ''] = lines[key];
      return { key, icon: PERK_ICON[key], title: t.colon(title), text, label: data?.perks.find((p) => p.key === key)?.label, highlight: key === highlight };
    })
    .sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight) || PERK_ORDER.indexOf(a.key as PlusPerk) - PERK_ORDER.indexOf(b.key as PlusPerk));
  const short = t.perks(pet.name) as Record<PlusPerk, readonly string[]>;
  const poses: PlusHeroPose[] = HERO.map((h) => ({
    key: h.perk,
    pose: h.pose,
    label: short[h.perk][0] ?? '',
    outfit: h.perk === 'premium_items' ? showcaseFor(item, data?.collection?.items ?? null) : (pet.outfit ?? null),
  }));

  // Là où l'on achète (iPhone, ou magasin simulé du mode local), seul le magasin donne prix et essai.
  const sellable = purchases.available;
  // Le magasin a répondu, mais sans aucun de nos produits (produits absents ou pas prêts dans App Store Connect, accord
  // « Paid Apps » non signé…) : même traitement qu'une panne, jamais un bouton d'achat sans prix.
  const storeEmpty = sellable && store.isSuccess && offers.length > 0 && !offers.some((o) => byId.has(o.productId));
  const storeDown = sellable && (store.isError || storeEmpty);
  const storeLoading = sellable && offers.length > 0 && store.isLoading;
  const yearlyStore = byId.get(offers.find((o) => o.period === 'year')?.productId ?? '');
  const monthlyStore = byId.get(offers.find((o) => o.period === 'month')?.productId ?? '');
  const discount = sellable ? storeDiscount(yearlyStore, monthlyStore) : null;
  const views: (PlusOfferView<PlanDto> & { trialDays: number })[] = (storeLoading || storeDown ? [] : offers).flatMap((o) => {
    const s = byId.get(o.productId);
    const prices = offerPrices(o, s, sellable);
    if (!prices) return [];
    const trialDays = sellable ? (s?.trialDays ?? 0) : o.trialDays;
    const eligible = trialDays > 0 && (s?.introEligible ?? data?.trial.eligible ?? false);
    const name = t.plan[o.plan];
    const badge = sellable ? (o.period === 'year' ? discount : null) : o.discountPercent;
    return [
      {
        key: o.plan,
        name: t.planCard[o.plan],
        amount: prices.amount,
        period: t.period[o.period],
        perMonth: prices.perMonthShort,
        badge: badge ? t.badge(badge) : null,
        price: prices.price,
        accessibilityLabel: [eligible ? t.lead.trial(name, trialDays) : name, prices.price, prices.perMonth, badge ? t.badge(badge) : null].filter(Boolean).join(', '),
        trialDays: eligible ? trialDays : 0,
        // Frise de l'essai (jour 0 · rappel · premier paiement) si elle correspond à l'essai de l'API (autre durée dans le
        // magasin : pas de frise) ; sans droit à l'essai, la frise dit le paiement, le renouvellement et l'annulation.
        timeline:
          eligible && data && trialDays === data.trial.days
            ? data.trial.timeline.map((step, i) => ({ title: t.colon(step.title), text: t.timeline[i] ?? step.text }))
            : eligible
              ? null
              : [
                  { title: t.colon(t.noTrial.today[0]), text: t.noTrial.today[1], glyph: 'unlock' as const },
                  { title: t.colon(t.noTrial.every[o.period]), text: t.noTrial.renews, glyph: 'star' as const },
                  { title: t.colon(t.noTrial.anytime[0]), text: t.noTrial.anytime[1], glyph: 'check' as const },
                ],
      },
    ];
  });
  // Le choix de la personne, sinon l'offre par défaut de l'API, sinon la première proposée.
  const chosen: PlanDto = [plan, data?.defaultPlan].find((k): k is PlanDto => !!k && views.some((v) => v.key === k)) ?? views[0]?.key ?? 'yearly';
  const current = views.length ? offers.find((o) => o.plan === chosen) : undefined;
  const currentView = views.find((v) => v.key === chosen);
  const trialDays = currentView?.trialDays ?? 0;
  // Fin de l'essai : la date du premier paiement, dite à côté du bouton.
  const firstPayment = trialDays > 0 ? formatDate(new Date(Date.now() + trialDays * 86_400_000), { day: 'numeric', month: 'long' }) : null;
  const unavailable = paywall.isError || storeDown;
  const retry = () => {
    setStatus(null);
    if (paywall.isError) void paywall.refetch();
    if (storeDown) void store.refetch();
  };

  const cta = unavailable ? t.cta.retry : !sellable ? t.cta.unavailable : trialDays > 0 ? t.cta.trial(trialDays) : t.cta.subscribe(currentView?.price ?? '');
  // Avec l'essai, le bouton dit aussi ce qui sera facturé ensuite, et à quelle période.
  const ctaSub = !unavailable && sellable && trialDays > 0 && currentView ? t.ctaThen(currentView.price) : null;

  const doBuy = () => {
    if (!current) return;
    setStatus(null);
    buy.mutate(current.productId, {
      onSuccess: (r) => {
        if (r.status === 'pending') setStatus({ tone: 'info', text: t.status.pending });
        if (r.status === 'purchased') setStatus({ tone: 'success', text: t.status.welcome(pet.name) });
      },
      onError: (e) => setStatus({ tone: 'error', text: e instanceof PlusActivationError ? t.status.activation : t.status.failed }),
    });
  };
  const doRestore = () => {
    setStatus(null);
    restore.mutate(undefined, {
      onSuccess: (s) => setStatus(s?.plus ? { tone: 'success', text: t.status.restored } : { tone: 'info', text: t.status.restoreNone }),
      onError: (e) => setStatus({ tone: 'error', text: e instanceof ApiError ? e.message : t.status.restoreError }),
    });
  };
  const manage = async () => {
    if (await purchases.manageSubscriptions()) return;
    void Linking.openURL(sub?.manageUrl ?? 'https://apps.apple.com/account/subscriptions');
  };

  const teaserCount = data?.teaser.compatibleNearby ?? 0;
  return (
    <SheetTemplate asScreen bare visible onClose={onClose} closeLabel={common.close}>
      <PlusTemplate
        onClose={onClose}
        closeLabel={common.close}
        brand={t.brand}
        headline={headlineFor(reason, pet.name, item, data?.collection ? formatDate(new Date(`${data.collection.until}T12:00:00Z`), { day: 'numeric', month: 'long' }) : null)}
        pet={{ species: pet.species, name: pet.name }}
        poses={poses}
        floatingItems={floatingFor(item)}
        teaser={teaserCount > 0 && data?.teaser.label ? { label: data.teaser.label, species: TEASER_SPECIES } : null}
        perks={perks}
        heroPerks={HERO.map((h) => h.perk)}
        morePerksLabel={t.morePerks}
        offers={views}
        selected={chosen}
        onSelect={(k) => {
          setPlan(k);
          setStatus(null);
        }}
        offersLabel={t.offersLabel}
        ctaLabel={cta}
        ctaSubLabel={ctaSub}
        onCta={unavailable ? retry : sellable && current && !buy.isPending ? doBuy : undefined}
        ctaDisabled={unavailable ? paywall.isFetching || store.isFetching : !sellable || !current}
        ctaLoading={buy.isPending || paywall.isLoading || storeLoading}
        status={
          status ??
          (paywall.isError
            ? { tone: 'error', text: t.status.loadError }
            : storeDown
              ? { tone: 'error', text: storeEmpty ? t.status.noOffers : t.status.pricesError }
              : !sellable && data
                ? { tone: 'info', text: t.status.unavailable }
                : null)
        }
        devNote={purchases.simulated && data && !isMember ? t.status.simulated : null}
        member={
          isMember
            ? { title: t.member.title, summary: sub?.summary ?? t.member.fallback, manageLabel: sub?.store === 'apple' || purchases.available ? t.member.manage : undefined, onManage: () => void manage() }
            : null
        }
        continueLabel={isMember ? common.close : (data?.continueFreeLabel ?? t.continueFree)}
        onContinue={onContinue}
        restoreLabel={data?.restoreLabel ?? t.restore}
        onRestore={purchases.available ? doRestore : undefined}
        restoreLoading={restore.isPending}
        // Liens de l'app (pas de l'API) : là même si l'offre n'a pas chargé.
        links={[
          { label: t.links.terms, onPress: openLegal('conditions') },
          { label: t.links.privacy, onPress: openLegal('confidentialite') },
        ]}
        moreLinks={[{ label: t.links.plusTerms, onPress: openLegal('abonnement') }]}
        ctaNote={isMember || !currentView ? null : firstPayment ? t.ctaNote.trial(trialDays, currentView.price, firstPayment) : t.ctaNote.plain(currentView.price)}
      />
    </SheetTemplate>
  );
}
