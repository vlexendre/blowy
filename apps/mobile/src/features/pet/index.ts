import type { OutfitDto, PetEvent, PetView, Wardrobe, WardrobeItem } from '@blowy/contract';
import {
  addGauges,
  CARE_ACTIONS,
  CARE_EFFECTS,
  type CareAction,
  canCare,
  type ItemSlot,
  decayGauges,
  formOf,
  GAUGE_KEYS,
  type GaugeKey,
  type Gauges,
  NEED_KEYS,
  type Needs,
  type PetForm,
  urgentNeed,
  ZERO_GAUGES,
} from '@blowy/domain';
import { useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { create } from 'zustand';

import { keys, useApi } from '@/core';

/**
 * Objets tout juste gagnés : `queue` attend d'être fêtée (V6-Debloque), `fresh` garde l'étiquette « nouveau »
 * dans la garde-robe jusqu'à ce qu'on l'ait ouverte.
 */
export const useUnlocks = create<{ queue: string[]; fresh: string[]; push: (ids: readonly string[]) => void; next: () => void; seen: () => void }>((set) => ({
  queue: [],
  fresh: [],
  push: (ids) =>
    set((s) => ({
      queue: [...s.queue, ...ids.filter((id) => !s.queue.includes(id))],
      fresh: [...s.fresh, ...ids.filter((id) => !s.fresh.includes(id))],
    })),
  next: () => set((s) => ({ queue: s.queue.slice(1) })),
  seen: () => set({ fresh: [] }),
}));

/** À appeler avec chaque `PetView` reçue d'une action : met de côté les objets débloqués à fêter. */
function celebrate(view: PetView): void {
  if (view.newItems.length > 0) useUnlocks.getState().push(view.newItems);
}

/** Le pet, relu quand l'écran revient au premier plan et toutes les `everyMs` tant qu'il est visible (ses besoins baissent avec le temps). */
export function useLivePet(everyMs = 3 * 60_000) {
  const pet = usePet();
  const { refetch } = pet;
  useFocusEffect(
    useCallback(() => {
      void refetch();
      const id = setInterval(() => void refetch(), everyMs);
      return () => clearInterval(id);
    }, [refetch, everyMs]),
  );
  return pet;
}

export function usePet() {
  const api = useApi();
  return useQuery({ queryKey: keys.pet, queryFn: api.pet.get });
}

export function useRenamePet() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.pet.rename(name),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

export function useAnswerChallenge() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (choice: 0 | 1) => api.pet.answerChallenge(choice),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      celebrate(view);
      if (view.newItems.length > 0) void qc.invalidateQueries({ queryKey: keys.wardrobe });
      void qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

/** S'occuper du pet : nourrir, jouer, sieste, câlin. Le résultat porte les objets tout juste débloqués. */
export function useCare() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: CareAction) => api.pet.care(action),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      celebrate(view);
      void qc.invalidateQueries({ queryKey: keys.me });
      void qc.invalidateQueries({ queryKey: keys.encounters });
      if (view.newItems.length > 0) void qc.invalidateQueries({ queryKey: keys.wardrobe });
    },
  });
}

export function useWardrobe() {
  const api = useApi();
  return useQuery({ queryKey: keys.wardrobe, queryFn: api.pet.wardrobe });
}

/** Change la tenue : la garde-robe est mise à jour tout de suite, puis confirmée par l'API. */
export function useSetOutfit() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (outfit: OutfitDto) => api.pet.setOutfit(outfit),
    onMutate: async (outfit) => {
      await qc.cancelQueries({ queryKey: keys.pet });
      const before = qc.getQueryData<Wardrobe>(keys.wardrobe);
      const petBefore = qc.getQueryData<PetView>(keys.pet);
      if (before) qc.setQueryData<Wardrobe>(keys.wardrobe, { ...before, outfit });
      if (petBefore) qc.setQueryData<PetView>(keys.pet, { ...petBefore, pet: { ...petBefore.pet, outfit } });
      return { before, petBefore };
    },
    onError: (_error, _outfit, context) => {
      if (context?.before) qc.setQueryData(keys.wardrobe, context.before);
      if (context?.petBefore) qc.setQueryData(keys.pet, context.petBefore);
    },
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
      void qc.invalidateQueries({ queryKey: keys.links });
    },
  });
}

/** Tenue avec un objet posé ou retiré dans un emplacement. */
export function withItem(outfit: OutfitDto, slot: ItemSlot, id: string | null): OutfitDto {
  const next: OutfitDto = { ...outfit };
  if (id === null || next[slot] === id) delete next[slot];
  else next[slot] = id;
  return next;
}

