import { color } from '@blowy/tokens';
import { Stack } from 'expo-router';

/** Parcours d'inscription : une pile sans en-tête (chaque écran a son propre retour). */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night }, animation: 'slide_from_right' }}>
      {/* Minimoa+ en fin d'inscription : feuille qui monte du bas par-dessus « tout est prêt » (on la ferme vers l'app). */}
      <Stack.Screen name="paywall" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
    </Stack>
  );
}
