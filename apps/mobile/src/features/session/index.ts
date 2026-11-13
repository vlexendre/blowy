import { ApiError } from '@blowy/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { type Href, router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { AuthError, keys, useApi, usePorts, useSession } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { resumeOnboarding } from '@/features/onboarding';

export type Gate = 'loading' | 'signedOut' | 'needsOnboarding' | 'ready' | 'offline';

/** Où envoyer la personne au lancement : connexion, création du pet, ou l'app. */
export function useGate(): Gate {
  const session = useSession();
  const api = useApi();
  const me = useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled: !!session });
  if (session === undefined) return 'loading';
  if (session === null) return 'signedOut';
  if (me.isSuccess) return 'ready';
  if (me.error instanceof ApiError) {
    if (me.error.code === 'not_onboarded') return 'needsOnboarding';
    if (me.error.code === 'unauthorized') return 'signedOut';
    return 'offline';
  }
  return 'loading';
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
export function errorMessage(error: unknown, fallback = 'Quelque chose a coincé. Réessaie dans un instant.'): string {
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
      return '/';
    }
    const code = usePendingInvite.getState().code;
    return code ? { pathname: '/i/[code]', params: { code } } : '/(tabs)/pet';
  }, [api, qc]);
}
