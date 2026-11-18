/**
 * Statistiques d'usage (Amplitude, États-Unis) : rien ne part sans l'accord de la personne (RGPD, CNIL). Le choix est
 * gardé sur le téléphone ; tant qu'il n'est pas « oui », le SDK est initialisé désactivé (`optOut`). Il se pose juste
 * avant la création du compte (`app/(onboarding)/statistiques.tsx`) et se change dans Moi › Réglages.
 */
import { setOptOut, track } from '@amplitude/analytics-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** `null` : la question n'a pas encore été posée (vaut un refus). */
export type AnalyticsChoice = 'granted' | 'denied' | null;

interface AnalyticsConsentState {
  choice: AnalyticsChoice;
  setChoice: (choice: 'granted' | 'denied') => void;
}

export const useAnalyticsConsent = create<AnalyticsConsentState>()(
  persist(
    (set) => ({
      choice: null,
      setChoice: (choice) => set({ choice }),
    }),
    {
      name: 'blowy.analytics.consent',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ choice }) => ({ choice }),
    },
  ),
);

/** Vrai une fois le choix relu depuis le téléphone (avant : ne rien décider). */
export function useAnalyticsConsentHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAnalyticsConsent.persist.onFinishHydration(cb),
    () => useAnalyticsConsent.persist.hasHydrated(),
    () => true,
  );
}

/** Vrai si la personne a dit oui, une fois le choix relu depuis le téléphone. */
export function analyticsConsentLoaded(): Promise<boolean> {
  const granted = () => useAnalyticsConsent.getState().choice === 'granted';
  if (useAnalyticsConsent.persist.hasHydrated()) return Promise.resolve(granted());
  return new Promise((resolve) => {
    const off = useAnalyticsConsent.persist.onFinishHydration(() => {
      off();
      resolve(granted());
    });
  });
}

/** Enregistre le choix et l'applique tout de suite au SDK (avant l'initialisation, l'appel attend son tour). */
export function setAnalyticsConsent(granted: boolean): void {
  useAnalyticsConsent.getState().setChoice(granted ? 'granted' : 'denied');
  setOptOut(!granted);
}

/** Compte et minimoa créés : seulement avec l'accord. */
export function trackAccountCreated(): void {
  if (useAnalyticsConsent.getState().choice === 'granted') void track('Account Created');
}
