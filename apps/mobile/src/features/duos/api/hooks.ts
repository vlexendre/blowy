import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createDuosRepository } from './duos.repository';

export const duoKeys = {
  lane: ['duo-lane'] as const,
  list: ['duos'] as const,
  one: (id: string) => ['duos', id] as const,
  venues: (id: string) => ['duos', id, 'venues'] as const,
};

export function useDuosRepository() {
  const { api } = useServices();
  return useMemo(() => createDuosRepository(api), [api]);
}
const useSignedIn = () => useSession((s) => s.status === 'signedIn');

export function useDuoLane() {
  const repo = useDuosRepository();
  return useQuery({ queryKey: duoKeys.lane, queryFn: repo.lane, enabled: useSignedIn() });
}
export function useDuos() {
  const repo = useDuosRepository();
  return useQuery({ queryKey: duoKeys.list, queryFn: repo.list, enabled: useSignedIn() });
}
export function useDuo(id: string | null | undefined) {
  const repo = useDuosRepository();
  return useQuery({
    queryKey: duoKeys.one(id ?? ''),
    queryFn: () => repo.duo(id!),
    enabled: useSignedIn() && !!id,
  });
}
export function useDuoVenues(id: string | null | undefined) {
  const repo = useDuosRepository();
  return useQuery({
    queryKey: duoKeys.venues(id ?? ''),
    queryFn: () => repo.venues(id!),
    enabled: useSignedIn() && !!id,
  });
}
export function useAnswerProposal() {
  const repo = useDuosRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: {
      id: string;
      yes: boolean;
    }): Promise<{ status: string; duoId?: string | null }> =>
      a.yes ? repo.accept(a.id, newCommandId()) : repo.pass(a.id, newCommandId()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: duoKeys.lane });
      void qc.invalidateQueries({ queryKey: duoKeys.list });
    },
  });
}
export function useProposeDate(id: string) {
  const repo = useDuosRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { venueId: string; startsAt: string }) =>
      repo.proposeDate(id, b, newCommandId()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: duoKeys.one(id) }),
  });
}
export function useLeaveDuo() {
  const repo = useDuosRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.leave(id, newCommandId()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: duoKeys.list }),
  });
}
export function useDuoEgg(id: string) {
  const repo = useDuosRepository();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => repo.egg(id, enabled, newCommandId()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: duoKeys.one(id) }),
  });
}
