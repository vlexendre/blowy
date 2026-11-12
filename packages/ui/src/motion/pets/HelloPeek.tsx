import type { Species } from '@blowy/domain';
import { useState } from 'react';

import { useForeground } from '../../lib/motion';
import { PetPeek, type PeekSafeArea } from './PetPeek';

export interface HelloPeekProps {
  species: Species;
  seed?: string;
  /** Zones à ne pas couvrir (défaut : au-dessus de la barre d'onglets). */
  safe?: PeekSafeArea;
  /** Durée du salut (ms). Défaut 2400. */
  duration?: number;
}

/**
 * Quand l'app revient au premier plan (après un passage en arrière-plan), le pet passe la tête dans un coin bas
 * et fait coucou, une fois, puis se cache. À poser une fois sous les onglets.
 */
export function HelloPeek({ species, seed, safe, duration = 2400 }: HelloPeekProps) {
  const [shown, setShown] = useState(0);
  useForeground(() => setShown((n) => n + 1));
  if (!shown) return null;
  return <PetPeek key={shown} species={species} mood="salut" edges={['bottom-left']} seed={seed} safe={safe} duration={duration} hideAndSeek={false} />;
}
