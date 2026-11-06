/** Onboarding V5 : pile sans en-tête, fond crème (aucun paywall, aucun compte à rebours). */
import { v5 } from '@blowy/ui-mobile';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: v5.cream } }} />;
}
