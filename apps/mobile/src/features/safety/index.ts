import type { ReportBody } from '@blowy/contract';
import { LEVEL_KEYS } from '@blowy/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { keys, useApi } from '@/core';

export function useBlocks() {
  const api = useApi();
  return useQuery({ queryKey: keys.blocks, queryFn: api.safety.blocks });
}

export function useBlock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.block(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.blocks });
      void qc.invalidateQueries({ queryKey: keys.links });
      void qc.invalidateQueries({ queryKey: keys.encounters });
    },
  });
}

export function useUnblock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.unblock(userId),
    onSuccess: () => {
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

// ── Rappel de sécurité avant de se voir ─────────────────────────────────────


/** Niveau d'un lien à partir duquel on propose de se voir en vrai (`irl`). */
export const MEET_LEVEL = LEVEL_KEYS.indexOf('irl') + 1;

/** Liens dont le rappel « avant de vous voir » a déjà été lu (mémoire de l'appareil). */
export const useMeetReminders = create<{ seen: string[]; dismiss: (linkId: string) => void }>()(
  persist((set) => ({ seen: [], dismiss: (linkId) => set((s) => ({ seen: [...s.seen.filter((id) => id !== linkId), linkId].slice(-200) })) }), {
    name: 'blowy.meet-reminders',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

/** Le premier lien arrivé au niveau « se voir » dont le rappel n'a pas encore été lu, ou null. */
export function pendingMeetReminder<L extends { id: string; level: number; status: string }>(links: readonly L[] | undefined, seen: readonly string[]): L | null {
  return links?.find((l) => l.status === 'active' && l.level >= MEET_LEVEL && !seen.includes(l.id)) ?? null;
}
