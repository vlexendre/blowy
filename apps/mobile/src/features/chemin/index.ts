/**
 * Ton chemin (docs/CHEMIN.md) : la carte de l'accueil, la séance du jour, les réponses, la personne du jour, le profil.
 * Le contenu (questions, réactions, animations) vient du serveur ; l'app l'affiche. Lecture tolérante (client) :
 * une API plus ancienne sans ces routes rend une erreur, et l'accueil reste utilisable sans le chemin.
 */
import type { CheminAnswersBody, CheminMap, CheminResult, Encounters, Mascot } from '@blowy/contract';
import { NAMED_MOTIONS } from '@blowy/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { keys, optimistic, patch, rollback, useApi } from '@/core';
import { trackChemin } from '@/features/analytics';
import { useWave } from '@/features/encounters';

export * from './logic';

/** Formats de question que cette app sait afficher (`?formats=`). */
export const CHEMIN_FORMATS_SUPPORTED = ['choice', 'slider'] as const;
/** Animations nommées que cette app sait jouer (repli neutre pour les autres). */
export const CHEMIN_ANIMATIONS = NAMED_MOTIONS;

/** La carte : unités, étapes, état du jour, série, « il te connaît ». */
export function useCheminMap() {
  const api = useApi();
  return useQuery({ queryKey: keys.chemin, queryFn: api.chemin.map, staleTime: 30_000, retry: 1 });
}

/** La séance à faire maintenant (la même revient tant qu'elle n'est pas finie). */
export function useCheminSession(enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: keys.cheminSession,
    queryFn: () => api.chemin.session([...CHEMIN_FORMATS_SUPPORTED]),
    enabled,
    staleTime: 0,
    gcTime: 5 * 60_000,
  });
}

/** Ce que Nino sait de toi (type, jauges, réponses ; détail avec Minimoa+). */
export function useProfil() {
  const api = useApi();
  return useQuery({ queryKey: keys.profil, queryFn: api.chemin.profil, staleTime: 60_000, retry: 1 });
}

/** Une séance finie, telle que la fin de séance l'affiche. */
export interface CheminDone {
  result: CheminResult;
  /** La série d'avant (le chiffre défile d'un cran). */
  streakBefore: number;
  /** Durée de la séance en secondes (de la première question à l'envoi), null si inconnue. */
  seconds: number | null;
  /** Réponses envoyées. */
  answers: number;
  unitTitle: string | null;
  /** Scène de fin nommée par le serveur (`confetti`) ; jouée par `namedMotion`, repli neutre. */
  endScene: string | null;
  /** Minimoa animé réglé par l'API (reçu avec la séance) ; null : l'image habituelle. */
  mascot: Mascot | null;
}

/**
 * Résultats des séances de cette session de l'app (fin de séance) : gardés en mémoire, par séance. La série d'avant
 * sert à faire défiler le chiffre. Rien n'est gardé sur le téléphone : relancer la même séance rend le même résultat
 * (idempotent côté serveur).
 */
export const useCheminResults = create<{
  results: Record<string, CheminDone>;
  /** La dernière séance finie (l'accueil propose de revoir sa personne du jour). */
  last: string | null;
  put: (id: string, v: CheminDone) => void;
  patchPerson: (id: string, waved: boolean) => void;
}>((set) => ({
  results: {},
  last: null,
  put: (id, v) => set((s) => ({ results: { ...s.results, [id]: v }, last: id })),
  patchPerson: (id, waved) =>
    set((s) => {
      const r = s.results[id];
      if (!r?.result.person) return s;
      const person = { ...r.result.person, suggestion: { ...r.result.person.suggestion, waved } };
      return { results: { ...s.results, [id]: { ...r, result: { ...r.result, person } } } };
    }),
}));

/**
 * Envoyer les réponses d'une séance. Optimiste : l'accueil passe tout de suite à « séance faite » (série du jour
 * comprise) ; un refus remet l'état d'avant.
 */
export function useAnswerSeance() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { body: CheminAnswersBody; slot: 'daily' | 'bonus'; unitTitle: string | null; endScene?: string | null; mascot?: Mascot | null; seconds?: number | null }) => api.chemin.answer(v.body),
    onMutate: async (v) => {
      const prev = qc.getQueryData<CheminMap>(keys.chemin);
      const snap = await optimistic(qc, [
        patch<CheminMap>(keys.chemin, (m) => ({
          ...m,
          today: { ...m.today, state: v.slot === 'bonus' || m.today.state === 'bonus' ? 'all_done' : m.today.quota.bonus > 0 ? 'bonus' : 'done' },
          streak: m.streak.doneToday ? m.streak : { ...m.streak, doneToday: true, current: m.streak.current + 1, atRisk: false },
        })),
      ]);
      return { snap, before: prev ? (prev.streak.doneToday ? null : prev.streak.current) : null };
    },
    onSuccess: (result, v, ctx) => {
      // La série d'avant (le chiffre défile d'un cran) ; déjà comptée aujourd'hui : rien ne bouge.
      const before = ctx?.before ?? result.streak.current;
      useCheminResults.getState().put(result.sessionId, { result, streakBefore: Math.max(0, Math.min(before, result.streak.current)), unitTitle: v.unitTitle, endScene: v.endScene ?? null, mascot: v.mascot ?? null, seconds: v.seconds ?? null, answers: v.body.answers.length });
      if (!result.alreadyRecorded) trackChemin('Seance Completed', { unit: v.unitTitle, answers: v.body.answers.length, slot: v.slot });
    },
    onError: (_e, _v, ctx) => rollback(qc, ctx?.snap),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.chemin, exact: true });
      void qc.invalidateQueries({ queryKey: keys.cheminSession, exact: true });
      void qc.invalidateQueries({ queryKey: keys.profil });
      void qc.invalidateQueries({ queryKey: keys.ritualsStreak });
      void qc.invalidateQueries({ queryKey: keys.ritualsToday });
    },
  });
}

/**
 * « Dire bonjour » à la personne du jour : exactement le geste « faire signe » des rencontres (même mutation,
 * optimiste), plus le résultat de la séance marqué « salué » tout de suite.
 */
export function useHelloFromChemin(sessionId: string | null) {
  const wave = useWave();
  const send = (userId: string, unit: string | null) => {
    if (sessionId) useCheminResults.getState().patchPerson(sessionId, true);
    wave.mutate(userId, {
      onSuccess: () => trackChemin('Hello Sent From Chemin', { unit }),
      onError: () => {
        if (sessionId) useCheminResults.getState().patchPerson(sessionId, false);
      },
    });
  };
  return { send, wave };
}

/** Les rencontres déjà en cache disent si cette personne a été saluée (depuis la carte, par exemple). */
export const wavedInEncounters = (data: Encounters | undefined, userId: string): boolean => !!data?.suggestions.some((s) => s.user.id === userId && s.waved);
