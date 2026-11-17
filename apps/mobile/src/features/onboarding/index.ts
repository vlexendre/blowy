import type { Gender, LatLng, Me, OnboardInput, QuizResultDto, VisionAnswer } from '@blowy/contract';
import { type Gauges, type Species, VISION_TEST_IDS } from '@blowy/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { keys, useApi } from '@/core';
import { usePendingInvite } from '@/features/encounters';
import { currentAttribution } from '@/features/growth/attribution';
import { useDeepLink } from '@/features/notifications/deeplink';
import { getLocale } from '@/locales/runtime';

import { readPosition } from './permissions';

export * from './vision';
export * from './permissions';

/** Les écrans du parcours d'inscription qu'on peut reprendre (nom de la route dans `app/(onboarding)`). */
export const RESUMABLE = ['craft', 'vision', 'ta-vision', 'prenom', 'sexe', 'habitudes', 'naissance', 'localisation', 'notifications', 'promesse', 'connexion'] as const;
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
  /** Étape « Tes habitudes » (spéc. §25) : identifiants du catalogue, 2 au plus (vide : « Plus tard »). */
  habits: string[];
  birthdate: string;
  /** Réponse à la demande de position, et le point relevé si elle est accordée. */
  locationAnswer: PermissionAnswer | null;
  location: LatLng | null;
  notificationsAnswer: PermissionAnswer | null;
  /** Code tapé à l'étape du prénom (« Un code ? ») : invitation, groupe, créateur ou « 3 mots ». */
  inviteCode: string;
  /** Ce qu'est ce code (vérifié par l'API) ; null : pas vérifié ou inconnu (envoyé comme invitation, ignoré s'il ne l'est pas). */
  codeKind: 'creator' | 'invite' | 'group' | 'words' | 'quiz' | 'quartier' | null;
  /** Caractère de départ venu du quiz du site (« Quel minimoa es-tu ? ») : les jauges du résultat ; null sinon. */
  quizGauges: Gauges | null;
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
  habits: [],
  birthdate: '',
  locationAnswer: null,
  location: null,
  notificationsAnswer: null,
  inviteCode: '',
  codeKind: null,
  quizGauges: null,
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
      // La position n'est jamais gardée sur le téléphone : relevée à nouveau au moment de créer le compte.
      partialize: ({ set: _s, answer: _a, unanswer: _u, reset: _r, location: _l, ...data }) => data,
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

/** Le brouillon a tout ce qu'il faut pour créer le compte et le minimoa. */
export function isDraftComplete(d: DraftData = useDraft.getState()): boolean {
  return !!d.petName.trim() && !!d.displayName.trim() && isValidBirthdate(d.birthdate) && !!d.gender && visionDone(d.visionAnswers);
}

/** Le brouillon a un minimoa (sinon, l'inscription repart de la création). */
export const hasDraftPet = (): boolean => !!useDraft.getState().petName.trim();

/**
 * Écran de reprise connu. Un brouillon d'avant le 17 nov. peut encore s'être arrêté sur « ce que tu cherches »
 * (étape retirée, spéc. §27) : il reprend à l'étape qui suivait.
 */
const knownStep = (step: string | null): OnboardingStep | null =>
  step === 'cherche' ? 'habitudes' : step && (RESUMABLE as readonly string[]).includes(step) ? (step as OnboardingStep) : null;

const stepHref = (step: OnboardingStep): Href => `/(onboarding)/${step}` as Href;

/**
 * Où reprendre un compte connecté sans minimoa : la préparation si le brouillon est complet, sinon l'écran où la
 * personne s'était arrêtée (jamais la connexion : elle est déjà connectée), sinon la création du minimoa.
 */
export function resumeOnboarding(): Href {
  const d = useDraft.getState();
  if (isDraftComplete(d)) return '/(onboarding)/preparation';
  const step = knownStep(d.step);
  if (hasDraftPet() && step && step !== 'connexion') return stepHref(step);
  return '/(onboarding)/craft';
}

