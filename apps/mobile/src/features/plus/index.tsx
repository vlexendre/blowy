/**
 * Blowy+ : présentation de l'offre, partagée par le paywall de l'inscription et l'écran « Moi › Blowy+ ».
 * Toujours en feuille qui monte du bas, hors de la navigation (route en modale transparente) : croix, glisser vers le
 * bas ou toucher le voile la ferment. En bas : « restaurer mes achats », conditions et confidentialité (Apple).
 * Les achats ne sont pas branchés dans cette version (`purchases.available` faux) : rien n'est vendu,
 * le bouton principal reste désactivé et l'écran propose de continuer gratuitement.
 */
import { OFFERS, type Plan, monthlyEquivalentMinor, yearlyDiscountPercent, type Species } from '@blowy/domain';
import { PlusTemplate, SheetTemplate } from '@blowy/ui';
import { useState } from 'react';
import { Linking } from 'react-native';

import { config, usePorts } from '@/core';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';
import { formatPrice } from '@/locales/runtime';

const t = onboarding.plus;
type PlanKey = Plan;
const PLAN_ORDER: readonly PlanKey[] = ['yearly', 'monthly'];

/**
 * Prix indicatifs de Blowy+ (`OFFERS` du domaine), mis en forme dans la langue et la région du téléphone.
 * Quand les achats seront branchés, ces montants viendront du magasin (prix localisés), jamais d'une phrase.
 */
export function plusPrices(plan: PlanKey = 'yearly'): { total: string; perMonth: string } {
  const o = OFFERS[plan];
  return { total: formatPrice(o.amountMinor, o.currency), perMonth: formatPrice(monthlyEquivalentMinor(o), o.currency) };
}

/** Les offres telles que le paywall les montre. */
const plans = () =>
  PLAN_ORDER.map((key) => {
    const prices = plusPrices(key);
    const words = t.plans[key];
    return {
      key,
      title: words.title,
      price: prices.perMonth,
      unit: words.unit,
      caption: words.caption(prices.total),
      ...('badge' in words ? { badge: words.badge(yearlyDiscountPercent()) } : {}),
    };
  });

export interface PlusOfferProps {
  pet: { name: string; species: Species };
  /** Déjà membre : on remercie au lieu de présenter l'offre. */
  member?: boolean;
  onClose: () => void;
  /** Action « continuer gratuitement » (le paywall mène aux onglets, Moi revient en arrière). */
  onContinue: () => void;
}

export function PlusOffer({ pet, member = false, onClose, onContinue }: PlusOfferProps) {
  const { purchases } = usePorts();
  const [plan, setPlan] = useState<PlanKey>('yearly');
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreNote, setRestoreNote] = useState<string | undefined>();

  const restore = async () => {
    setRestoring(true);
    setRestoreNote(undefined);
    try {
      if (await purchases.restore()) onContinue();
      else setRestoreNote(t.restoreNone);
    } catch {
      setRestoreNote(t.restoreError);
    } finally {
      setRestoring(false);
    }
  };
  const legal = onboarding.compte;

  const buy = async () => {
    setBuying(true);
    try {
      if (await purchases.purchase(plan)) onContinue();
    } finally {
      setBuying(false);
    }
  };

  return (
    <SheetTemplate asScreen bare visible onClose={onClose} closeLabel={common.close}>
    <PlusTemplate
      sticker={t.sticker}
      onClose={onClose}
      closeLabel={common.close}
      brand={t.brand}
      subtitle={t.subtitle(pet.name)}
      species={pet.species}
      features={t.features.map((f) => ({ icon: f.icon, title: typeof f.title === 'function' ? f.title(pet.name) : f.title, text: f.text }))}
      plans={plans()}
      plan={plan}
      onPlan={setPlan}
      free={t.free}
      ctaLabel={member ? t.member : t.cta}
      onCta={purchases.available && !member ? () => void buy() : undefined}
      ctaDisabled={!purchases.available || member}
      ctaLoading={buying}
      ctaHint={purchases.available ? undefined : t.soon}
      note={member ? undefined : purchases.available ? t.renewal[plan](plusPrices(plan).total) : t.soon}
      secondaryLabel={t.continueFree}
      onSecondary={onContinue}
      restoreLabel={t.restore}
      onRestore={() => void restore()}
      restoreLoading={restoring}
      restoreNote={restoreNote}
      links={[
        { label: legal.legalTerms, onPress: () => void Linking.openURL(`${config.webUrl}/conditions`) },
        { label: legal.legalPrivacy, onPress: () => void Linking.openURL(`${config.webUrl}/confidentialite`) },
      ]}
    />
    </SheetTemplate>
  );
}
