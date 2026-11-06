/** Navigation d'onboarding : enregistre l'étape (reprise) puis pousse la route suivante. */
import { router } from 'expo-router';
import { useCallback } from 'react';
import { paths } from '../../../core/navigation/paths';
import { ONBOARDING_STEPS, nextStep, stepIndex, type OnboardingStep } from '../model/flow';
import { useOnboarding } from '../model/store';
import { t } from '../../../i18n';

export const routeFor = (s: OnboardingStep): string => (s === 'school' || s === 'sunday' || s === 'passions' || s === 'limit' ? paths.vision(s) : paths.onboarding(s));

/** Étapes comptées dans l'indicateur (hors accueil). */
const COUNTED = ONBOARDING_STEPS.slice(1);

export function useOnboardingNav(current: OnboardingStep) {
  const patch = useOnboarding((s) => s.patch);
  const go = useCallback(
    (to: OnboardingStep) => {
      patch({ step: to });
      router.push(routeFor(to) as never);
    },
    [patch],
  );
  const next = useCallback(() => {
    const n = nextStep(current);
    if (n) go(n);
  }, [current, go]);
  const back = useCallback(() => (router.canGoBack() ? router.back() : undefined), []);
  const idx = Math.max(0, stepIndex(current) - 1);
  return {
    go,
    next,
    back,
    backLabel: t('common.back'),
    step: { index: idx, count: COUNTED.length, label: t('onboarding.stepOf', { index: idx + 1, count: COUNTED.length }) },
  };
}
