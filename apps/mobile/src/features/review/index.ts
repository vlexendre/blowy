/**
 * Demande de note sur l'App Store « après utilisation » : uniquement la demande native d'Apple
 * (`StoreReview.requestReview()`, SKStoreReviewController ; App Review 5.6.1), jamais une fenêtre maison.
 * Les règles (3 jours, 5 sessions, 120 jours, ni erreur ni achat juste avant, hors inscription) sont dans `decide.ts`.
 * La mémoire reste sur le téléphone (AsyncStorage, `blowy.review`) : rien n'est envoyé.
 *
 * Les bons moments qui appellent `maybeAskForReview` : une rencontre acceptée (`useAcceptEncounter`), la fête d'un
 * palier de série refermée (accueil). Un délai laisse l'animation de
 * réussite se jouer d'abord.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EMPTY_REVIEW_MEMORY, onAsked, onForeground, type ReviewMemory, type ReviewMoment, shouldAskForReview } from './decide';

export type { ReviewMoment } from './decide';
export { shouldAskForReview } from './decide';

interface ReviewStore extends ReviewMemory {
  update: (f: (m: ReviewMemory) => ReviewMemory) => void;
}

const memoryOf = (s: ReviewStore): ReviewMemory => ({
  firstOpenAt: s.firstOpenAt,
  sessions: s.sessions,
  lastActiveAt: s.lastActiveAt,
  askedAt: s.askedAt,
  lastSetbackAt: s.lastSetbackAt,
  lastPurchaseAt: s.lastPurchaseAt,
});

export const useReviewMemory = create<ReviewStore>()(
  persist((set, get) => ({ ...EMPTY_REVIEW_MEMORY, update: (f) => set(f(memoryOf(get()))) }), {
    name: 'blowy.review',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => memoryOf(s),
  }),
);

/** Compte prêt (connecté, inscription finie) : posé par `SessionBridges`. Faux pendant l'inscription. */
let appReady = false;
export function setReviewReady(ready: boolean): void {
  appReady = ready;
}

/** Une erreur vient d'être montrée (requête échouée) : pas de demande de note juste après. */
export function noteReviewSetback(): void {
  useReviewMemory.getState().update((m) => ({ ...m, lastSetbackAt: Date.now() }));
}

/** Un achat vient d'avoir lieu : pas de demande de note juste après. */
export function noteReviewPurchase(): void {
  useReviewMemory.getState().update((m) => ({ ...m, lastPurchaseAt: Date.now() }));
}

/** Sessions et première ouverture : monté une fois (`SessionBridges`). */
export function useReviewSessions(): void {
  useEffect(() => {
    const mark = () => useReviewMemory.getState().update((m) => onForeground(m, Date.now()));
    const start = () => {
      if (useReviewMemory.persist.hasHydrated()) mark();
      else return useReviewMemory.persist.onFinishHydration(() => mark());
      return undefined;
    };
    const offHydration = start();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') mark();
    });
    return () => {
      offHydration?.();
      sub.remove();
    };
  }, []);
}

/** Délai par défaut : la fête (animation de réussite) se joue d'abord. */
const DEFAULT_DELAY_MS = 2500;
let pending: ReturnType<typeof setTimeout> | null = null;

/**
 * Après un bon moment : demande une note à Apple si toutes les règles le permettent. Ne lève jamais.
 * Apple décide ensuite seul d'afficher la demande (rien en TestFlight ni pendant la revue).
 */
export function maybeAskForReview(_moment: ReviewMoment, delayMs: number = DEFAULT_DELAY_MS): void {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  if (pending || !shouldAskForReview(memoryOf(useReviewMemory.getState()), Date.now(), { ready: appReady }).ask) return;
  pending = setTimeout(() => {
    pending = null;
    void (async () => {
      try {
        // Revérifié après le délai : une erreur a pu arriver, l'app a pu passer en arrière-plan.
        if (AppState.currentState !== 'active') return;
        if (!shouldAskForReview(memoryOf(useReviewMemory.getState()), Date.now(), { ready: appReady }).ask) return;
        if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
        useReviewMemory.getState().update((m) => onAsked(m, Date.now()));
        await StoreReview.requestReview();
      } catch {
        // Une demande de note ne doit jamais gêner.
      }
    })();
  }, delayMs);
}