/** Sans session : l'inscription en cours (écran où la personne s'était arrêtée) ou la bienvenue. */
export function signedOutStart(): Href {
  const d = useDraft.getState();
  const step = knownStep(d.step);
  return hasDraftPet() && step ? stepHref(step) : '/(onboarding)/welcome';
}

/** Un code d'invitation reçu par lien est recopié dans le brouillon (gardé si la personne quitte l'app). */
export function adoptPendingInvite(): void {
  const code = usePendingInvite.getState().code;
  const d = useDraft.getState();
  if (code && !d.inviteCode) d.set({ inviteCode: code });
}

/**
 * Résultat du quiz du site repris (lien `minimoa://quiz/<code>` ou code tapé) : l'espèce et le caractère de départ du
 * minimoa ; le nom suit l'espèce tant que la personne ne l'a pas changé. Le code part avec l'inscription (source « quiz »).
 */
export function adoptQuizResult(r: QuizResultDto, speciesName: (s: Species) => string, isDefaultName: (name: string) => boolean): void {
  const d = useDraft.getState();
  d.set({
    species: r.species,
    quizGauges: r.gauges,
    ...(isDefaultName(d.petName) ? { petName: speciesName(r.species) } : {}),
    ...(!d.inviteCode || d.codeKind === 'quiz' ? { inviteCode: r.code, codeKind: 'quiz' as const } : {}),
  });
}

/** Le corps de `POST /v1/me/onboard` à partir du brouillon (contrat : `OnboardInput`). */
export function onboardBody(d: DraftData = useDraft.getState(), fix: LatLng | null = null): OnboardInput {
  const point = fix ?? d.location;
  const location = d.locationAnswer === 'granted' && point ? point : undefined;
  const code = d.inviteCode.trim();
  const kind = d.codeKind ?? null;
  return {
    displayName: d.displayName.trim(),
    birthdate: d.birthdate,
    pet: { name: d.petName.trim(), species: d.species },
    // Caractère de départ du quiz du site, s'il a été repris.
    ...(d.quizGauges ? { quiz: d.quizGauges } : {}),
    inviteCode: code && (kind === null || kind === 'invite') ? code : undefined,
    // Un code tapé (créateur, groupe, « 3 mots ») passe avant le premier lien ouvert (docs/VIRALITE.md).
    attribution: code && kind && kind !== 'invite' ? { source: kind, ref: code } : currentAttribution(),
    gender: d.gender ?? 'non_dit',
    locale: getLocale(),
    consents: { location: !!location },
    ...(location ? { location } : {}),
    visionAnswers: d.visionAnswers,
    // Brouillon d'avant l'étape : pas de champ, aucune habitude (« tous les jours » par défaut côté serveur).
    habits: (d.habits ?? []).slice(0, 2).map((habitId) => ({ habitId })),
  };
}

export function useOnboard() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const d = useDraft.getState();
      // Position du moment, pas celle de l'écran « localisation » (parfois une position en cache, ou d'ailleurs).
      const fix = d.locationAnswer === 'granted' ? await readPosition() : null;
      return api.me.onboard(onboardBody(d, fix));
    },
    onSuccess: (me: Me) => {
      qc.setQueryData(keys.me, me);
      // Code d'un groupe tapé à l'inscription : sa page « rejoindre » s'ouvre juste après.
      const d = useDraft.getState();
      if (d.codeKind === 'group' && d.inviteCode.trim()) useDeepLink.getState().park(`/g/${d.inviteCode.trim().toUpperCase()}`);
      void qc.invalidateQueries({ queryKey: keys.links });
    },
  });
}

/** Un résultat du quiz du site (public, avant la connexion). */
export function useQuizResult(code: string | null) {
  const api = useApi();
  return useQuery({ queryKey: ['quiz', code], queryFn: () => api.quiz.result(code ?? ''), enabled: !!code, staleTime: 60 * 60_000, retry: false });
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
  ['habitudes', 1],
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
