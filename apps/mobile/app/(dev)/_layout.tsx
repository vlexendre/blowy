/** Routes internes de développement : servies uniquement si EXPO_PUBLIC_BLOWY_ENV=local. */
import { color } from '@blowy/ui-mobile';
import { Redirect, Stack } from 'expo-router';
import { devRoutesEnabled } from '../../src/features/dev';

export default function DevLayout() {
  if (!devRoutesEnabled) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />;
}
