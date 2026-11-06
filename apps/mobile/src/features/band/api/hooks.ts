import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createBandRepository } from './band.repository';

export const bandKeys = { band: ['band'] as const, street: ['band', 'street'] as const };

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createBandRepository(api), [api]);
}

export function useBand() {
  const repo = useRepo();
  return useQuery({
    queryKey: bandKeys.band,
    queryFn: repo.band,
    enabled: useSession((s) => s.status === 'signedIn'),
  });
}

export function useStreet() {
  const repo = useRepo();
  return useQuery({
    queryKey: bandKeys.street,
    queryFn: repo.street,
    enabled: useSession((s) => s.status === 'signedIn'),
  });
}

export function useLeaveBand() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => repo.leave(linkId, newCommandId()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: bandKeys.band }),
  });
}

export function useGiftAccessory() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { linkId: string; accessoryId: string }) =>
      repo.gift(a.linkId, a.accessoryId, newCommandId()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: bandKeys.street }),
  });
}
