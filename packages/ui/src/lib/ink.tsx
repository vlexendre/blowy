import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { alpha, color, opacity } from '../theme';

interface InkSet {
  ink: string;
  mute: string;
}

/**
 * Couleur d'encre courante : un `Panel` sur fond clair la passe en sombre,
 * et `Text` / `Title` / glyphes la suivent sans qu'on la répète.
 * `mute` = texte secondaire : lavande sur la nuit, encre à 70 % sur un panneau coloré.
 */
const InkContext = createContext<InkSet>({ ink: color.white, mute: color.mute });

export function InkProvider({ value, mute, children }: { value: string; mute?: string; children?: ReactNode }) {
  const set = useMemo(() => ({ ink: value, mute: mute ?? alpha(value, opacity.mute) }), [value, mute]);
  return <InkContext.Provider value={set}>{children}</InkContext.Provider>;
}

export const useInk = (): string => useContext(InkContext).ink;
export const useMute = (): string => useContext(InkContext).mute;
