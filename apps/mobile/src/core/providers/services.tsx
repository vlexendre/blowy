/**
 * Conteneur de services (injection de dépendances légère) : choisit les adaptateurs réels ou
 * locaux selon l'environnement et les expose par contexte React. Les features ne voient que
 * `useServices()` (ports + api + commandId + horloge), jamais un SDK natif directement.
 * Mode démo (`?demo=` sur le web, `EXPO_PUBLIC_BLOWY_ENV=local` seulement) : `fetch` de fixtures,
 * horloge figée, session imposée — voir core/demo.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { FirebaseAuthAdapter, LocalAuthAdapter } from '../adapters/auth';
import { createMemorySecretStorage } from '../adapters/memory';
import {
  asyncStorageAdapter,
  createExpoNotificationsAdapter,
  expoCameraAdapter,
  expoHapticsAdapter,
  expoLocationAdapter,
  secureStoreAdapter,
} from '../adapters/native';
import { createApi, type Api } from '../api/client';
import { clock, freezeClock, type ClockPort } from '../clock';
import { env, isProduction, localAuthEnabled } from '../config/env';
import { createDemoFetch } from '../demo/demo-fetch';
import { launchSearch, readDemoRequest } from '../demo/mode';
import { demoScenario, type DemoScenario } from '../demo/scenarios';
import type {
  AuthPort,
  CameraPermissionPort,
  HapticsPort,
  LocationPort,
  NotificationsPort,
  SecretStoragePort,
  StoragePort,
} from '../ports';
import { currentToken, shouldClearOn401, useSession } from '../session/session-store';

export interface Services {
  api: Api;
  auth: AuthPort;
  storage: StoragePort;
  secrets: SecretStoragePort;
  notifications: NotificationsPort;
  location: LocationPort;
  haptics: HapticsPort;
  camera: CameraPermissionPort;
  clock: ClockPort;
  newCommandId: () => string;
  /** Scénario de démonstration actif (local uniquement), sinon null. */
  demo: DemoScenario | null;
}

export function createServices(): Services {
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
    ?.eas?.projectId;
  const newCommandId = () => Crypto.randomUUID();
  const demoReq = isProduction ? null : readDemoRequest(env.blowyEnv, launchSearch());
  const demo = demoReq ? demoScenario(demoReq.scenario) : null;
  if (demo) {
    freezeClock(Date.parse(demo.now));
    if (demo.session) useSession.getState().adopt(demo.session);
  }
  const secrets = demo ? createMemorySecretStorage() : secureStoreAdapter;
  const api = createApi({
    baseUrl: env.apiUrl,
    getToken: currentToken,
    newCommandId,
    ...(demo ? { fetch: createDemoFetch(demo.routes) } : null),
    onUnauthenticated: (sent) => {
      if (shouldClearOn401(sent, useSession.getState().token))
        void useSession.getState().clear(secrets);
    },
  });
  // Auth : LocalAuthProvider de l'API seulement si EXPO_PUBLIC_AUTH_MODE=local hors production ;
  // sinon Firebase (Apple/Google) — pont SDK à brancher (docs/agents/handoffs/D.md).
  const auth: AuthPort = localAuthEnabled(env)
    ? new LocalAuthAdapter(asyncStorageAdapter)
    : new FirebaseAuthAdapter(null, isProduction);
  return {
    api,
    auth,
    storage: asyncStorageAdapter,
    secrets,
    notifications: createExpoNotificationsAdapter(projectId),
    location: expoLocationAdapter,
    haptics: expoHapticsAdapter,
    camera: expoCameraAdapter,
    clock,
    newCommandId,
    demo,
  };
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services?: Services;
  children: ReactNode;
}) {
  const value = useMemo(() => services ?? createServices(), [services]);
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('ServicesProvider manquant');
  return s;
}
