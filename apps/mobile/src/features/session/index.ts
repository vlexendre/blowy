import { ApiError } from '@blowy/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { type Href, router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { type AuthProvider, AuthError, keys, useApi, usePorts, useSession } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { resumeOnboarding, useDraft, useDraftHydrated } from '@/features/onboarding';
import { common } from '@/locales/common';

export type Gate = 'loading' | 'signedOut' | 'needsOnboarding' | 'ready' | 'offline' | 'suspended';

/** Où envoyer la personne au lancement : connexion, création du minimoa, l'app, ou l'écran « compte suspendu ». */
export function useGate(): Gate {
  const session = useSession();
  const api = useApi();
  // Le brouillon d'inscription doit être relu avant de décider (reprise là où la personne s'était arrêtée).
  const hydrated = useDraftHydrated();
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session });
  if (session === undefined || !hydrated) return 'loading';
  if (session === null) return 'signedOut';
  if (me.isSuccess) return 'ready';
  if (me.error instanceof ApiError) {
    if (me.error.code === 'suspended') return 'suspended';
    if (me.error.code === 'not_onboarded') return 'needsOnboarding';
    if (me.error.code === 'unauthorized') return 'signedOut';
    return 'offline';
  }
  return 'loading';
}

/** Fournisseurs de connexion proposés ici (Apple sur iPhone, Google sur Android et le web, e-mail en mode local). */
export function useProviders(): readonly AuthProvider[] {
  return usePorts().auth.providers;
}

/**
 * Connexion par Apple ou Google ; `data` vaut null si la personne a annulé (rien à afficher). Avec Apple, le code
 * d'autorisation part à l'API juste après (révocation à la suppression du compte) ; un échec n'empêche rien.
 */
export function useSignInWith() {
  const { auth } = usePorts();
  const api = useApi();
  return useMutation({
    mutationFn: async (provider: Exclude<AuthProvider, 'email'>) => {
      const session = await auth.signInWith(provider);
      if (session?.appleAuthorizationCode) {
        const { appleAuthorizationCode, ...rest } = session;
        void api.me.appleAuthorization(appleAuthorizationCode).catch(() => undefined);
        return rest;
      }
      return session;
    },
  });
}

/** Connexion par e-mail et code (compte de revue d'Apple ; code de développement en local). */
export function useEmailCodeSignIn() {
  const { auth } = usePorts();
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => auth.signInWithEmailCode(email.trim().toLowerCase(), code.trim()),
  });
}

export function useSendCode() {
  const { auth } = usePorts();
  return useMutation({ mutationFn: (email: string) => auth.sendCode(email.trim().toLowerCase()) });
}

export function useVerifyCode() {
  const { auth } = usePorts();
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => auth.verifyCode(email.trim().toLowerCase(), code),
  });
}

export function useSignOut() {
  const { auth } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => qc.clear(),
  });
}

/** Message lisible pour une erreur d'auth ou d'API (repli générique). */
export function errorMessage(error: unknown, fallback: string = common.genericError): string {
  if (error instanceof AuthError || error instanceof ApiError) return error.message;
  return fallback;
}

/** Compte à rebours en secondes (renvoi du code). `start()` le relance. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const start = useCallback(() => setLeft(seconds), [seconds]);
  return { left, start };
}

/** Demande une confirmation : `Alert` sur téléphone, `window.confirm` sur le web (où `Alert` ne fait rien). */
export function confirmAction(opts: { title: string; message: string; confirm: string; cancel: string; destructive?: boolean; onConfirm: () => void }): void {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${opts.title}\n\n${opts.message}`)) opts.onConfirm();
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: opts.cancel, style: 'cancel' },
    { text: opts.confirm, style: opts.destructive ? 'destructive' : 'default', onPress: opts.onConfirm },
  ]);
}

/** Relance la lecture du profil (écran « pas de réseau » de l'aiguillage). */
export function useRetryGate(): () => void {
  const qc = useQueryClient();
  return useCallback(() => void qc.resetQueries({ queryKey: keys.me }), [qc]);
}

/** Retour arrière, ou vers `fallback` quand l'écran a été ouvert directement (lien, rechargement web). */
export function goBack(fallback: Href): void {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * Où aller juste après la connexion. Même décision que l'aiguillage (`app/index.tsx`), mais calculée ici :
 * on ne passe pas par « / » pour ne pas rejouer l'aiguillage (et son écran d'attente) après la connexion.
 */
export function useAfterSignIn(): () => Promise<Href> {
  const api = useApi();
  const qc = useQueryClient();
  return useCallback(async () => {
    try {
      await qc.fetchQuery({ queryKey: keys.me, queryFn: api.me.get, staleTime: 0 });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'not_onboarded') {
        return resumeOnboarding();
      }
      if (e instanceof ApiError && e.code === 'suspended') return '/(onboarding)/suspendu';
      return '/';
    }
    // Le compte existe déjà (avec son minimoa) : le brouillon d'une inscription commencée ne sert plus.
    useDraft.getState().reset();
    const code = usePendingInvite.getState().code;
    return code ? { pathname: '/i/[code]', params: { code } } : '/(tabs)/pet';
  }, [api, qc]);
}
export { SessionBridges } from './bridges';
export { AppleButton } from './AppleButton';
