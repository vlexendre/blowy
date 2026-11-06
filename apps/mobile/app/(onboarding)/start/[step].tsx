/** Étapes 1/9 → 9/9 : `/start/<étape>` (city, birthdate, gender, pet, meet, looking, consent, story, slots). */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { onboardingStepScreen } from '../../../src/features/onboarding';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const Screen = onboardingStepScreen(step);
  return Screen ? <Screen /> : <Redirect href="/welcome" />;
}
