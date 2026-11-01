/**
 * Panneau paywall réutilisé par l'onboarding (étape paywall), la modale /paywall et l'écran
 * Abonnement. Consomme uniquement les hooks de la feature achats (agent G).
 */
import { PaywallOffer, UnavailableState } from '@blowy/ui-mobile';
import { useMemo, useState } from 'react';
import { t } from '../../../i18n';
import { useOfferings, usePurchases } from '../../purchases';
import { paywallPackages } from '../model/paywall';

export interface PaywallPanelProps {
  onDone: () => void;
  onContinueFree: () => void;
}

export function PaywallPanel({ onDone, onContinueFree }: PaywallPanelProps) {
  const { offerings, paywall, isLoading } = useOfferings();
  const purchases = usePurchases();
  const mode = offerings?.mode ?? purchases.mode;
  const { packages, byId } = useMemo(() => paywallPackages(paywall, mode), [paywall, mode]);
  const [selected, setSelected] = useState<string | null>(null);
  const sel = selected ?? packages[0]?.id ?? null;

  const buy = async () => {
    const pkg = sel ? byId.get(sel) : undefined;
    if (!pkg) return;
    const r = await purchases.purchase(pkg);
    if (r.status === 'PURCHASED' || r.status === 'PENDING') onDone();
  };

  return (
    <PaywallOffer
      packages={packages}
      selectedId={sel}
      onSelect={setSelected}
      ctaLabel={t('onboarding.paywall.cta')}
      onPurchase={buy}
      purchasing={purchases.isPurchasing || isLoading}
      continueFreeLabel={t('onboarding.paywall.continueFree')}
      onContinueFree={onContinueFree}
      restoreLabel={t('onboarding.paywall.restore')}
      onRestore={() => void purchases.restore().then(onDone)}
      legalText={t('onboarding.paywall.legal')}
      demoNotice={mode === 'LOCAL_DEMO' ? t('common.demoMode') : null}
      emptyText={isLoading ? t('common.loading') : t('onboarding.paywall.noOfferings')}
    />
  );
}

/** Repli quand aucun adaptateur d'achat n'est disponible (production sans clé). */
export function PurchasesUnavailable({ onContinueFree }: { onContinueFree: () => void }) {
  return <UnavailableState title={t('common.unavailableTitle')} message={t('onboarding.paywall.unavailable')} actionLabel={t('onboarding.paywall.continueFree')} onAction={onContinueFree} />;
}
