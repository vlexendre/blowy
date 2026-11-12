import { useEffect, useState } from 'react';

/** Dernier niveau vu de chaque lien pendant la session (la première vue sert de référence, sans fête). */
const seen = new Map<string, number>();

/**
 * Passages de niveau à fêter : s'incrémente quand le niveau du lien dépasse le dernier niveau vu (pendant qu'on
 * écrit, ou en ouvrant l'écran après coup). Un passage n'est fêté qu'une fois, par le premier écran qui le voit.
 */
export function useLevelUps(id: string, level: number | undefined): number {
  const [ups, setUps] = useState(0);
  useEffect(() => {
    if (level === undefined) return;
    const before = seen.get(id);
    if (before === undefined || level > before) seen.set(id, level);
    if (before !== undefined && level > before) setUps((n) => n + 1);
  }, [id, level]);
  return ups;
}
