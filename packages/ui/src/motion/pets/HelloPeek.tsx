import type { Species } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useOverlayOpen } from '../../lib/overlay';
import { claimHelloPeek } from './peekBudget';
import { PetPeek, type PeekSafeArea } from './PetPeek';

export interface HelloPeekProps {
  species: Species;
  seed?: string;
  /** Zones à ne pas couvrir (défaut : au-dessus de la barre d'onglets). */
  safe?: PeekSafeArea;
  /** Durée du salut (ms). Défaut 2400. */
  duration?: number;
  /**
   * Un écran à onglets est au premier plan (barre visible). Faux (écran poussé, inscription) : aucun salut, et
   * un salut en cours se cache. Défaut vrai.
   */
  active?: boolean;
}

/**
 * Quand l'app revient au premier plan après une vraie absence, le pet passe parfois la tête dans un coin bas et
 * fait coucou, puis se cache. Rare (`peekBudget`) : au plus une fois par session, jamais à moins de 3 min d'une
 * autre apparition, seulement sur un écran à onglets et jamais par-dessus une feuille. À poser une fois sous les onglets.
 */
export function HelloPeek({ species, seed, safe, duration = 2400, active = true }: HelloPeekProps) {
  const [shown, setShown] = useState(0);
  const sheet = useOverlayOpen();
  const awayAt = useRef<number | null>(null);
  const allowed = useRef(active && !sheet);
  allowed.current = active && !sheet;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') awayAt.current ??= Date.now();
      else if (s === 'active' && awayAt.current !== null) {
        const away = Date.now() - awayAt.current;
        awayAt.current = null;
        if (allowed.current && claimHelloPeek(seed ?? species, away)) setShown((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, [seed, species]);
  if (!shown) return null;
  return (
    <PetPeek
      key={shown}
      species={species}
      mood="salut"
      edges={['bottom-left']}
      seed={seed}
      safe={safe}
      duration={duration}
      visible={active && !sheet}
      hideAndSeek={false}
      onHidden={() => setShown(0)}
    />
  );
}

/**
 * Le même salut, sans rien poser par-dessus l'écran : au retour dans l'app (mêmes règles que `HelloPeek`, budget
 * partagé), appelle `onHello` pour que le minimoa déjà à l'écran (scène de l'accueil) fasse coucou lui-même.
 * Ne couvre donc jamais une carte ni un bouton. `active` : l'écran est au premier plan (sinon rien n'est consommé).
 */
export function useHelloWave(onHello: () => void, { seed, active = true }: { seed?: string; active?: boolean }): void {
  const sheet = useOverlayOpen();
  const awayAt = useRef<number | null>(null);
  const allowed = useRef(active && !sheet);
  allowed.current = active && !sheet;
  const cb = useRef(onHello);
  cb.current = onHello;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') awayAt.current ??= Date.now();
      else if (s === 'active' && awayAt.current !== null) {
        const away = Date.now() - awayAt.current;
        awayAt.current = null;
        if (allowed.current && seed && claimHelloPeek(seed, away)) cb.current();
      }
    });
    return () => sub.remove();
  }, [seed]);
}
