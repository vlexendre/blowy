/**
 * Composition racine des providers (une seule fois, dans app/_layout.tsx) :
 * zones sûres → gestes → a11y → sprites → services (DI) → TanStack Query → temps réel →
 * achats (agent G) → bootstrap (hydratation file/onboarding/session, senders, réseau).
 */
import { A11yPrefsProvider, SpriteSourceProvider } from '@blowy/ui-mobile';
import { ASSET_SOURCES } from '@blowy/sprites/sources';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createPurchasesApi, PurchasesProvider, selectPurchasesAdapter } from '../../features/purchases';
import { useMessageSender } from '../../features/conversations';
import { useOnboarding } from '../../features/onboarding/model/store';
import { usePetActionSender } from '../../features/pets';
import { useTrustSenders } from '../../features/trust';
import { useWidgetSync } from '../../widgets/useWidgetSync';
import { createQueryClient } from '../api/query';
import { env } from '../config/env';
import { useNetwork, isOnlineNow } from '../network/network';
import { drainQueue } from '../offline/runner';
import { useOfflineQueue } from '../offline/store';
import { RealtimeProvider } from '../realtime/provider';
import { useSession } from '../session/session-store';
import { ServicesProvider, useServices } from './services';

function Bootstrap({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  const { storage, secrets } = useServices();
  usePetActionSender();
  useMessageSender();
  useTrustSenders();
  useWidgetSync();

  useEffect(() => {
    void Promise.all([useSession.getState().restore(secrets), useOfflineQueue.getState().hydrate(storage), useOnboarding.getState().hydrate(storage)]).then(() => {
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
  }, [storage, secrets, onReady]);

  return <>{children}</>;
}

function Purchases({ children }: { children: ReactNode }) {
  const { api: blowy, newCommandId } = useServices();
  const userId = useSession((s) => s.userId);
  const api = useMemo(() => createPurchasesApi((req) => blowy.raw(req)), [blowy]);
  const port = useMemo(
    () =>
      selectPurchasesAdapter(
        { platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web', iosKey: env.revenueCatIosKey, androidKey: env.revenueCatAndroidKey, blowyEnv: env.blowyEnv },
        api,
        newCommandId,
      ),
    [api, newCommandId],
  );
  // En production sans clé : pas d'adaptateur → achats indisponibles (jamais de fausse transaction).
  if (!port) return <>{children}</>;
  return (
    <PurchasesProvider port={port} api={api} userId={userId}>
      {children}
    </PurchasesProvider>
  );
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
                  <Purchases>
                    <Bootstrap onReady={onReady}>{children}</Bootstrap>
                  </Purchases>
                </RealtimeProvider>
              </QueryClientProvider>
            </ServicesProvider>
          </SpriteSourceProvider>
        </A11yPrefsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
