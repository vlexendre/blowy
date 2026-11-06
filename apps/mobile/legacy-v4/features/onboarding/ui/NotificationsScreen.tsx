/**
 * Permission notifications (V4-Notifs) au moment utile, après la première activation.
 * Aucune promesse « Suzie va répondre » sans événement : texte générique. Refus = alternative.
 */
import { Banner, OnboardingStepTemplate, PetRenderer } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { paths } from '../../../core/navigation/paths';
import { useServices } from '../../../core/providers/services';
import { t } from '../../../i18n';
import { useAccountRepository, useCompleteOnboarding } from '../../account';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

export function NotificationsScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('notifications');
  const { notifications, newCommandId } = useServices();
  const repo = useAccountRepository();
  const complete = useCompleteOnboarding();
  const [denied, setDenied] = useState(false);

  const finish = async () => {
    d.patch({ notificationsAsked: true, completed: true });
    await complete.mutateAsync().catch(() => undefined);
    router.replace(paths.nest);
  };

  const allow = async () => {
    const p = await notifications.requestPermission();
    if (p === 'granted') {
      const token = await notifications.getPushToken();
      if (token) await repo.registerDevice(newCommandId(), token).catch(() => undefined);
      await finish();
    } else setDenied(true);
  };

  return (
    <OnboardingStepTemplate
      testID="screen-notifications"
      step={nav.step}
      eyebrow={t('onboarding.notifications.eyebrow')}
      title={t('onboarding.notifications.title')}
      lead={t('onboarding.notifications.lead')}
      illustration={<PetRenderer species={d.species} stage="YOUNG" pose="SURPRISED" bodyHeight={150} accessibilityLabel={d.petName} />}
      banner={denied ? <Banner message={t('onboarding.notifications.denied')} live /> : null}
      cta={denied ? { label: t('common.continue'), onPress: finish, testID: 'notif-continue' } : { label: t('onboarding.notifications.allow'), onPress: allow, testID: 'notif-allow' }}
      secondary={denied ? undefined : { label: t('common.later'), onPress: finish, testID: 'notif-later' }}
    />
  );
}
