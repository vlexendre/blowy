import { useCallback, useEffect, useRef, useState } from 'react';

export interface SceneStepsOptions {
  /** Durée de chaque temps (ms). Défaut 1150. */
  step?: number;
  /** Appelé une seule fois, après le dernier temps (ou `skip`). */
  onDone?: () => void;
  /** Faux : la scène reste sur place (pas de minuterie). Défaut vrai. */
  enabled?: boolean;
}

/**
 * Minuterie d'une petite scène en plusieurs temps (entrée en scène de l'inscription) : `index` avance seul toutes les
 * `step` ms ; `next()` passe tout de suite au temps suivant (un tap), `skip()` va à la fin. Jamais bloquant : la scène
 * entière dure `count × step` sans rien toucher, et chaque tap la raccourcit.
 */
export function useSceneSteps(count: number, { step = 1150, onDone, enabled = true }: SceneStepsOptions = {}) {
  const [index, setIndex] = useState(0);
  const done = useRef(false);
  const finish = useRef(onDone);
  finish.current = onDone;
  const end = useCallback(() => {
    if (done.current) return;
    done.current = true;
    finish.current?.();
  }, []);
  useEffect(() => {
    if (!enabled || done.current) return;
    const id = setTimeout(() => (index < count - 1 ? setIndex(index + 1) : end()), step);
    return () => clearTimeout(id);
  }, [index, count, step, enabled, end]);
  const next = useCallback(() => {
    if (done.current) return;
    setIndex((i) => {
      if (i < count - 1) return i + 1;
      // Dernier temps : un tap termine la scène (hors du rendu, pour ne rien appeler pendant un setState).
      setTimeout(end, 0);
      return i;
    });
  }, [count, end]);
  return { index, next, skip: end };
}
