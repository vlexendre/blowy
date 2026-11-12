import { color } from '@blowy/tokens';
import { Stack } from 'expo-router';

/** Un lien profond vers les options, les niveaux ou le signalement garde le lien en dessous. */
export const unstable_settings = { initialRouteName: 'index' };

/** Pile d'un lien : le lien, ses niveaux, le signalement, et les options en feuille posée sur le lien (V6-LienOptions). */
export default function LinkLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="niveaux" />
      <Stack.Screen name="signaler" />
      <Stack.Screen name="options" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
    </Stack>
  );
}
