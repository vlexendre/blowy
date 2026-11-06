import { INTENTIONS } from '@blowy/domain';
import { Banner, OnboardingStepTemplate, OptionCard, space } from '@blowy/ui-mobile';
import { View } from 'react-native';
import { t, tDynamic } from '../../../i18n';
import { canContinue } from '../model/flow';
import { useOnboarding } from '../model/store';
import { useOnboardingNav } from './useOnboardingNav';

/** Intention privée (V4-Intention) : jamais exposée ; seul un vote mutuel ultérieur ouvre Plus. */
export function IntentionScreen() {
  const d = useOnboarding();
  const nav = useOnboardingNav('intention');
  return (
    <OnboardingStepTemplate
      testID="screen-intention"
      step={nav.step}
      onBack={nav.back}
      backLabel={nav.backLabel}
      eyebrow={t('onboarding.intention.eyebrow')}
      title={t('onboarding.intention.title')}
      cta={{ label: t('common.continue'), onPress: nav.next, disabled: !canContinue(d, 'intention'), testID: 'intention-continue' }}
    >
      <Banner message={t('onboarding.intention.secret')} icon="lock" tone="violet" />
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {INTENTIONS.map((i) => (
          <OptionCard
            key={i}
            title={tDynamic(`onboarding.intention.${i}.title`)}
            subtitle={tDynamic(`onboarding.intention.${i}.sub`)}
            selected={d.intention === i}
            onPress={() => d.patch({ intention: i })}
            testID={`intention-${i}`}
          />
        ))}
      </View>
    </OnboardingStepTemplate>
  );
}
