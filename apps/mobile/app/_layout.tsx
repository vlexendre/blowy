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
import { AppUpdateBridge } from '@/features/app-update';
import { init } from '@amplitude/analytics-react-native';
import { analyticsConsentLoaded } from '@/features/analytics';

void SplashScreen.preventAutoHideAsync();

// Statistiques d'usage (Amplitude) : initialisé une fois, mais rien ne part sans l'accord (`optOut` tant qu'il manque).
const amplitudeKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
if (!amplitudeKey) {
  console.error('[amplitude] EXPO_PUBLIC_AMPLITUDE_API_KEY is not set — no events will be sent');
} else {
  void analyticsConsentLoaded().then((granted) => {
    // serverZone is 'US' by default; pass 'EU' only for EU-residency projects.
    // Second arg is userId — use undefined when unknown; do NOT pass the options object here.
    // Ni adresse IP ni localisation : sans `ipAddress`, le SDK n'ajoute plus `ip: '$remote'` à l'événement, et Amplitude
    // ne déduit ni ville, ni région, ni pays, ni DMA ; `country` (région du téléphone) et `carrier` (opérateur) coupés
    // aussi, comme les identifiants publicitaires (`adid`, `appSetId`).
    init(amplitudeKey, undefined, {
      serverZone: 'US',
      optOut: !granted,
      trackingOptions: { ipAddress: false, country: false, carrier: false, adid: false, appSetId: false },
    });
  });
}

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
                  {/* Avant la demande de notifications : plein écran, on n'en sort que par « Continuer » (HIG Privacy). */}
                  <Stack.Screen name="pet/notifications" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
                  {/* Build plus servi par l'API : on n'en sort qu'après la mise à jour (docs/VERSIONING.md). */}
                  <Stack.Screen name="mise-a-jour" options={{ gestureEnabled: false, animation: 'fade' }} />
                </Stack>
                {/* Écran « Mets à jour Minimoa » quand ce build n'est plus servi ; bandeau quand une version plus récente est publiée. */}
                <AppUpdateBridge />
              </MotionHost>
            </UiStringsProvider>
          </LocaleRoot>
        </CoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
