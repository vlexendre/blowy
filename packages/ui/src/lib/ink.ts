import { createContext, useContext } from 'react';

import { color } from '../theme';

/**
 * Couleur d'encre courante : un `Panel` sur fond clair la passe en sombre,
 * et `Text` / `Title` / glyphes la suivent sans qu'on la répète.
 */
export const InkContext = createContext<string>(color.white);
export const InkProvider = InkContext.Provider;
export const useInk = (): string => useContext(InkContext);
