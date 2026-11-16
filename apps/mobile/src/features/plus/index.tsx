/**
 * Minimoa+ : la feuille d'offre (paywall de l'inscription, « Moi › Minimoa+ » et tous les points d'entrée de l'app via
 * `openPlus(raison)`), les achats StoreKit vérifiés par l'API, la restauration et la synchronisation au lancement.
 *
 * Les faits viennent de l'API (`api.plus.paywall()` : offres, essai, avantages, nombre réel de personnes compatibles,
 * mentions, liens légaux) ; les prix affichés viennent du magasin (StoreKit, localisés) quand il répond, sinon de l'API.
 * Le montant facturé est toujours le prix le plus visible (Apple 3.1.2) ; « Continuer gratuitement » est toujours là.
 */
import { ApiError } from '@blowy/api-client';
import type { Paywall, PaywallOffer, PlanDto, Subscription } from '@blowy/contract';
import { ITEMS, OFFERS, type Plan, PLUS_PERKS, type PlusPerk, monthlyEquivalentMinor, type Species } from '@blowy/domain';
import { PlusTemplate, type PlusOfferView, SheetTemplate } from '@blowy/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { keys, type SignedPurchase, type StoreProduct, useApi, usePorts, useSession } from '@/core';
import { itemLabel } from '@/locales/content';
import { common } from '@/locales/common';
import { plus as t } from '@/locales/plus';
import { formatPrice } from '@/locales/runtime';

// ── Ouvrir la feuille depuis n'importe où ────────────────────────────────────

/** Ce que la personne vient d'essayer de faire : le titre de la feuille et l'avantage mis en tête en dépendent. */
export const PLUS_REASONS = ['generic', 'onboarding', 'premium_item', 'map', 'change_city', 'habits_limit', 'rename', 'detailed_review', 'jokers', 'encounters'] as const;
export type PlusReason = (typeof PLUS_REASONS)[number];

const REASON_PERK: Partial<Record<PlusReason, PlusPerk>> = {
  premium_item: 'premium_items',
  map: 'map_everywhere',
  change_city: 'map_everywhere',
  habits_limit: 'more_habits',
  rename: 'free_rename',
  detailed_review: 'detailed_review',
  jokers: 'streak_jokers',
  encounters: 'more_encounters',
};

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

