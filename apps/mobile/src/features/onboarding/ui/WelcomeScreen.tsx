import { Chip, OnboardingStepTemplate, PetRenderer, space } from '@blowy/ui-mobile';
import { View } from 'react-native';
import { t } from '../../../i18n';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

/** Accueil normal (maquette V4-Welcome). */
export function WelcomeScreen() {
  const nav = useOnboardingNav('welcome');
  const patch = useOnboarding((s) => s.patch);
  return (
    <OnboardingStepTemplate
      testID="screen-welcome"
      eyebrow={t('onboarding.welcome.eyebrow')}
      title={t('onboarding.welcome.title')}
      lead={t('onboarding.welcome.lead')}
      illustration={
        <View style={{ alignItems: 'center', gap: space.md }}>
          <PetRenderer species="NINO" stage="YOUNG" pose="JOYFUL" bodyHeight={180} accessibilityLabel={t('species.NINO')} />
          <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(['kindMischief', 'scienceArt', 'sportyContemplative'] as const).map((a) => (
              <Chip key={a} label={t(`vision.axis.${a}.left`)} size="sm" />
            ))}
          </View>
        </View>
      }
      cta={{ label: t('onboarding.welcome.cta'), onPress: () => nav.go('species'), testID: 'welcome-start' }}
      secondary={{
        label: t('onboarding.welcome.haveAccount'),
        onPress: () => {
          patch({ step: 'account' });
          nav.go('account');
        },
      }}
    />
  );
}

