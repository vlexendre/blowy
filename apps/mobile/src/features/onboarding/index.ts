import type { Me } from '@blowy/contract';
import { addGauges, GAUGE_KEYS, type GaugeKey, type Gauges, type Species, ZERO_GAUGES } from '@blowy/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * Questions du quiz de départ (ordre des jauges) : chaque réponse pousse une jauge d'un côté. Le pet pose la question
 * (`locales/onboarding.ts` → `caractere.host`, « samedi soir, moi je… ») et la réponse finit sa phrase.
 */
export const QUIZ: { choices: [QuizChoice, QuizChoice] }[] = [
  {
    choices: [
      { label: 'reste au chaud : plaid, série, pizza', emoji: '🛋️', delta: { social: -30 } },
      { label: 'sors. on verra bien où ça finit', emoji: '🪩', delta: { social: 30 } },
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
      { label: 'le chambre. c’est de l’amour aussi', emoji: '🌶️', delta: { tender: -30 } },
      { label: 'lui fais un câlin, et on n’en parle plus', emoji: '🫶', delta: { tender: 30 } },
    ],
  },
  {
    choices: [
      { label: 'réponds « ok 👍 »', emoji: '🤐', delta: { talk: -30 } },
      { label: 'en renvoie un de 6', emoji: '🎙️', delta: { talk: 30 } },
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

/**
 * Les étapes de l'inscription qui ont la barre continue, dans l'ordre. La barre avance d'un cran par écran, de la
 * création du pet au code ; la préparation a sa propre barre.
 */
export const FLOW = ['craft', 'q1', 'q2', 'q3', 'q4', 'traits', 'prenom', 'naissance', 'ville', 'promesse', 'email', 'code'] as const;
export type FlowStep = (typeof FLOW)[number];

/** Avancement de la barre continue à une étape (0 à 1) et à l'étape d'avant (d'où elle part à l'arrivée). */
export function progressAt(step: FlowStep): { progress: number; progressFrom: number } {
  const i = FLOW.indexOf(step);
  const n = FLOW.length + 1;
  return { progress: (i + 1) / n, progressFrom: i / n };
}

/** Le brouillon a tout ce qu'il faut pour créer le compte et le pet (sinon : rechargement, on reprend au début). */
export function isDraftComplete(d: Pick<Draft, 'petName' | 'displayName' | 'birthdate'> = useDraft.getState()): boolean {
  return !!d.petName.trim() && !!d.displayName.trim() && isValidBirthdate(d.birthdate);
}

/** Où reprendre un compte connecté sans pet : la préparation si le brouillon est complet, sinon la création du pet. */
export function resumeOnboarding(): Href {
  return isDraftComplete() ? '/(onboarding)/preparation' : '/(onboarding)/craft';
}

/** Les lignes de la préparation (une coche par ligne) ; la dernière n'est cochée qu'une fois le pet vraiment créé. */
export const PREP_LINES = 4;
/** Pourcentage montré à chaque ligne cochée (0 à 4). */
const PREP_PERCENT = [4, 29, 56, 83, 100] as const;
/** Une ligne cochée toutes les… (ms). 4 lignes + la pause finale ≈ 2,5 s si la création répond vite. */
const PREP_TICK = 520;
const PREP_LAST = 380;

/**
 * Rythme de l'écran de préparation : coche une ligne toutes les 0,52 s, mais jamais la dernière (ni 100 %) avant que
 * la création ait réussi (`succeeded`). Une erreur (`failed`) arrête tout sur place. `finished` passe à vrai une
 * fraction de seconde après 100 % ; `skip()` (un tap) y va tout de suite dès que la création a réussi.
 * Honnête : la barre ne finit jamais avant le serveur, et ne retient la personne que 2,5 s au plus de plus.
 */
export function usePrepTicker({ succeeded, failed }: { succeeded: boolean; failed: boolean }) {
  const [done, setDone] = useState(0);
  const [finished, setFinished] = useState(false);
  const wantsSkip = useRef(false);
  const max = succeeded ? PREP_LINES : PREP_LINES - 1;
  useEffect(() => {
    if (failed || finished) return;
    if (succeeded && wantsSkip.current) {
      setDone(PREP_LINES);
      setFinished(true);
      return;
    }
    if (done >= PREP_LINES) {
      const id = setTimeout(() => setFinished(true), PREP_LAST);
      return () => clearTimeout(id);
    }
    if (done >= max) return;
    const id = setTimeout(() => setDone((n) => Math.min(n + 1, max)), PREP_TICK);
    return () => clearTimeout(id);
  }, [done, max, succeeded, failed, finished]);
  const skip = useCallback(() => {
    wantsSkip.current = true;
    if (succeeded) {
      setDone(PREP_LINES);
      setFinished(true);
    }
  }, [succeeded]);
  /** Repart de la ligne en cours (après « réessayer »). */
  const resume = useCallback(() => {
    wantsSkip.current = false;
  }, []);
  return { done, percent: PREP_PERCENT[done] ?? 100, finished, skip, resume };
}

/** Le brouillon a un pet (lu une fois à l'arrivée sur un écran du parcours : après un rechargement web, il est vide). */
export const hasDraftPet = (): boolean => !!useDraft.getState().petName.trim();
