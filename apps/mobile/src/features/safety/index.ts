import type { Blocked, Encounters, Link, ReportBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, optimistic, patch, rollback, useApi } from '@/core';

export function useBlocks() {
  const api = useApi();
  return useQuery({ queryKey: keys.blocks, queryFn: api.safety.blocks });
}

/**
 * Bloquer (après confirmation à l'écran) : la personne quitte tout de suite tes chats et tes rencontres ; si l'API
 * refuse, tout revient.
 */
export function useBlock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.block(userId),
    onMutate: (userId) =>
      optimistic(qc, [
        patch<Link[]>(keys.links, (list) => list.filter((l) => l.other.id !== userId)),
        patch<Encounters>(keys.encounters, (e) => ({ ...e, incoming: e.incoming.filter((i) => i.from.id !== userId), suggestions: e.suggestions.filter((s) => s.user.id !== userId) })),
      ]),
    onError: (_e, _userId, snap) => rollback(qc, snap),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.blocks });
      void qc.invalidateQueries({ queryKey: keys.links });
      void qc.invalidateQueries({ queryKey: keys.encounters });
    },
  });
}

/** Débloquer : la ligne part de la liste tout de suite, et revient si l'API refuse. */
export function useUnblock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.unblock(userId),
    onMutate: (userId) => optimistic(qc, [patch<Blocked[]>(keys.blocks, (list) => list.filter((b) => b.userId !== userId))]),
    onError: (_e, _userId, snap) => rollback(qc, snap),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.blocks });
      // L'historique des rencontres la montre à nouveau.
      void qc.invalidateQueries({ queryKey: keys.encounters });
    },
  });
}

export function useReport() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReportBody) => api.safety.report(body),
    // Une personne signalée sort de l'historique des rencontres.
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.encounters }),
  });
}
