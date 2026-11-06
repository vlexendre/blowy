/** Hooks TanStack Query des sorties : les écrans ne parlent qu'à ces hooks. */
import type { CheckInRequest } from '@blowy/api-contract';
import type { VoteChoice } from '@blowy/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createOutingsRepository } from './outings.repository';

export const outingKeys = {
  week: ['outings', 'week'] as const,
  outing: (id: string) => ['outings', 'one', id] as const,
  votes: (id: string) => ['outings', 'votes', id] as const,
  preview: (id: string) => ['outings', 'cancel-preview', id] as const,
  reliability: ['outings', 'reliability'] as const,
  history: ['outings', 'history'] as const,
  team: ['teams', 'mine'] as const,
};

export function useOutingsRepository() {
  const { api } = useServices();
  return useMemo(() => createOutingsRepository(api), [api]);
}

const useSignedIn = () => useSession((s) => s.status === 'signedIn');

export function useWeek() {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.week, queryFn: repo.week, enabled: useSignedIn() });
}

export function useOuting(id: string | null | undefined) {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.outing(id ?? ''), queryFn: () => repo.outing(id!), enabled: useSignedIn() && !!id });
}

/** Sortie de la semaine (ma place) : semaine → sortie. */
export function useMyOuting() {
  const week = useWeek();
  const outing = useOuting(week.data?.myOutingId);
  return { week, outing };
}

export function useVotes(id: string | null | undefined) {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.votes(id ?? ''), queryFn: () => repo.votes(id!), enabled: useSignedIn() && !!id });
}

export function useCancelPreview(id: string | null | undefined) {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.preview(id ?? ''), queryFn: () => repo.cancelPreview(id!), enabled: useSignedIn() && !!id });
}

export function useReliability() {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.reliability, queryFn: repo.reliability, enabled: useSignedIn() });
}

export function useTeam() {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: outingKeys.team, queryFn: repo.team, enabled: useSignedIn(), retry: false });
}

function useInvalidateOuting(id: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: outingKeys.outing(id) });
    void qc.invalidateQueries({ queryKey: outingKeys.week });
  };
}

export function useAcceptSeat(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const invalidate = useInvalidateOuting(id);
  return useMutation({ mutationFn: (funding: 'AUTO' | 'PAY' = 'AUTO') => repo.accept(id, newCommandId(), funding), onSuccess: invalidate });
}

export function useDeclineSeat(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const invalidate = useInvalidateOuting(id);
  return useMutation({ mutationFn: () => repo.decline(id, newCommandId()), onSuccess: invalidate });
}

export function useCancelSeat(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const invalidate = useInvalidateOuting(id);
  return useMutation({ mutationFn: (kind: 'CANT_MAKE_IT' | 'SAFETY' | 'EMERGENCY') => repo.cancel(id, kind, newCommandId()), onSuccess: invalidate });
}

export function useKnowsSomeone(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const invalidate = useInvalidateOuting(id);
  return useMutation({ mutationFn: (userId: string) => repo.knowsSomeone(id, userId, newCommandId()), onSuccess: invalidate });
}

export function useCheckIn(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const invalidate = useInvalidateOuting(id);
  return useMutation({ mutationFn: (body: CheckInRequest) => repo.checkIn(id, body, newCommandId()), onSuccess: invalidate });
}

export function useSubmitVotes(id: string) {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (choices: Record<string, VoteChoice>) => repo.submitVotes(id, choices, newCommandId()), onSuccess: () => void qc.invalidateQueries({ queryKey: outingKeys.votes(id) }) });
}

export function useCreateTeam() {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => repo.createTeam(newCommandId()), onSuccess: () => void qc.invalidateQueries({ queryKey: outingKeys.team }) });
}

/** Mes sorties passées (`GET /v1/outings/history`) : Blowy+ « tes sorties ce mois ». */
export function useOutingHistory() {
  const repo = useOutingsRepository();
  return useQuery({ queryKey: ['outings', 'history'] as const, queryFn: repo.history, enabled: useSignedIn() });
}

/** V5.5 (D-061) : « sortir quand même, en amitié » cette semaine après l'état honnête. */
export function useFriendsThisWeek() {
  const repo = useOutingsRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (weekKey: string) => repo.request(weekKey, { mode: 'FRIENDS_THIS_WEEK' }, newCommandId()), onSuccess: () => void qc.invalidateQueries({ queryKey: outingKeys.week }) });
}
