import { color } from '@blowy/tokens';
import { Stack } from 'expo-router';

/** Parcours d'inscription : une pile sans en-tête (chaque écran a son propre retour). */
export default function OnboardingLayout() {
  return (
    // Plus de feuille Minimoa+ en fin d'inscription (19 nov. 2026) : « tout est prêt » mène à l'accueil.
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night }, animation: 'slide_from_right' }} />
  );
}
