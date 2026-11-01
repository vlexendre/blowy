/** Racine : polices, providers, pile principale (onboarding séparé, onglets, modales). */
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { color } from '@blowy/ui-mobile';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { AppProviders } from '../src/core/providers/AppProviders';
import { DeepLinkHandler } from '../src/core/navigation/DeepLinkHandler';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BricolageGrotesque_800ExtraBold, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  if (fontsLoaded && ready) void SplashScreen.hideAsync();
  return (
    <AppProviders onReady={onReady}>
      <StatusBar style="dark" />
      <DeepLinkHandler />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