/** Prix localisés du magasin pour ces produits (liste vide : on prend ceux de l'API). */
export function useStoreProducts(productIds: readonly string[]) {
  const { purchases } = usePorts();
  return useQuery({
    queryKey: ['plus', 'store', ...productIds],
    queryFn: () => purchases.products(productIds),
    enabled: purchases.available && productIds.length > 0,
    staleTime: 30 * 60_000,
    retry: false,
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

/**
 * Prix indicatifs de Minimoa+ (domaine), mis en forme dans la langue et la région du téléphone. Sert aux lignes d'aperçu
 * hors de la feuille (« Moi »). Dans la feuille, les prix viennent du magasin ou de l'API.
 */
export function plusPrices(plan: Plan = 'yearly'): { total: string; perMonth: string } {
  const o = OFFERS[plan];
  return { total: formatPrice(o.amountMinor, o.currency), perMonth: formatPrice(monthlyEquivalentMinor(o), o.currency) };
}

/** Envoie une transaction signée à l'API, puis la termine chez Apple (seulement si l'API l'a acceptée). */
async function submit(api: ReturnType<typeof useApi>, p: SignedPurchase): Promise<Subscription> {
  const sub = await api.plus.submitPurchase({ store: 'apple', signedTransaction: p.signedTransaction, ...(p.signedRenewalInfo ? { signedRenewalInfo: p.signedRenewalInfo } : {}) });
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
export function usePurchase() {
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
        return { status: 'purchased', subscription: await submit(api, out.purchase) };
      } catch (e) {
        // Payé chez Apple mais pas encore activé : la transaction reste ouverte, StoreKit la redonnera (et « restaurer »).
        throw new PlusActivationError(e);
      }
    },
    onSuccess: (r) => {
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

// ── La feuille ───────────────────────────────────────────────────────────────

/** Prix d'une offre : StoreKit d'abord (localisé), l'API en repli. */
function offerPrices(o: PaywallOffer, store: StoreProduct | undefined) {
  if (store) {
    const perMonth =
      o.period === 'year' && store.price !== null && store.currency ? formatPrice(Math.round((store.price * 100) / 12), store.currency) : null;
    return { price: o.period === 'year' ? t.price.year(store.displayPrice) : t.price.month(store.displayPrice), perMonth: perMonth ? t.perMonth(perMonth) : null };
  }
  return { price: o.labels.price, perMonth: o.labels.perMonth };
}

/** Objets premium montrés autour du minimoa : celui qu'on vient de toucher d'abord. */
const PREMIUM = ITEMS.filter((i) => i.unlock.kind === 'premium').map((i) => i.id);
function floatingFor(item: string | undefined): string[] {
  const rest = ['lunettes_pixel', 'aureole', ...PREMIUM].filter((id, i, all) => id !== item && all.indexOf(id) === i);
  return item && PREMIUM.includes(item) ? [item, rest[0] ?? 'aureole'] : rest.slice(0, 2);
}

const TEASER_SPECIES: readonly Species[] = ['suzie', 'gaston', 'pia'];

/** Avantages montrés avant « Et N de plus », dans cet ordre (après celui de la raison). */
const PERKS_SHOWN = 3;
const PERK_ORDER: readonly PlusPerk[] = ['more_encounters', 'map_everywhere', 'detailed_review', 'streak_jokers', 'more_habits', 'free_rename', 'premium_items'];

function headlineFor(reason: PlusReason, petName: string, item?: string): string {
  if (reason === 'premium_item' && item) return t.headline.premium_item(itemLabel[item as keyof typeof itemLabel] ?? petName);
  const h = t.headline[reason === 'premium_item' ? 'generic' : reason];
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
  const chosen = plan ?? data?.defaultPlan ?? 'yearly';
  const buy = usePurchase();
  const restore = useRestore();
  const [status, setStatus] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(null);
  const sub = data?.subscription;
  const isMember = member || !!sub?.plus;

  const byId = useMemo(() => new Map((store.data ?? []).map((p) => [p.productId, p])), [store.data]);
  const highlight = REASON_PERK[reason];
  // Libellés courts de l'app (une ligne chacun) ; la phrase de l'API reste pour un avantage que l'app ne connaît pas.
  const short = t.perks(pet.name) as Partial<Record<string, readonly string[]>>;
  const perks = (data?.perks ?? []).flatMap((p) =>
    (short[p.key] ?? [p.label]).map((label, i) => ({ key: `${p.key}:${i}`, label, highlight: p.key === highlight })),
  );
  // Trois avantages d'abord (celui de la raison en tête, puis les plus parlants) ; les autres se déplient sur place.
  const rank = (key: string) => {
    const i = PERK_ORDER.indexOf(key.split(':')[0] as PlusPerk);
    // Une ligne par avantage d'abord (la seconde ligne de la carte, « Changer de ville », passe après).
    return Number(key.split(':')[1] ?? 0) * 100 + (i < 0 ? PERK_ORDER.length : i);
  };
  perks.sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight) || rank(a.key) - rank(b.key));

  const views: PlusOfferView<PlanDto>[] = offers.map((o) => {
    const s = byId.get(o.productId);
    const prices = offerPrices(o, s);
    const eligible = o.trialDays > 0 && (s?.introEligible ?? data?.trial.eligible ?? true);
    const name = o.period === 'year' ? t.plan.yearly : t.plan.monthly;
    return {
      key: o.plan,
      lead: eligible ? t.lead.trial(name, o.trialDays) : o.trialDays > 0 ? name : t.lead.noTrial(name),
      price: prices.price,
      perMonth: prices.perMonth,
      badge: o.discountPercent ? t.badge(o.discountPercent) : null,
      short: o.trialDays > 0 ? name : t.lead.noTrial(name),
      timeline: eligible && data ? data.trial.timeline.map((step, i) => ({ title: step.title, text: t.timeline[i] ?? step.text })) : null,
    };
  });
  const current = offers.find((o) => o.plan === chosen);
  const currentView = views.find((v) => v.key === chosen);
  const trialing = !!currentView?.timeline;

  const cta = !purchases.available
    ? t.cta.unavailable
    : trialing && current
      ? t.cta.trial(current.trialDays)
      : t.cta.subscribe(currentView?.price ?? '');

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

  const legal = data?.legal;
  const teaserCount = data?.teaser.compatibleNearby ?? 0;
  return (
    <SheetTemplate asScreen bare visible onClose={onClose} closeLabel={common.close}>
      <PlusTemplate
        onClose={onClose}
        closeLabel={common.close}
        brand={t.brand}
        headline={headlineFor(reason, pet.name, item)}
        pet={{ species: pet.species, outfit: pet.outfit ?? undefined, name: pet.name }}
        floatingItems={floatingFor(item)}
        teaser={teaserCount > 0 && data?.teaser.label ? { label: data.teaser.label, species: TEASER_SPECIES } : null}
        perks={perks.length ? perks : t.perksFallback.map((label, i) => ({ key: String(i), label }))}
        perksShown={PERKS_SHOWN}
        morePerksLabel={t.morePerks(Math.max(0, (perks.length || t.perksFallback.length) - PERKS_SHOWN))}
        offers={views}
        selected={chosen}
        onSelect={(k) => {
          setPlan(k);
          setStatus(null);
        }}
        offersLabel={t.offersLabel}
        ctaLabel={paywall.isError ? undefined : cta}
        onCta={purchases.available && current && !buy.isPending ? doBuy : undefined}
        ctaDisabled={!purchases.available || !current}
        ctaLoading={buy.isPending || paywall.isLoading}
        status={
          status ??
          (paywall.isError
            ? { tone: 'error', text: t.status.loadError }
            : !purchases.available && data
              ? { tone: 'info', text: t.status.unavailable }
              : purchases.simulated && data && !isMember
                ? { tone: 'info', text: t.status.simulated }
                : null)
        }
        member={
          isMember
            ? { title: t.member.title, summary: sub?.summary ?? t.member.fallback, manageLabel: sub?.store === 'apple' || purchases.available ? t.member.manage : undefined, onManage: () => void manage() }
            : null
        }
        continueLabel={isMember ? common.close : (data?.continueFreeLabel ?? t.continueFree)}
        onContinue={onContinue}
        renewalNotice={isMember ? null : (data?.renewalNotice ?? null)}
        restoreLabel={data?.restoreLabel ?? t.restore}
        onRestore={purchases.available ? doRestore : undefined}
        restoreLoading={restore.isPending}
        links={
          legal
            ? [
                { label: t.links.terms, onPress: () => void Linking.openURL(legal.termsUrl) },
                { label: t.links.privacy, onPress: () => void Linking.openURL(legal.privacyUrl) },
              ]
            : []
        }
        moreLinks={legal ? [{ label: t.links.plusTerms, onPress: () => void Linking.openURL(legal.plusTermsUrl) }] : []}
        ctaNote={isMember || !currentView ? null : trialing ? t.ctaNote.trial(currentView.price) : t.ctaNote.plain(currentView.price)}
      />
    </SheetTemplate>
  );
}
