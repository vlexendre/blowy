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
import { createHttp, type Http } from '../api/http';
import { env, isProduction } from '../config/env';
import type { AuthPort, CameraPermissionPort, HapticsPort, LocationPort, NotificationsPort, SecretStoragePort, StoragePort } from '../ports';
import { currentToken, useSession } from '../session/session-store';

export interface Services {
  http: Http;
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
  const http = createHttp({
    baseUrl: env.apiUrl,
    getToken: currentToken,
    onUnauthenticated: () => void useSession.getState().clear(secureStoreAdapter),
  });
  // Auth : Firebase (Apple/Google) quand configuré ; sinon LocalAuthProvider de l'API hors production.
  // Le pont Firebase (SDK) n'est pas encore installé : voir docs/agents/handoffs/D.md.
  const firebaseConfigured = !!(env.firebase.apiKey && env.firebase.projectId);
  const auth: AuthPort = firebaseConfigured || isProduction ? new FirebaseAuthAdapter(null, isProduction) : new LocalAuthAdapter(asyncStorageAdapter);
  return {
    http,
    auth,
    storage: asyncStorageAdapter,
    secrets: secureStoreAdapter,
    notifications: createExpoNotificationsAdapter(projectId),
    location: expoLocationAdapter,
    haptics: expoHapticsAdapter,
    camera: expoCameraAdapter,
    newCommandId: () => Crypto.randomUUID(),
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
