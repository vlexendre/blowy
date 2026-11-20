/** Étincelles de la semaine, ligue entre voisins et trophées (maquette V7). */
import { useQuery } from '@tanstack/react-query';
import { keys, useApi } from '@/core';

export function useProgression() {
  const api = useApi();
  return useQuery({ queryKey: keys.progression, queryFn: api.progression, staleTime: 60_000, retry: 1 });
}
