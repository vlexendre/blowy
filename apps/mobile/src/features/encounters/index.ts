import type { Encounters } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { create } from 'zustand';

import { keys, useApi } from '@/core';

/** Les rencontres : aucun temps réel ne les signale, alors elles sont relues chaque minute (saluts reçus, saluts acceptés). */
export function useEncounters() {
  const api = useApi();
  return useQuery({ queryKey: keys.encounters, queryFn: api.encounters.list, refetchInterval: 60_000 });
}

/** Les rencontres, relues aussi à chaque retour sur l'écran. */
export function useLiveEncounters() {
  const encounters = useEncounters();
  const { refetch } = encounters;
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  return encounters;
}

/** Saluer : rien ne se passe sans ce tap. */
export function useWave() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.encounters.wave(userId),
    onMutate: (userId) => {
      qc.setQueryData<Encounters>(keys.encounters, (data) =>
        data ? { ...data, suggestions: data.suggestions.map((s) => (s.user.id === userId ? { ...s, waved: true } : s)) } : data,
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.encounters });
      void qc.invalidateQueries({ queryKey: keys.links });
      void qc.invalidateQueries({ queryKey: keys.pet });
    },
  });
}

export function useAcceptEncounter() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.encounters.accept(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.encounters });
      void qc.invalidateQueries({ queryKey: keys.links });
      void qc.invalidateQueries({ queryKey: keys.pet });
    },
  });
}

export function useDeclineEncounter() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.encounters.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.encounters }),
  });
}

/** Code d'invitation reçu par un lien blowy://i/CODE, en attente d'être accepté. */
export const usePendingInvite = create<{ code: string | null; set: (code: string | null) => void }>((set) => ({
  code: null,
  set: (code) => set({ code }),
}));

export function useInvite(code: string | null) {
  const api = useApi();
  return useQuery({ queryKey: ['invite', code], queryFn: () => api.invites.get(code ?? ''), enabled: !!code });
}

export function useAcceptInvite() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.invites.accept(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.links }),
  });
}

export { useShareInvite } from './share';
export { NeighbourhoodMap } from './NeighbourhoodMap';
export type { MapPet } from './NeighbourhoodMap';

/** Une rencontre précise, lue dans le cache des rencontres (salut reçu ou pet croisé). */
export function useEncounter(userId: string) {
  const query = useEncounters();
  const incoming = query.data?.incoming.find((i) => i.from.id === userId) ?? null;
  const suggestion = query.data?.suggestions.find((s) => s.user.id === userId) ?? null;
  return { ...query, incoming, suggestion };
}
