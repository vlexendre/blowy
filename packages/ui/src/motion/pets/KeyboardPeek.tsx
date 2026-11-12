import type { Mood, Species } from '@blowy/domain';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

import type { PetPose } from '../../assets/pets';
import { useForeground } from '../../lib/motion';
import { PetPeek, type PeekEdge } from './PetPeek';

export interface KeyboardPeekProps {
  species: Species;
  /** Humeur. Défaut `joie`. */
  mood?: Mood | PetPose;
  /** Coin où il regarde par-dessus le clavier. Défaut `right` (loin du champ, souvent à gauche). */
  side?: 'left' | 'right';
  /** Taille du buste. Défaut 72. */
  size?: number;
  seed?: string;
  /**
   * Hauteur à laisser libre au-dessus du clavier (pied collé au clavier : bouton principal…). Défaut 0.
   * Le pet regarde alors par-dessus ce pied, sans jamais le couvrir.
   */
  above?: number;
}

/**
 * Sur un formulaire : quand le clavier s'ouvre, le pet passe la tête par-dessus, dans un coin, puis se cache quand
 * il se ferme. Il reste au-dessus du clavier, hors des champs (coin opposé au champ). iOS et Android ;
 * sur le web (pas d'événement clavier), rien ne s'affiche.
 */
export function KeyboardPeek({ species, mood = 'joie', side = 'right', size = 72, seed, above = 0 }: KeyboardPeekProps) {
  const win = useWindowDimensions();
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, (e) => setTop(e.endCoordinates.screenY));
    const b = Keyboard.addListener(hideEvt, () => setTop(null));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);
  useForeground(() => setTop(null));
  const edge: PeekEdge = side === 'left' ? 'bottom-left' : 'bottom-right';
  return (
    <PetPeek
      species={species}
      mood={mood}
      edges={[edge]}
      visible={top !== null}
      size={size}
      seed={seed}
      hideAndSeek={false}
      safe={{ bottom: top !== null ? Math.max(0, win.height - top) + above : above }}
    />
  );
}
