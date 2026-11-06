import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createPetsRepository } from './pets.repository';

export const petKeys = {
  mine: ['pets', 'mine'] as const,
  memories: ['pets', 'mine', 'memories'] as const,
};

export function usePetsRepository() {
  const { api } = useServices();
  return useMemo(() => createPetsRepository(api), [api]);
}
export function useMyPet() {
  const repo = usePetsRepository();
  return useQuery({
    queryKey: petKeys.mine,
    queryFn: repo.mine,
    enabled: useSession((s) => s.status === 'signedIn'),
  });
}
export function useMemories() {
  const repo = usePetsRepository();
  return useQuery({
    queryKey: petKeys.memories,
    queryFn: repo.memories,
    enabled: useSession((s) => s.status === 'signedIn'),
    retry: false,
  });
}
