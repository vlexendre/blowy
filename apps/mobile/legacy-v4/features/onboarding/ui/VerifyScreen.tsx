/**
 * Vérification selfie (V4-Verif) : demande caméra au moment utile, POST /v1/verifications,
 * états NOT_STARTED/PENDING/NEEDS_RETRY/HUMAN_REVIEW/VERIFIED/REJECTED/EXPIRED lus du serveur.
 * Un badge LOCAL_DEMO est étiqueté comme tel (jamais « majorité vérifiée »).
 */
import { ICONS } from '@blowy/sprites';
import { Banner, Button, KeyValue, OnboardingStepTemplate, Sprite, StatusPill, Surface, space } from '@blowy/ui-mobile';
import { useState } from 'react';
import { View } from 'react-native';
import { useServices } from '../../../core/providers/services';
import { t, tDynamic } from '../../../i18n';
import { useMe, useStartVerification } from '../../account';
import { useOnboardingNav } from './useOnboardingNav';

export function VerifyScreen() {
  const nav = useOnboardingNav('verify');
  const { camera } = useServices();
  const me = useMe();
  const start = useStartVerification();
  const [denied, setDenied] = useState(false);
  const v = me.data?.verification;
  const status = v?.status ?? 'NOT_STARTED';
  const canStart = status === 'NOT_STARTED' || status === 'NEEDS_RETRY' || status === 'EXPIRED';

  const launch = async () => {
    const perm = await camera.request();
    if (perm !== 'granted') return setDenied(true);
    setDenied(false);
    // La capture/upload du selfie (fournisseur Veriff, agent E) remplacera cet appel direct.
    await start.mutateAsync();
    await me.refetch();
  };

  const kind = status === 'VERIFIED' ? 'confirmed' : status === 'REJECTED' ? 'failed' : status === 'NOT_STARTED' ? 'info' : 'pending';
  return (
    <OnboardingStepTemplate
      testID="screen-verify"
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={t('onboarding.verify.eyebrow')}
      title={t('onboarding.verify.title')}
      lead={t('onboarding.verify.lead')}
      banner={denied ? <Banner message={t('onboarding.verify.cameraDenied')} actionLabel={t('onboarding.verify.openSettings')} onAction={() => void camera.openSettings()} live /> : null}
      cta={canStart ? { label: t('onboarding.verify.start'), onPress: launch, loading: start.isPending, testID: 'verify-start' } : { label: t('common.continue'), onPress: nav.next, testID: 'verify-continue' }}
      secondary={canStart ? { label: t('onboarding.verify.skip'), onPress: nav.next, testID: 'verify-skip' } : undefined}
    >
      <Surface style={{ gap: space.sm }}>
        <StatusPill kind={kind} label={tDynamic(`onboarding.verify.status.${status}`)} />
        {v?.provenance === 'LOCAL_DEMO' || v?.mode === 'LOCAL_DEMO' ? <StatusPill kind="demo" label={t('onboarding.verify.demoBadge')} /> : null}
      </Surface>
      <Surface style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Sprite path={ICONS.hiddenPhoto} size={56} />
        <View style={{ flex: 1 }}>
          <KeyValue label={t('onboarding.verify.photos')} value={t('onboarding.verify.photosHidden')} />
        </View>
      </Surface>
      {canStart ? <Banner message={t('onboarding.verify.skipNote')} tone="cream" icon="shield" /> : null}
      {status === 'HUMAN_REVIEW' || status === 'PENDING' ? <Button label={t('common.retry')} variant="ghost" onPress={() => void me.refetch()} /> : null}
    </OnboardingStepTemplate>
  );
}
