import { color } from '@blowy/ui-mobile';
import { Stack } from 'expo-router';

/** Parcours d'onboarding séparé des onglets (pile dédiée, retour cohérent). */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream }, animation: 'slide_from_right' }} />;
}
