/**
 * Abonnement (V4-Abonnement) : état décidé par le serveur, restauration, gestion dans le store
 * (aucune fausse annulation). Achat via le PaywallPanel partagé.
 */
import { Banner, Button, DetailScreenTemplate, KeyValue, StatusPill, Surface, space } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { Linking, Platform, View } from 'react-native';
import { formatDate, t } from '../../../i18n';
import { useEntitlements, usePurchases } from '../../purchases';
import { PaywallPanel, PurchasesUnavailable } from './PaywallPanel';
import { usePurchasesAvailable } from '../model/usePurchasesAvailable';

const STORE_MANAGE_URL = Platform.select({ ios: 'https://apps.apple.com/account/subscriptions', android: 'https://play.google.com/store/account/subscriptions', default: '' });

function SubscriptionBody() {
  const { subscription } = useEntitlements();
  const purchases = usePurchases();
  const active = subscription && ['TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY'].includes(subscription.state);
  return (
    <View style={{ gap: space.md }}>
      {subscription?.mode === 'LOCAL_DEMO' ? <Banner message={t('common.demoMode')} tone="violet" icon="flag" /> : null}
      <Surface style={{ gap: space.xs }}>
        <StatusPill kind={active ? 'confirmed' : 'info'} label={active ? t('subscription.active') : t('subscription.none')} />
        {subscription?.store ? <KeyValue label={t('subscription.source', { source: '' }).replace(/\s*:\s*$/, '')} value={subscription.store} /> : null}
        {subscription?.currentPeriodEndsAt ? <KeyValue label={t('subscription.until', { date: '' }).trim()} value={formatDate(subscription.currentPeriodEndsAt)} /> : null}
      </Surface>
      {active ? (
        <>
          <Banner message={t('subscription.cancelInfo')} tone="cream" icon="warning" />
          {STORE_MANAGE_URL ? <Button label={t('subscription.manageStore')} variant="secondary" onPress={() => void Linking.openURL(STORE_MANAGE_URL)} /> : null}
          <Button label={t('subscription.restore')} variant="ghost" onPress={() => void purchases.restore()} loading={purchases.isRestoring} />
        </>
      ) : (
        <PaywallPanel onDone={() => undefined} onContinueFree={() => router.back()} />
      )}
    </View>
  );
}

export function SubscriptionScreen() {
  const available = usePurchasesAvailable();
  return (
    <DetailScreenTemplate title={t('subscription.title')} onBack={() => router.back()} backLabel={t('common.back')} testID="screen-subscription">
      {available ? <SubscriptionBody /> : <PurchasesUnavailable onContinueFree={() => router.back()} />}
    </DetailScreenTemplate>
  );
}
