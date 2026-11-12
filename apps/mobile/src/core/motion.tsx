import { MotionFocus } from '@blowy/ui';
import { useIsFocused } from 'expo-router';
import type { ReactNode } from 'react';

/**
 * Enveloppe d'un écran : ses boucles d'animation (respiration du pet, reflets, « … ») s'arrêtent quand l'écran
 * n'est plus au premier plan (onglet quitté, écran recouvert). L'arrière-plan de l'app est géré par `MotionHost`.
 */
export function ScreenMotion({ children }: { children?: ReactNode }) {
  const focused = useIsFocused();
  return <MotionFocus active={focused}>{children}</MotionFocus>;
}
