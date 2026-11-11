import { ApiError } from '@blowy/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi, usePorts, useSession } from '@/core';

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
