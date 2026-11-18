/** Source d'arrivée gardée sur le téléphone (léger : lu aussi par `+native-intent`). */
import type { AttributionDto } from '@blowy/contract';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { attributionFromUrl, type LinkAttribution } from '@/features/notifications/url';

export interface AttributionState {
  /** Premier lien ouvert avant l'inscription (null : aucun). */
  link: LinkAttribution | null;
  firstOpenSent: boolean;
  signupSent: boolean;
  capture: (a: LinkAttribution | null) => void;
  set: (patch: Partial<Pick<AttributionState, 'firstOpenSent' | 'signupSent'>>) => void;
}

export const useAttribution = create<AttributionState>()(
  persist(
    (set, get) => ({
      link: null,
      firstOpenSent: false,
      signupSent: false,
      capture: (a) => {
        if (a && !get().link) set({ link: a });
      },
      set: (patch) => set(patch),
    }),
    {
      name: 'blowy.growth.attribution',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ link, firstOpenSent, signupSent }) => ({ link, firstOpenSent, signupSent }),
    },
  ),
);

/** Garde la source d'un lien reçu (appelé par `+native-intent` et au démarrage). */
export function captureUrl(url: string | null): void {
  if (!url) return;
  try {
    useAttribution.getState().capture(attributionFromUrl(url));
  } catch {
    // Jamais bloquant.
  }
}

/** Ce que l'app envoie avec l'inscription (et au premier lancement). */
export function currentAttribution(): AttributionDto {
  const link = useAttribution.getState().link;
  return link ? { source: link.source, ref: link.ref } : { source: 'store' };
}

