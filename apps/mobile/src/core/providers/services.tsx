/**
 * Conteneur de services (injection de dépendances légère) : choisit les adaptateurs réels ou
 * locaux selon l'environnement et les expose par contexte React. Les features ne voient que
 * `useServices()` (ports + http + commandId), jamais un SDK natif directement.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { FirebaseAuthAdapter, LocalAuthAdapter } from '../adapters/auth';
import { asyncStorageAdapter, createExpoNotificationsAdapter, expoCameraAdapter, expoHapticsAdapter, expoLocationAdapter, secureStoreAdapter } from '../adapters/native';
import { createApi, type Api } from '../api/client';
import { env, isProduction, localAuthEnabled } from '../config/env';
import type { AuthPort, CameraPermissionPort, HapticsPort, LocationPort, NotificationsPort, SecretStoragePort, StoragePort } from '../ports';
import { currentToken, useSession } from '../session/session-store';

export interface Services {
  api: Api;
  auth: AuthPort;
  storage: StoragePort;
  secrets: SecretStoragePort;
  notifications: NotificationsPort;
  location: LocationPort;
  haptics: HapticsPort;
  camera: CameraPermissionPort;
  newCommandId: () => string;
}

export function createServices(): Services {
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const newCommandId = () => Crypto.randomUUID();
  const api = createApi({
    baseUrl: env.apiUrl,
    getToken: currentToken,
    newCommandId,
    onUnauthenticated: () => void useSession.getState().clear(secureStoreAdapter),
  });
  // Auth : LocalAuthProvider de l'API seulement si EXPO_PUBLIC_AUTH_MODE=local hors production ;
  // sinon Firebase (Apple/Google) — pont SDK à brancher (docs/agents/handoffs/D.md).
  const auth: AuthPort = localAuthEnabled(env) ? new LocalAuthAdapter(asyncStorageAdapter) : new FirebaseAuthAdapter(null, isProduction);
  return {
    api,
    auth,
    storage: asyncStorageAdapter,
    secrets: secureStoreAdapter,
    notifications: createExpoNotificationsAdapter(projectId),
    location: expoLocationAdapter,
    haptics: expoHapticsAdapter,
    camera: expoCameraAdapter,
    newCommandId,
  };
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ services, children }: { services?: Services; children: ReactNode }) {
  const value = useMemo(() => services ?? createServices(), [services]);
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('ServicesProvider manquant');
  return s;
}
