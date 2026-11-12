import { Anton_400Regular } from '@expo-google-fonts/anton';
import { BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { color } from '@blowy/tokens';
import { MotionHost } from '@blowy/ui';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CoreProvider } from '@/core';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsReady, fontError] = useFonts({ Anton_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });

  useEffect(() => {
    if (fontsReady || fontError) void SplashScreen.hideAsync();
  }, [fontsReady, fontError]);

  if (!fontsReady && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.night }}>
      <SafeAreaProvider>
        <CoreProvider>
          {/* Calque des animations (vols, explosions, pets qui passent la tête) + pause des boucles en arrière-plan. */}
          <MotionHost>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night }, animation: 'slide_from_right' }} />
          </MotionHost>
        </CoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
