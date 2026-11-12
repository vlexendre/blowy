import { useEffect, useState } from 'react';

import { useReducedMotion } from '../lib/motion';

export interface RevealOptions {
  /** Écart entre deux mots (ms). Défaut 70. */
  step?: number;
  /** Attente avant le premier mot (ms). Défaut 0. */
  delay?: number;
  /** Faux : tout est montré d'emblée. Défaut vrai. */
  enabled?: boolean;
  /** Changer cette valeur relance la révélation (ex. la phrase). */
  key?: string | number;
}

/**
 * Révélation mot à mot : renvoie le nombre de mots à montrer (`total` à la fin). Un rendu par mot, jamais par image.
 * À combiner avec des mots cachés par une encre transparente (la mise en page ne bouge pas, rien ne saute).
 * Avec « réduire les animations » : tout de suite `total`.
 */
export function useReveal(total: number, { step = 70, delay = 0, enabled = true, key }: RevealOptions = {}): number {
  const reduced = useReducedMotion();
  const on = enabled && !reduced;
  const [count, setCount] = useState(on ? 0 : total);
  useEffect(() => {
    if (!on) {
      setCount(total);
      return;
    }
    setCount(0);
    let n = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      n += 1;
      setCount(n);
      if (n < total) id = setTimeout(tick, step);
    };
    id = setTimeout(tick, delay);
    return () => clearTimeout(id);
  }, [on, total, step, delay, key]);
  return count;
}
