import { SCENES } from '@blowy/sprites';
import { Banner, OnboardingStepTemplate, Sprite, space } from '@blowy/ui-mobile';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useServices } from '../../../core/providers/services';
import { t } from '../../../i18n';
import { INVITE_STORAGE_KEY, parseInviteCode } from '../../social';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

/**
 * Accueil par invitation (V4-Invite). L'identité publique du parrain vient du serveur
 * (GET /v1/referrals/:code, non livré) : tant qu'elle n'est pas vérifiée, aucun prénom ni
 * montant n'est affiché. Le code est conservé localement jusqu'au claim après activation.
 */
export function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const parsed = parseInviteCode(code);
  const { storage } = useServices();
  const invite = useOnboarding((s) => s.invite);
  const patch = useOnboarding((s) => s.patch);
  const nav = useOnboardingNav('welcome');

  useEffect(() => {
    if (!parsed) return;
    void storage.setItem(INVITE_STORAGE_KEY, parsed);
    if (invite?.code !== parsed) patch({ invite: { code: parsed, inviterName: null, status: 'unverified' } });
  }, [parsed, storage, invite?.code, patch]);

  const name = invite?.status === 'valid' ? invite.inviterName : null;
  return (
    <OnboardingStepTemplate
      testID="screen-invite"
      eyebrow={name ? t('onboarding.invite.eyebrow', { name }) : undefined}
      title={name ? t('onboarding.invite.title', { name }) : t('onboarding.welcome.title')}
      lead={t('onboarding.invite.lead')}
      banner={!parsed ? <Banner message={t('onboarding.invite.invalid')} /> : name ? null : <Banner message={t('onboarding.invite.unavailable')} tone="cream" />}
      illustration={
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Sprite path={SCENES.HOUSE} size={150} accessibilityLabel={name ?? undefined} />
          <Sprite path={SCENES.HOUSE_EMPTY} size={150} />
        </View>
      }
      cta={{ label: t('onboarding.invite.cta'), onPress: () => nav.go('species') }}
    />
  );
}
