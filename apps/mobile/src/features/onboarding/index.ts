import type { Me } from '@blowy/contract';
import { addGauges, GAUGE_KEYS, type GaugeKey, type Gauges, type Species, ZERO_GAUGES } from '@blowy/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { keys, useApi } from '@/core';

/** Brouillon de création : le pet est façonné avant que le compte existe. */
interface Draft {
  petName: string;
  species: Species;
  quiz: Gauges;
  displayName: string;
  birthdate: string;
  city: string;
  email: string;
  inviteCode: string;
  set: (patch: Partial<Omit<Draft, 'set' | 'answer' | 'reset'>>) => void;
  /** Ajoute l'effet d'une réponse du quiz de caractère. */
  answer: (delta: Partial<Gauges>) => void;
  reset: () => void;
}

const empty = { petName: '', species: 'nino' as Species, quiz: ZERO_GAUGES, displayName: '', birthdate: '', city: '', email: '', inviteCode: '' };

export const useDraft = create<Draft>((set) => ({
  ...empty,
  set: (patch) => set(patch),
  answer: (delta) => set((s) => ({ quiz: addGauges(s.quiz, delta) })),
  reset: () => set(empty),
}));

/** Questions du quiz de départ (ordre des jauges) : chaque réponse pousse une jauge d'un côté. */
export const QUIZ: { choices: [QuizChoice, QuizChoice] }[] = [
  {
    choices: [
      { label: 'reste au chaud : plaid, série, pizza', emoji: '🛋️', delta: { social: -30 } },
      { label: 'sort. on verra bien où ça finit', emoji: '🪩', delta: { social: 30 } },
    ],
  },
  {
    choices: [
      { label: 'un bon livre et le bruit de la pluie', emoji: '📖', delta: { play: -30 } },
      { label: 'tournoi de uno, mauvaise foi incluse', emoji: '🃏', delta: { play: 30 } },
    ],
  },
  {
    choices: [
      { label: 'tu le chambres. c’est de l’amour aussi', emoji: '🌶️', delta: { tender: -30 } },
      { label: 'câlin direct, et on n’en parle plus', emoji: '🫶', delta: { tender: 30 } },
    ],
  },
  {
    choices: [
      { label: 'tu réponds « ok 👍 »', emoji: '🤐', delta: { talk: -30 } },
      { label: 'tu en renvoies un de 6', emoji: '🎙️', delta: { talk: 30 } },
    ],
  },
];

interface QuizChoice {
  label: string;
  emoji: string;
  delta: Partial<Gauges>;
}

/** Les deux traits les plus marqués du caractère de départ (pôle de chaque jauge), dans l'ordre des maquettes. */
export function strongestTraits(quiz: Gauges): [GaugeKey, GaugeKey] {
  const order = GAUGE_KEYS.map((k, i) => ({ k, i, v: Math.abs(quiz[k]) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .sort((a, b) => b.i - a.i);
  return [order[0]?.k ?? 'play', order[1]?.k ?? 'social'];
}

export const isValidBirthdate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** « 14 / 03 / 1999 » → « 1999-03-14 » ; chaîne vide si incomplet. */
export function birthdateFromInput(input: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.replace(/\s/g, ''));
  if (!m) return '';
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : '';
}

export function useOnboard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const d = useDraft.getState();
      return api.me.onboard({
        displayName: d.displayName.trim(),
        birthdate: d.birthdate,
        city: d.city.trim() || undefined,
        pet: { name: d.petName.trim(), species: d.species },
        quiz: d.quiz,
        inviteCode: d.inviteCode.trim() || undefined,
      });
    },
    onSuccess: (me: Me) => {
      qc.setQueryData(keys.me, me);
      void qc.invalidateQueries({ queryKey: keys.links });
    },
  });
}
