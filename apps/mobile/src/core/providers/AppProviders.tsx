/**
 * Composition racine des providers (une seule fois, dans app/_layout.tsx) :
 * zones sûres → gestes → a11y → sprites → services (DI) → TanStack Query → temps réel →
 * bootstrap (RevenueCat retiré en V5.4 : Blowy+ passe par Stripe) (hydratation file/onboarding/session, senders, réseau).
 */
import { A11yPrefsProvider, LoadingState, SpriteSourceProvider } from '@blowy/ui-mobile';
import { t } from '../../i18n';
import { ASSET_SOURCES } from '@blowy/sprites/sources';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMessageSender } from '../../features/conversations';
import { useOnboarding } from '../../features/onboarding';
import { useTrustSenders } from '../../features/trust';
import { useDevicePrefs } from '../../features/settings';
import { createQueryClient } from '../api/query';
import { useNetwork, isOnlineNow } from '../network/network';
import { drainQueue } from '../offline/runner';
import { useOfflineQueue } from '../offline/store';
import { RealtimeProvider } from '../realtime/provider';
import { useSession } from '../session/session-store';
import { ServicesProvider, useServices } from './services';

function Bootstrap({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  const { storage, secrets, demo } = useServices();
  useMessageSender();
  useTrustSenders();

  useEffect(() => {
    void Promise.all([
      useSession.getState().restore(secrets),
      useOfflineQueue.getState().hydrate(storage),
      useOnboarding.getState().hydrate(storage),
      useDevicePrefs.getState().hydrate(storage),
    ]).then(() => {
      // Mode démo local : brouillon d'onboarding de la maquette (jamais hors `local`).
      if (demo?.draft) useOnboarding.getState().patch(demo.draft);
      if (demo?.devicePrefs) useDevicePrefs.getState().set(demo.devicePrefs);
      onReady();
      void drainQueue(isOnlineNow);
    });
    const stopNet = useNetwork.getState().start(() => void drainQueue(isOnlineNow));
    // Réveil périodique pour les commandes en backoff.
    const timer = setInterval(() => void drainQueue(isOnlineNow), 15_000);
    return () => {
      stopNet();
      clearInterval(timer);
    };
  }, [storage, secrets, onReady, demo]);

  return <SessionGate>{children}</SessionGate>;
}

/**
 * Aucun écran (donc aucune requête) avant la restauration de la session : une ouverture à froid
 * sur une route profonde ne part plus sans jeton (correctif T7, voir session-store).
 */
function SessionGate({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status);
  if (status === 'unknown') return <LoadingState label={t('common.loading')} />;
  return <>{children}</>;
}

export function AppProviders({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <A11yPrefsProvider>
          <SpriteSourceProvider sources={ASSET_SOURCES}>
            <ServicesProvider>
              <QueryClientProvider client={queryClient}>
                <RealtimeProvider>
                  <Bootstrap onReady={onReady}>{children}</Bootstrap>
                </RealtimeProvider>
              </QueryClientProvider>
            </ServicesProvider>
          </SpriteSourceProvider>
        </A11yPrefsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
