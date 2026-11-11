import type { Me } from '@blowy/contract';
import { addGauges, type Gauges, type Species, ZERO_GAUGES } from '@blowy/domain';
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

/** Questions du quiz de départ : chaque réponse pousse une jauge d'un côté. */
export const QUIZ: { question: string; choices: [{ label: string; delta: Partial<Gauges> }, { label: string; delta: Partial<Gauges> }] }[] = [
  {
    question: 'un vendredi soir, ton pet préfère…',
    choices: [
      { label: 'un plaid et une série', delta: { social: -30 } },
      { label: 'sortir voir du monde', delta: { social: 30 } },
    ],
  },
  {
    question: 'devant un inconnu, il…',
    choices: [
      { label: 'observe d’abord', delta: { talk: -30 } },
      { label: 'raconte déjà sa vie', delta: { talk: 30 } },
    ],
  },
  {
    question: 'pour dire qu’il t’aime bien, il…',
    choices: [
      { label: 'te vanne gentiment', delta: { tender: -30 } },
      { label: 'te fait un câlin', delta: { tender: 30 } },
    ],
  },
  {
    question: 'son week-end idéal…',
    choices: [
      { label: 'tranquille, sans plan', delta: { play: -30 } },
      { label: 'des jeux et des défis', delta: { play: 30 } },
    ],
  },
];

export const isValidBirthdate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** « 14/03/1999 » → « 1999-03-14 » ; chaîne vide si incomplet. */
export function birthdateFromInput(input: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
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
