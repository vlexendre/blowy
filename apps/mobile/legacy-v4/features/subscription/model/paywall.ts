/**
 * Adaptation pure PaywallSelection (agent G) → lignes affichables. Les prix sont les chaînes
 * localisées du store ; une offre d'essai/introductive n'est mentionnée que si le store la
 * déclare (éligibilité). En LOCAL_DEMO, aucun prix : la mention « Démo locale » le remplace.
 */
import type { IntegrationMode } from '@blowy/api-contract';
import type { PaywallPackage } from '@blowy/ui-mobile';
import type { PaywallSelection, StorePackage } from '../../purchases';
import { t, tDynamic } from '../../../i18n';

/** Durée ISO 8601 du store (P3D, P1M, P1Y…) → texte court. */
export function isoPeriodLabel(iso: string): string {
  const m = /^P(\d+)([DWMY])$/.exec(iso);
  if (!m) return iso;
  const n = Number(m[1]);
  const unit = { D: n > 1 ? 'jours' : 'jour', W: n > 1 ? 'semaines' : 'semaine', M: 'mois', Y: n > 1 ? 'ans' : 'an' }[m[2] as 'D' | 'W' | 'M' | 'Y'];
  return `${n} ${unit}`;
}

export function packageLine(pkg: StorePackage, mode: IntegrationMode): PaywallPackage {
  const priceLine = mode === 'LOCAL_DEMO' || !pkg.priceString ? t('common.demoMode') : pkg.pricePerMonthString && pkg.period === 'ANNUAL' ? `${pkg.priceString} · ${t('onboarding.paywall.perMonth', { price: pkg.pricePerMonthString })}` : pkg.priceString;
  const intro = pkg.introOffer
    ? pkg.introOffer.kind === 'FREE_TRIAL'
      ? t('onboarding.paywall.trialLine', { period: isoPeriodLabel(pkg.introOffer.period), price: pkg.priceString || t('common.demoMode') })
      : t('onboarding.paywall.introLine', { price: pkg.introOffer.priceString, period: isoPeriodLabel(pkg.introOffer.period) })
    : null;
  return { id: pkg.id, title: tDynamic(`onboarding.paywall.period.${pkg.period}`), priceLine, introLine: mode === 'LOCAL_DEMO' ? null : intro };
}

export function paywallPackages(sel: PaywallSelection | null, mode: IntegrationMode): { packages: PaywallPackage[]; byId: Map<string, StorePackage> } {
  const list = [sel?.annual, sel?.monthly, sel?.weekly].filter((p): p is StorePackage => !!p);
  return { packages: list.map((p) => packageLine(p, mode)), byId: new Map(list.map((p) => [p.id, p])) };
}
