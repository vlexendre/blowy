import { useEffect, useState } from 'react';

/** Clés des moments déjà joués dans la session (révélations, cascades d'un écran) ; bornées. */
const SEEN = new Set<string>();
const SEEN_MAX = 2000;

/** Le moment `key` a déjà été joué (lecture seule). */
export function seenOnce(key: string): boolean {
  return SEEN.has(key);
}

/** Note le moment `key` comme joué. */
export function markOnce(key: string): void {
  if (SEEN.size > SEEN_MAX) SEEN.clear();
  SEEN.add(key);
}

/**
 * Vrai si ce montage est la toute première apparition de `key` dans la session (sans clé : toujours vrai).
 * La clé est notée après le rendu : un double rendu de développement ne la consomme pas.
 */
export function useFirstTime(key: string | undefined): boolean {
  const [first] = useState(() => (key ? !SEEN.has(key) : true));
  useEffect(() => {
    if (key) markOnce(key);
  }, [key]);
  return first;
}
