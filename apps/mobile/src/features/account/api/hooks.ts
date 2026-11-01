/** Hooks TanStack Query de la feature compte. */
import type { MatchPreferences, PrivacySettings, RecordConsentsRequest, UpdateProfileRequest } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import type { AuthProviderKind } from '../../../core/ports/auth';
import { createAccountRepository } from './account.repository';

export const accountKeys = { me: ['me'] as const, consents: ['consents'] as const, sessions: ['sessions'] as const };

export function useAccountRepository() {
  const { api } = useServices();
  return useMemo(() => createAccountRepository(api, Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'other'), [api]);
}

export function useMe() {
  const repo = useAccountRepository();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: accountKeys.me, queryFn: repo.me, enabled: signedIn });
}

export function useSignIn() {
  const repo = useAccountRepository();
  const { auth, secrets } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arg: AuthProviderKind | { kind: 'local'; demoKey: string }) => {
      const cred = typeof arg === 'string' ? await auth.signIn(arg) : await auth.signIn('local', arg.demoKey);
      const session = await repo.signIn(cred, Constants.expoConfig?.version ?? '0.0.0');
      await useSession.getState().save(secrets, session);
      await qc.invalidateQueries({ queryKey: accountKeys.me });
      return { session, givenName: cred.givenName ?? null };
    },
  });
}

export function useSignOut() {
  const repo = useAccountRepository();
  const { auth, secrets } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await repo.signOut().catch(() => undefined);
      await auth.signOut();
      await useSession.getState().clear(secrets);
      qc.clear();
    },
  });
}

/** Commande avec commandId stable par appel logique (conservé si l'utilisateur réessaie). */
function useCommand<TArg, TRes>(fn: (commandId: string, arg: TArg) => Promise<TRes>, onDone?: (r: TRes) => void) {
  const { newCommandId } = useServices();
  return useMutation({ mutationFn: (arg: TArg) => fn(newCommandId(), arg), onSuccess: onDone });
}

export function useUpdateProfile() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, body: UpdateProfileRequest) => repo.updateProfile(id, body), (me) => qc.setQueryData(accountKeys.me, me));
}

export function useSavePreferences() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, body: MatchPreferences) => repo.putPreferences(id, body), (me) => qc.setQueryData(accountKeys.me, me));
}

export function useSavePrivacy() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, body: PrivacySettings) => repo.putPrivacy(id, body), (me) => qc.setQueryData(accountKeys.me, me));
}

export function useConsents() {
  const repo = useAccountRepository();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: accountKeys.consents, queryFn: repo.consents, enabled: signedIn });
}

export function useRecordConsents() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, body: RecordConsentsRequest) => repo.recordConsents(id, body), (c) => qc.setQueryData(accountKeys.consents, c));
}

export function useStartVerification() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, _: void) => repo.startVerification(id), () => void qc.invalidateQueries({ queryKey: accountKeys.me }));
}

export function useCompleteOnboarding() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, _: void) => repo.completeOnboarding(id), (me) => qc.setQueryData(accountKeys.me, me));
}

export function useGlobalPause() {
  const repo = useAccountRepository();
  const qc = useQueryClient();
  return useCommand((id, days: number) => repo.startPause(id, days), () => void qc.invalidateQueries({ queryKey: accountKeys.me }));
}

export function useDeviceSessions() {
  const repo = useAccountRepository();
  return useQuery({ queryKey: accountKeys.sessions, queryFn: repo.sessions });
}

export function useRequestExport() {
  const repo = useAccountRepository();
  return useCommand((id, _: void) => repo.requestExport(id));
}

export function useRequestDeletion() {
  const repo = useAccountRepository();
  return useCommand((id, _: void) => repo.requestDeletion(id));
}
