/**
 * Ce qui reste des rituels (V7) sur l'accueil : le jour (série). Défi, habitudes, preuves, souvenirs et bilans sont
 * supprimés de l'app (docs/ADA-2027.md). La clé `ritualsToday` est celle du pont des widgets (`useWidgetSync`) :
 * chaque réponse de l'API la met à jour, et le widget suit.
 */
import type { Streak } from '@blowy/contract';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi } from '@/core';

// ── Lectures ──────────────────────────────────────────────────────────────────

/** Tout ce que l'accueil montre du jour, en une requête.  */
export function useRitualsToday() {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.ritualsToday,
    queryFn: async () => {
      const today = await api.rituals.today();
      qc.setQueryData<Streak>(keys.ritualsStreak, today.streak);
      return today;
    },
    staleTime: 30_000,
  });
}
