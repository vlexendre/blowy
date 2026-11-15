import type { Gender, LatLng, Me, OnboardInput, Seeking, VisionAnswer, Whom } from '@blowy/contract';
import { type Species, VISION_TEST_IDS } from '@blowy/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { keys, useApi } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { getLocale } from '@/locales/runtime';

export * from './vision';
export * from './permissions';

/** Les écrans du parcours d'inscription qu'on peut reprendre (nom de la route dans `app/(onboarding)`). */
export const RESUMABLE = ['craft', 'vision', 'ta-vision', 'prenom', 'sexe', 'cherche', 'naissance', 'localisation', 'notifications', 'promesse', 'connexion'] as const;
export type OnboardingStep = (typeof RESUMABLE)[number];

export type PermissionAnswer = 'granted' | 'denied' | 'unavailable';

/**
 * Brouillon de création : le minimoa, le test et les réponses sont faits avant que le compte existe. Il est gardé sur
 * le téléphone (AsyncStorage, localStorage sur le web) : revenir en arrière, recharger ou quitter l'app ne perd rien,
 * et l'app rouvre l'inscription là où la personne s'était arrêtée (`step`). Vidé à la création du compte, ou tout de
 * suite si la personne a moins de 18 ans.
 */
interface DraftData {
  petName: string;
  species: Species;
  /** Réponses au test de vision (une par situation, la dernière compte). */
  visionAnswers: VisionAnswer[];
  displayName: string;
  gender: Gender | null;
  seeking: Seeking | null;
  /** Pour « plus » ou « les deux » seulement. */
  whom: Whom | null;
  /** Accord explicite pour « qui tu veux rencontrer » (donnée sensible). */
  sensitiveConsent: boolean;
  birthdate: string;
  /** Réponse à la demande de position, et le point relevé si elle est accordée. */
  locationAnswer: PermissionAnswer | null;
  location: LatLng | null;
  notificationsAnswer: PermissionAnswer | null;
  inviteCode: string;
  email: string;
  /** Dernier écran atteint (reprise). */
  step: OnboardingStep | null;
}

interface Draft extends DraftData {
  set: (patch: Partial<DraftData>) => void;
  /** Enregistre (ou remplace) la réponse à une situation du test. */
  answer: (a: VisionAnswer) => void;
  /** Retire la réponse à une situation (retour arrière dans le test). */
  unanswer: (questionId: string) => void;
  reset: () => void;
}

const empty: DraftData = {
  petName: '',
  species: 'nino',
  visionAnswers: [],
  displayName: '',
  gender: null,
  seeking: null,
  whom: null,
  sensitiveConsent: false,
  birthdate: '',
  locationAnswer: null,
  location: null,
  notificationsAnswer: null,
  inviteCode: '',
  email: '',
  step: null,
};

export const useDraft = create<Draft>()(
  persist(
    (set) => ({
      ...empty,
      set: (patch) => set(patch),
      answer: (a) => set((s) => ({ visionAnswers: [...s.visionAnswers.filter((x) => x.questionId !== a.questionId), a] })),
      unanswer: (id) => set((s) => ({ visionAnswers: s.visionAnswers.filter((x) => x.questionId !== id) })),
      reset: () => set(empty),
    }),
    {
      name: 'blowy.onboarding.draft',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _s, answer: _a, unanswer: _u, reset: _r, ...data }) => data,
      // Une version plus ancienne du brouillon (quiz de caractère, ville) : on repart de zéro.
      migrate: () => empty,
    },
  ),
);

/** Vrai une fois le brouillon relu depuis le téléphone (avant : ne rien décider). */
export function useDraftHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useDraft.persist.onFinishHydration(cb),
    () => useDraft.persist.hasHydrated(),
    () => true,
  );
}

/** Note l'écran courant : la reprise y ramène. */
export function useStep(step: OnboardingStep | null): void {
  useEffect(() => {
    if (step) useDraft.getState().set({ step });
  }, [step]);
}

export const isValidBirthdate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Le test est complet : une réponse par situation. */
export const visionDone = (answers: readonly VisionAnswer[]): boolean => VISION_TEST_IDS.every((id) => answers.some((a) => a.questionId === id));

/** « Qui tu cherches » est complet : potes, ou plus/les deux avec « qui » et l'accord explicite. */
export const seekingDone = (d: Pick<DraftData, 'seeking' | 'whom' | 'sensitiveConsent'>): boolean =>
  d.seeking === 'potes' || (!!d.seeking && !!d.whom && d.sensitiveConsent);

/** Le brouillon a tout ce qu'il faut pour créer le compte et le minimoa. */
export function isDraftComplete(d: DraftData = useDraft.getState()): boolean {
  return !!d.petName.trim() && !!d.displayName.trim() && isValidBirthdate(d.birthdate) && !!d.gender && seekingDone(d) && visionDone(d.visionAnswers);
}

