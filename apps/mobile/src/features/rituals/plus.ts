/**
 * Ouvrir Blowy+ depuis un écran des rituels. Petite enveloppe locale, à remplacer par l'aide `openPlus(reason)` du
 * chantier Blowy+ quand elle existera (même signature) : la raison dira au paywall ce qui a été touché.
 */
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Ce qui a mené au paywall depuis les rituels. */
export type PlusReason = 'habits' | 'jokers' | 'review';

export function useOpenPlus(): (reason: PlusReason) => void {
  const router = useRouter();
  return useCallback(
    (_reason: PlusReason) => {
      router.push('/moi/blowy-plus');
    },
    [router],
  );
}
