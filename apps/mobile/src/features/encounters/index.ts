import { ApiError } from '@blowy/api-client';
import type { EncounterHistoryItem, Encounters } from '@blowy/contract';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { create } from 'zustand';

import { keys, optimistic, patch, rollback, useApi } from '@/core';
import { maybeAskForReview } from '@/features/review';

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

/** Clé de l'historique : sous `keys.encounters`, donc relue avec les rencontres (salut, réponse, blocage). */
export const encounterHistoryKey = [...keys.encounters, 'history'] as const;

/** Historique des rencontres, du plus récent au plus ancien, par pages (« voir plus »). */
export function useEncounterHistory() {
  const api = useApi();
  const query = useInfiniteQuery({
    queryKey: encounterHistoryKey,
    queryFn: ({ pageParam }) => api.encounters.history(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });
  const seen = new Set<string>();
  const items: EncounterHistoryItem[] = [];
  for (const page of query.data?.pages ?? []) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return { ...query, items };
}

/** Refus « trop de coucous » de l'API (plafond du jour ou coucous en attente). */
export const isWaveLimit = (error: unknown): error is ApiError => error instanceof ApiError && error.code === 'wave_limit';

/**
 * Plus de coucou possible pour l'instant : la phrase à montrer (dite par l'API, dans ta langue), sinon null.
 * Lu dans les rencontres (et sur la carte), relues après chaque coucou ; sans elles (API plus ancienne), un refus
 * `wave_limit` tout frais suffit.
 */
export function useWaveBlock(lastError?: unknown): string | null {
  const { data } = useEncounters();
  const fresh = isWaveLimit(lastError) ? lastError.message : null;
  if (data?.waves) return data.waves.blocked ? (data.waves.message ?? fresh) : null;
  return fresh;
}

/** Saluer : rien ne se passe sans ce tap. */
export function useWave() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.encounters.wave(userId),
    // « Salué » à l'appui ; refusé (plafond, personne plus montrée) : le bouton revient.
    onMutate: (userId) =>
      optimistic(qc, [patch<Encounters>(keys.encounters, (data) => ({ ...data, suggestions: data.suggestions.map((s) => (s.user.id === userId ? { ...s, waved: true } : s)) }))]),
    onError: (_e, _userId, snap) => rollback(qc, snap),
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
      // Un lien vient de naître : un bon moment pour une note (après la course des deux minimoas et l'ouverture du chat).
      maybeAskForReview('encounter_accepted', 4000);
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
    // « Pas cette fois » : la carte part tout de suite ; elle revient si l'API refuse.
    onMutate: (id) => optimistic(qc, [patch<Encounters>(keys.encounters, (data) => ({ ...data, incoming: data.incoming.filter((i) => i.id !== id) }))]),
    onError: (_e, _id, snap) => rollback(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.encounters }),
  });
}

/** Code d’invitation reçu par un lien (https://minimoa.app/i/CODE ou minimoa://i/CODE), en attente d'être accepté. */
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
export { historyEntry } from './history';

/** Une rencontre précise, lue dans le cache des rencontres (salut reçu ou pet croisé). */
export function useEncounter(userId: string) {
  const query = useEncounters();
  const incoming = query.data?.incoming.find((i) => i.from.id === userId) ?? null;
  const suggestion = query.data?.suggestions.find((s) => s.user.id === userId) ?? null;
  return { ...query, incoming, suggestion };
}

export { matchAxes, useMyVision, useRetakeVisionTest, VISION_TEST_ROUTE, visionKey, whyA11y, type AxisWords } from './vision';
