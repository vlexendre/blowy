import { color } from '@blowy/tokens';
import { MotionHost } from '@blowy/ui';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CoreProvider, LocaleRoot } from '@/core';
import { UiStringsProvider } from '@blowy/ui';
import { ui } from '@/locales/ui';
import { SessionBridges } from '@/features/session';

void SplashScreen.preventAutoHideAsync();

/** Écran présenté en feuille : modale transparente, l'écran fait sa feuille lui-même (`SheetTemplate asScreen`). */
const SHEET = { presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const;

export default function RootLayout() {
  const [fontsReady, fontError] = useFonts({
    // Allo (SIL OFL 1.1, licence jointe dans assets/fonts/allo/OFL.txt).
    Allo_500Medium: require('../assets/fonts/allo/Allo-Medium.otf'),
    Allo_700Bold: require('../assets/fonts/allo/Allo-Bold.otf'),
    Allo_800ExtraBold: require('../assets/fonts/allo/Allo-ExtraBold.otf'),
  });

  useEffect(() => {
    if (fontsReady || fontError) void SplashScreen.hideAsync();
  }, [fontsReady, fontError]);

  if (!fontsReady && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.night }}>
      <SafeAreaProvider>
        <CoreProvider>
          {/* Calque des animations (vols, explosions, pets qui passent la tête) + pause des boucles en arrière-plan. */}
          {/* Langue du téléphone : à chaque changement, l'arbre est remonté et relit ses textes. */}
          <LocaleRoot>
            <UiStringsProvider value={ui}>
              <MotionHost>
                <StatusBar style="light" />
                {/* Compte suspendu, jeton de notifications, achats Minimoa+ arrivés hors d'un achat. */}
                <SessionBridges />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.night }, animation: 'slide_from_right' }}>
                  {/* Minimoa+ : feuille qui monte du bas par-dessus l'écran d'où on vient (Moi, garde-robe, carte). */}
                  <Stack.Screen name="moi/blowy-plus" options={SHEET} />
                  {/* Défi du jour : la carte monte en plein écran par-dessus l'accueil (elle fait sa montée elle-même). */}
                  <Stack.Screen name="pet/defi" options={SHEET} />
                  {/* Preuve en photo : plein écran qui monte du bas, hors des onglets. */}
                  <Stack.Screen name="pet/preuve" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                  {/* Avant la demande de notifications : plein écran, on n'en sort que par « Continuer » (HIG Privacy). */}
                  <Stack.Screen name="pet/notifications" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
                </Stack>
              </MotionHost>
            </UiStringsProvider>
          </LocaleRoot>
        </CoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
