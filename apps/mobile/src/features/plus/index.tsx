/**
 * Blowy+ : présentation de l'offre, partagée par le paywall de l'inscription et l'écran « Moi › Blowy+ ».
 * Les achats ne sont pas branchés dans cette version (`purchases.available` faux) : rien n'est vendu,
 * le bouton principal reste désactivé et l'écran propose de continuer gratuitement.
 */
import type { Species } from '@blowy/domain';
import { PlusTemplate } from '@blowy/ui';
import { useState } from 'react';

import { usePorts } from '@/core';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.plus;
type PlanKey = (typeof t.plans)[number]['key'];

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

  const buy = async () => {
    setBuying(true);
    try {
      if (await purchases.purchase(plan)) onContinue();
    } finally {
      setBuying(false);
    }
  };

  return (
    <PlusTemplate
      sticker={t.sticker}
      onClose={onClose}
      closeLabel={common.close}
      brand={t.brand}
      subtitle={t.subtitle(pet.name)}
      species={pet.species}
      features={t.features.map((f) => ({ icon: f.icon, title: typeof f.title === 'function' ? f.title(pet.name) : f.title, text: f.text }))}
      plans={t.plans}
      plan={plan}
      onPlan={setPlan}
      free={t.free}
      ctaLabel={member ? t.member : t.cta}
      onCta={purchases.available && !member ? () => void buy() : undefined}
      ctaDisabled={!purchases.available || member}
      ctaLoading={buying}
      ctaHint={purchases.available ? undefined : t.soon}
      note={member ? undefined : purchases.available ? t.renewal[plan] : t.soon}
      secondaryLabel={t.continueFree}
      onSecondary={onContinue}
    />
  );
}
