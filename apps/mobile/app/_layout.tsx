/** Racine : polices, providers, pile principale (onboarding séparé, onglets, modales). */
import { color } from '@blowy/ui-mobile';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { AppProviders } from '../src/core/providers/AppProviders';
import { DeepLinkHandler } from '../src/core/navigation/DeepLinkHandler';
import { FONT_FILES } from '../src/core/fonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_FILES);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  if (fontsLoaded && ready) void SplashScreen.hideAsync();
  return (
    <AppProviders onReady={onReady}>
      <StatusBar style="dark" />
      <DeepLinkHandler />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream }, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(dev)" />
      </Stack>
    </AppProviders>
  );
}
