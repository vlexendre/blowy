/** Recherche de ville/quartier (`GET /v1/neighborhoods?q=`) : saisie libre, jamais de géolocalisation. */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createAccountRepository } from '../../account';
import { useServices } from '../../../core/providers/services';

export function useNeighborhoodSearch(q: string) {
  const { api } = useServices();
  const repo = useMemo(() => createAccountRepository(api, 'other'), [api]);
  const query = q.trim();
  return useQuery({
    queryKey: ['neighborhoods', query],
    queryFn: () => repo.neighborhoods(query),
    enabled: query.length >= 2,
    retry: false,
    staleTime: 60_000,
  });
}
