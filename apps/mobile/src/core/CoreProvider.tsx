import { type ApiClient, ApiError, createApiClient } from '@blowy/api-client';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { createPorts } from './adapters';
import { config } from './config';
import type { Ports, Session } from './ports';

interface Core {
  ports: Ports;
  api: ApiClient;
  /** undefined tant que la session n'a pas été lue. */
  session: Session | null | undefined;
}

const CoreContext = createContext<Core | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, error) => (error instanceof ApiError && error.code !== 'network' ? false : count < 2),
    },
  },
});

// Sur iPhone, l'app qui revient au premier plan relit ce qui est affiché (sur le web, le navigateur le signale déjà).
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => sub.remove();
  });
}

/** Clés de cache partagées par les features. */
export const keys = {
  me: ['me'] as const,
  pet: ['pet'] as const,
  wardrobe: ['pet', 'wardrobe'] as const,
  links: ['links'] as const,
  link: (id: string) => ['links', id] as const,
  messages: (id: string) => ['links', id, 'messages'] as const,
  memories: (id: string) => ['links', id, 'memories'] as const,
  encounters: ['encounters'] as const,
  blocks: ['blocks'] as const,
};

function RealtimeBridge({ ports, session }: { ports: Ports; session: Session | null | undefined }) {
  const qc = useQueryClient();
  const userId = session?.userId;
  useEffect(() => {
    if (!userId) return;
    return ports.realtime.subscribe(({ linkId }) => {
      void qc.invalidateQueries({ queryKey: linkId ? keys.link(linkId) : keys.links });
      void qc.invalidateQueries({ queryKey: keys.links, exact: true });
    });
  }, [ports, qc, userId]);
  return null;
}

export function CoreProvider({ children }: { children: ReactNode }) {
  const ports = useMemo(createPorts, []);
  const api = useMemo(() => createApiClient({ baseUrl: config.apiUrl, getToken: () => ports.auth.getToken() }), [ports]);
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void ports.auth.getSession().then((s) => alive && setSession(s));
    const off = ports.auth.onChange((s) => {
      setSession(s);
      if (!s) queryClient.clear();
    });
    return () => {
      alive = false;
      off();
    };
  }, [ports]);

  const value = useMemo(() => ({ ports, api, session }), [ports, api, session]);
  return (
    <QueryClientProvider client={queryClient}>
      <CoreContext.Provider value={value}>
        <RealtimeBridge ports={ports} session={session} />
        {children}
      </CoreContext.Provider>
    </QueryClientProvider>
  );
}

function useCore(): Core {
  const core = useContext(CoreContext);
  if (!core) throw new Error('CoreProvider manquant');
  return core;
}

export const useApi = (): ApiClient => useCore().api;
export const usePorts = (): Ports => useCore().ports;
export const useSession = (): Session | null | undefined => useCore().session;