/** Le brouillon a un minimoa (sinon, l'inscription repart de la création). */
export const hasDraftPet = (): boolean => !!useDraft.getState().petName.trim();

const stepHref = (step: OnboardingStep): Href => `/(onboarding)/${step}` as Href;

/**
 * Où reprendre un compte connecté sans minimoa : la préparation si le brouillon est complet, sinon l'écran où la
 * personne s'était arrêtée (jamais la connexion : elle est déjà connectée), sinon la création du minimoa.
 */
export function resumeOnboarding(): Href {
  const d = useDraft.getState();
  if (isDraftComplete(d)) return '/(onboarding)/preparation';
  if (hasDraftPet() && d.step && d.step !== 'connexion') return stepHref(d.step);
  return '/(onboarding)/craft';
}

/** Sans session : l'inscription en cours (écran où la personne s'était arrêtée) ou la bienvenue. */
export function signedOutStart(): Href {
  const d = useDraft.getState();
  return hasDraftPet() && d.step ? stepHref(d.step) : '/(onboarding)/welcome';
}

/** Un code d'invitation reçu par lien est recopié dans le brouillon (gardé si la personne quitte l'app). */
export function adoptPendingInvite(): void {
  const code = usePendingInvite.getState().code;
  const d = useDraft.getState();
  if (code && !d.inviteCode) d.set({ inviteCode: code });
}

/** Le corps de `POST /v1/me/onboard` à partir du brouillon (contrat : `OnboardInput`). */
export function onboardBody(d: DraftData = useDraft.getState()): OnboardInput {
  const seeking = d.seeking ?? 'potes';
  const whom = seeking === 'potes' ? undefined : (d.whom ?? undefined);
  const location = d.locationAnswer === 'granted' && d.location ? d.location : undefined;
  return {
    displayName: d.displayName.trim(),
    birthdate: d.birthdate,
    pet: { name: d.petName.trim(), species: d.species },
    inviteCode: d.inviteCode.trim() || undefined,
    gender: d.gender ?? 'non_dit',
    seeking,
    ...(whom ? { whom } : {}),
    locale: getLocale(),
    consents: { sensitive: !!whom && d.sensitiveConsent, location: !!location },
    ...(location ? { location } : {}),
    visionAnswers: d.visionAnswers,
  };
}

export function useOnboard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.me.onboard(onboardBody()),
    onSuccess: (me: Me) => {
      qc.setQueryData(keys.me, me);
      void qc.invalidateQueries({ queryKey: keys.links });
    },
  });
}

/** Les 12 situations, servies par l'API dans la langue de l'app (public : avant la connexion). */
export function useVisionTest() {
  const api = useApi();
  return useQuery({ queryKey: ['vision', 'test'], queryFn: api.vision.test, staleTime: 60 * 60_000 });
}

/**
 * La barre d'avancement continue, de la création du minimoa à la connexion. Chaque écran compte pour un cran ; le test
 * de vision compte pour ses 12 situations (`sub` : la situation en cours, 0 à 11).
 */
const FLOW: readonly [OnboardingStep, number][] = [
  ['craft', 1],
  ['vision', 12],
  ['ta-vision', 1],
  ['prenom', 1],
  ['sexe', 1],
  ['cherche', 1],
  ['naissance', 1],
  ['localisation', 1],
  ['notifications', 1],
  ['promesse', 1],
  ['connexion', 1],
];
const FLOW_TOTAL = FLOW.reduce((n, [, w]) => n + w, 0) + 1;

/** Avancement de la barre continue à une étape (0 à 1) et à l'étape d'avant (d'où elle part à l'arrivée). */
export function progressAt(step: OnboardingStep, sub = 0): { progress: number; progressFrom: number } {
  let before = 0;
  for (const [s, w] of FLOW) {
    if (s === step) {
      const at = before + Math.min(sub, w - 1) + 1;
      return { progress: at / FLOW_TOTAL, progressFrom: (at - 1) / FLOW_TOTAL };
    }
    before += w;
  }
  return { progress: 0, progressFrom: 0 };
}

/** Les lignes de la préparation (une coche par ligne) ; la dernière n'est cochée qu'une fois le minimoa vraiment créé. */
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

/**
 * Garde des écrans après la création du minimoa : attendre la relecture du brouillon, puis `missing` s'il n'y a pas
 * de minimoa (lien ouvert directement) → l'aiguillage décide.
 */
export function useDraftGate(): 'loading' | 'ok' | 'missing' {
  const hydrated = useDraftHydrated();
  const pet = useDraft((d) => d.petName);
  if (!hydrated) return 'loading';
  return pet.trim() ? 'ok' : 'missing';
}

/** « Fonder un foyer » → « fonder un foyer » (un libellé placé dans une phrase). */
export const lowerFirst = (s: string): string => (s ? s.charAt(0).toLocaleLowerCase() + s.slice(1) : s);
