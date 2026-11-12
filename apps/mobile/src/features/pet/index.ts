import type { PetEvent } from '@blowy/contract';
import { addGauges, decayGauges, formOf, GAUGE_KEYS, type GaugeKey, type Gauges, type PetForm, ZERO_GAUGES } from '@blowy/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi } from '@/core';

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
      void qc.invalidateQueries({ queryKey: keys.me });
    },
  });
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