/** Soins conseillés (disque jaune) : ceux qui comblent un besoin urgent, sinon celui du besoin le plus bas. */
export function careHot(needs: Needs): Record<CareAction, boolean> {
  const urgent = urgentNeed(needs);
  const lowest = NEED_KEYS.reduce((a, b) => (needs[b] < needs[a] ? b : a));
  const out = { feed: false, play: false, nap: false, cuddle: false };
  for (const a of CARE_ACTIONS) {
    const fills = CARE_EFFECTS[a].fills;
    const wanted = urgent ? needs[fills] < 40 : fills === lowest;
    // Jeu et câlin comblent tous deux l'humeur : le câlin n'est mis en avant que si le jeu est refusé.
    out[a] = canCare(needs, a) && wanted && !(a === 'cuddle' && out.play);
  }
  return out;
}

/** Gestes acceptés maintenant (`canCare`). */
export function careAvailable(needs: Needs): Record<CareAction, boolean> {
  const out = {} as Record<CareAction, boolean>;
  for (const a of CARE_ACTIONS) out[a] = canCare(needs, a);
  return out;
}

/** Le prochain objet à gagner : celui dont l'étape est la plus avancée (à égalité, la plus courte). */
export function nextItem(items: readonly WardrobeItem[]): (WardrobeItem & { goal: NonNullable<WardrobeItem['goal']> }) | null {
  let best: (WardrobeItem & { goal: NonNullable<WardrobeItem['goal']> }) | null = null;
  const ratio = (g: NonNullable<WardrobeItem['goal']>): number => (g.need > 0 ? g.have / g.need : 0);
  for (const it of items) {
    const g = it.goal;
    if (it.state !== 'locked' || !g) continue;
    if (!best || ratio(g) > ratio(best.goal) || (ratio(g) === ratio(best.goal) && g.need - g.have < best.goal.need - best.goal.have)) best = { ...it, goal: g };
  }
  return best;
}

/** Choix stable d'une phrase parmi plusieurs, d'après l'état du pet (pas d'aléa : même état, même phrase). */
export function pickLine<T>(lines: readonly T[], needs: Needs): T | undefined {
  if (lines.length === 0) return undefined;
  return lines[(needs.hunger + needs.energy + needs.mood) % lines.length];
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

export interface WeekSummary {
  /** Somme des variations de chaque jauge sur 7 jours (le quiz de création exclu). */
  deltas: { gauge: GaugeKey; value: number }[];
  /** Pets rencontrés sur la période. */
  met: number;
}

/** Bilan des 7 derniers jours à partir du journal du pet, plus forte variation d'abord. */
export function weekSummary(events: readonly PetEvent[], now: number): WeekSummary {
  const sums: Record<GaugeKey, number> = { social: 0, play: 0, tender: 0, talk: 0 };
  let met = 0;
  for (const e of events) {
    if (e.kind === 'quiz' || now - new Date(e.at).getTime() > WEEK_MS) continue;
    if (e.kind === 'met_new_pet') met += 1;
    for (const k of GAUGE_KEYS) sums[k] += e.delta[k] ?? 0;
  }
  const deltas = GAUGE_KEYS.map((gauge) => ({ gauge, value: sums[gauge] }))
    .filter((d) => d.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { deltas, met };
}

export interface FormStep {
  form: PetForm;
  /** Début de la période (ISO) ; `null` pour aujourd'hui. */
  since: string | null;
}

/**
 * Les dernières formes prises par le pet, en rejouant son journal (variations + retour vers 0 chaque jour).
 * Une forme par mois au plus ; la dernière étape est la forme actuelle.
 */
export function formHistory(events: readonly PetEvent[], current: PetForm, max = 3): FormStep[] {
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));
  const byMonth = new Map<string, FormStep>();
  let g: Gauges = ZERO_GAUGES;
  let last: number | null = null;
  for (const e of ordered) {
    const t = new Date(e.at).getTime();
    if (last !== null) g = decayGauges(g, Math.floor((t - last) / 86_400_000));
    g = addGauges(g, e.delta);
    last = t;
    const month = e.at.slice(0, 7);
    byMonth.set(month, { form: formOf(g), since: byMonth.get(month)?.since ?? e.at });
  }
  const past: FormStep[] = [];
  for (const step of byMonth.values()) if (past[past.length - 1]?.form !== step.form) past.push(step);
  while (past[past.length - 1]?.form === current) past.pop();
  return [...past.slice(-(max - 1)), { form: current, since: null }];
}
