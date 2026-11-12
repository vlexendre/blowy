import { useEffect, useState } from 'react';

import { useReducedMotion } from '../lib/motion';

/**
 * Un pet « écrit » avant de parler : vrai pendant les `delay + duration` premières ms (montrer `TypingDots` ou
 * `MessageBubble typing`), puis faux (le texte arrive en « pop »). `key` qui change rejoue la pause. Animations réduites : toujours faux.
 */
export function useTypingPause(duration = 800, delay = 250, key?: string | number): boolean {
  const reduced = useReducedMotion();
  const [typing, setTyping] = useState(!reduced);
  useEffect(() => {
    if (reduced) {
      setTyping(false);
      return;
    }
    setTyping(true);
    const id = setTimeout(() => setTyping(false), delay + duration);
    return () => clearTimeout(id);
  }, [reduced, duration, delay, key]);
  return typing;
}
