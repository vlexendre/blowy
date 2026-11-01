/**
 * Paywall d'onboarding (V4-Paywall) : titre honnête (P-5.10), avantages, offres du store,
 * continuer gratuitement toujours visible. Espèce premium refusée → repli Gaston/Nino annoncé.
 */
import { Banner, ListRow, OnboardingStepTemplate, Surface } from '@blowy/ui-mobile';
import { t, tDynamic } from '../../../i18n';
import { paywallHeadline, useMatchFeed } from '../../matching';
import { speciesName } from '../../pets';
import { PaywallPanel, PurchasesUnavailable, usePurchasesAvailable } from '../../subscription';
import { fallbackSpecies, isPremium } from '../model/flow';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

const BENEFITS = ['dates', 'map', 'freeze', 'partner'] as const;

export function PaywallStepScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('paywall');
  const available = usePurchasesAvailable();
  const feed = useMatchFeed();
  const head = paywallHeadline(feed.data);
  const title = head.kind === 'discover' ? t('onboarding.paywall.titleDiscover', { count: head.count }) : t('onboarding.paywall.titleGeneric');

  const continueFree = () => {
    if (isPremium(d.species)) d.patch({ premiumDeclined: true, species: fallbackSpecies(d.species) });
    nav.next();
  };

  return (
    <OnboardingStepTemplate
      testID="screen-paywall"
      step={nav.step}
      title={title}
      lead={t('onboarding.paywall.free')}
      banner={isPremium(d.species) ? <Banner message={t('onboarding.paywall.premiumFallback', { species: speciesName(d.species) })} tone="violet" icon="star" /> : null}
      cta={{ label: t('onboarding.paywall.continueFree'), onPress: continueFree, testID: 'paywall-skip' }}
    >
      <Surface padding="sm">
        {BENEFITS.map((b) => (
          <ListRow key={b} icon="check" title={tDynamic(`onboarding.paywall.benefits.${b}`)} />
        ))}
      </Surface>
      {available ? <PaywallPanel onDone={nav.next} onContinueFree={continueFree} /> : <PurchasesUnavailable onContinueFree={continueFree} />}
    </OnboardingStepTemplate>
  );
}
