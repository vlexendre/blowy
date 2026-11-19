import { type ApiClient, ApiError, createApiClient } from '@blowy/api-client';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { common } from '@/locales/common';
import { getLocale, onLocaleChange } from '@/locales/runtime';

import { createPorts } from './adapters';
import { clientInfo } from './app-identity';
import { config } from './config';
import './locale';
import type { Ports, Session } from './ports';
import { useUpdateRequired } from './update-required';

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
  /** Rituels : accueil du jour (défi, série, sortie…) et série seule (lecture légère, widgets). */
  ritualsToday: ['rituals', 'today'] as const,
  ritualsStreak: ['rituals', 'streak'] as const,
  /** Groupes (spéc. §26) : liste, détail et messages sont rangés sous `groups`. */
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  groupMessages: (id: string) => ['groups', id, 'messages'] as const,
  together: ['together'] as const,
};

/** Délai de regroupement des événements temps réel : un message déclenche deux événements (message et lien). */
const REALTIME_COALESCE_MS = 120;

/**
 * Temps réel → cache. Ce qui arrive en rafale (un message = une ligne `messages` et une mise à jour de `links`) est
 * regroupé : une seule relecture par fil, et seulement de ce qui a changé (pas tout le cache des liens ou des groupes).
 * À la reconnexion (retour au premier plan, réseau revenu), tout ce qui est affiché est relu : rien n'est perdu.
 */
function RealtimeBridge({ ports, session }: { ports: Ports; session: Session | null | undefined }) {
  const qc = useQueryClient();
  const userId = session?.userId;
  useEffect(() => {
    if (!userId) return;
    const links = new Set<string>();
    const groups = new Set<string>();
    let all = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      if (all) {
        void qc.invalidateQueries({ queryKey: keys.links });
        void qc.invalidateQueries({ queryKey: keys.groups });
      } else {
        for (const id of links) {
          void qc.invalidateQueries({ queryKey: keys.messages(id) });
          void qc.invalidateQueries({ queryKey: keys.link(id), exact: true });
          void qc.invalidateQueries({ queryKey: keys.memories(id) });
        }
        if (links.size > 0) void qc.invalidateQueries({ queryKey: keys.links, exact: true });
        for (const id of groups) {
          void qc.invalidateQueries({ queryKey: keys.groupMessages(id) });
          void qc.invalidateQueries({ queryKey: keys.group(id), exact: true });
        }
        if (groups.size > 0) void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
      }
      links.clear();
      groups.clear();
      all = false;
    };
    const off = ports.realtime.subscribe(({ linkId, groupId, resync }) => {
      if (resync || (!linkId && !groupId)) all = true;
      else if (groupId) groups.add(groupId);
      else if (linkId) links.add(linkId);
      timer ??= setTimeout(flush, REALTIME_COALESCE_MS);
    });
    return () => {
      off();
      if (timer) clearTimeout(timer);
    };
  }, [ports, qc, userId]);
  return null;
}

/**
 * Quand la langue change : les données de l'API sont relues (elles contiennent du texte) et la langue du profil
 * est mise à jour (notifications, e-mails et répliques des minimoas suivent `profiles.locale`).
 */
function LocaleBridge({ api, session }: { api: ApiClient; session: Session | null | undefined }) {
  const qc = useQueryClient();
  const signedIn = !!session;
  useEffect(() => {
    const sync = (locale: string) => {
      const me = qc.getQueryData<{ identity?: { locale?: string } }>(keys.me);
      if (signedIn && me?.identity && me.identity.locale !== locale) {
        void api.me
          .update({ locale: getLocale() })
          .then((next) => qc.setQueryData(keys.me, next))
          .catch(() => undefined);
      }
    };
    // À l'ouverture : si le profil a été créé dans une autre langue, on l'aligne sur celle du téléphone.
    const off = qc.getQueryCache().subscribe((e) => {
      if (e.type === 'updated' && e.query.queryKey[0] === keys.me[0] && e.action.type === 'success') sync(getLocale());
    });
    const offLocale = onLocaleChange((locale) => {
      void qc.invalidateQueries();
      sync(locale);
    });
    return () => {
      off();
      offLocale();
    };
  }, [api, qc, signedIn]);
  return null;
}

export function CoreProvider({ children }: { children: ReactNode }) {
  const ports = useMemo(createPorts, []);
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: config.apiUrl,
        getToken: () => ports.auth.getToken(),
        getLocale,
        messages: { network: () => common.errors.network, internal: () => common.errors.internal },
        // Version, build et plateforme sur chaque requête ; sous le build minimum, l'API répond 426 (docs/VERSIONING.md).
        getClientInfo: clientInfo,
        onUpdateRequired: () => useUpdateRequired.getState().set(true),
        // Valeurs d'une API plus récente retirées à la lecture : signalé en développement seulement.
        onTolerated: (path, t) => {
          if (__DEV__) console.warn(`[api] ${path} : valeurs inconnues retirées (${t.removed.join(', ')})`);
        },
      }),
    [ports],
  );
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
        <LocaleBridge api={api} session={session} />
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
