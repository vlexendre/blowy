/**
 * Ce qui reste des rituels (V7) sur l'accueil : le jour (série, défi validé par la séance) et la fête d'une série
 * gagnée, plus la dernière photo gardée (fond de la scène). Défi, habitudes, preuves, souvenirs et bilans sont
 * supprimés de l'app (docs/ADA-2027.md). La clé `ritualsToday` est celle du pont des widgets (`useWidgetSync`) :
 * chaque réponse de l'API la met à jour, et le widget suit.
 */
import type { DailyChallenge, RitualsToday, Streak } from '@blowy/contract';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { keys, useApi } from '@/core';

/** Clés propres aux rituels (l'accueil garde celles du cœur, partagées avec les widgets). */
export const ritualKeys = {
  memories: ['rituals', 'memories'] as const,
};

// ── Fête d'une série ──────────────────────────────────────────────────────────

export interface StreakParty {
  streak: number;
  best: number;
  line: string | null;
}

/** Défi du jour tout juste fait (découvert par une relecture), à fêter sur l'accueil (le minimoa et sa mèche). */
export const useStreakParty = create<{ party: StreakParty | null; push: (p: StreakParty) => void; clear: () => void }>((set) => ({
  party: null,
  push: (party) => set({ party }),
  clear: () => set({ party: null }),
}));

const justDone = (before: DailyChallenge | undefined, after: DailyChallenge): boolean => after.status === 'done' && !!before && before.status !== 'done';

// ── Lectures ──────────────────────────────────────────────────────────────────

/** Tout ce que l'accueil montre du jour, en une requête. Découvre aussi un défi validé par le serveur à l'ouverture. */
export function useRitualsToday() {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.ritualsToday,
    queryFn: async () => {
      const before = qc.getQueryData<RitualsToday>(keys.ritualsToday);
      const today = await api.rituals.today();
      qc.setQueryData<Streak>(keys.ritualsStreak, today.streak);
      if (before && before.day === today.day && justDone(before.challenge, today.challenge)) {
        useStreakParty.getState().push({ streak: today.streak.current, best: today.streak.best, line: null });
      }
      return today;
    },
    staleTime: 30_000,
  });
}

/** Photos gardées (la plus récente sert de fond à la scène de l'accueil). */
export function usePrivateMemories() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ritualKeys.memories,
    queryFn: ({ pageParam }) => api.rituals.memories(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
  });
}
