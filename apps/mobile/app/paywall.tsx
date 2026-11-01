/** Paywall en modale (verrou 2e/3e rendez-vous, carte, indices). Continuer gratuitement = fermer. */
import { ModalSheetTemplate } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { PaywallPanel, PurchasesUnavailable, usePurchasesAvailable } from '../src/features/subscription';
import { t } from '../src/i18n';

export default function PaywallModal() {
  const available = usePurchasesAvailable();
  const close = () => router.back();
  return (
    <ModalSheetTemplate title={t('onboarding.paywall.titleGeneric')} lead={t('onboarding.paywall.free')} onClose={close} closeLabel={t('common.close')} testID="screen-paywall-modal">
      {available ? <PaywallPanel onDone={close} onContinueFree={close} /> : <PurchasesUnavailable onContinueFree={close} />}
    </ModalSheetTemplate>
  );
}
