import { color } from '@blowy/ui-mobile';
import { Stack } from 'expo-router';

/** Pile propre à l'onglet (profondeur 2–3 niveaux, retour cohérent). */
export default function TabStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />;
}
