import { useMemo, useRef } from 'react';

/** Empreinte 32 bits d'une chaîne (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : même graine, même suite. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Seed {
  /** Nombre dans [0, 1). */
  next: () => number;
  /** Nombre dans [min, max). */
  range: (min: number, max: number) => number;
  /** Élément au hasard ; avec `avoid`, jamais celui-là (pas deux fois de suite la même blague). */
  pick: <T>(items: readonly T[], avoid?: T) => T;
  /** Vrai avec la probabilité `p`. */
  chance: (p: number) => boolean;
}

/** Suite déterministe tirée d'une graine (ex. `hashString(petId) ^ minute`). */
export function makeSeed(seed: number): Seed {
  const rand = mulberry32(seed);
  const next = () => rand();
  return {
    next,
    range: (min, max) => min + (max - min) * rand(),
    pick: <T>(items: readonly T[], avoid?: T): T => {
      const pool = avoid === undefined || items.length < 2 ? items : items.filter((i) => i !== avoid);
      return pool[Math.floor(rand() * pool.length)] ?? (items[0] as T);
    },
    chance: (p) => rand() < p,
  };
}

/** Minute courante (horloge de l'appareil) : la graine change chaque minute. */
export function currentMinute(now: number = Date.now()): number {
  return Math.floor(now / 60_000);
}

/**
 * Hasard déterministe d'un pet (règle 8) : graine = id du pet + minute courante. Deux rendus à la même minute
 * jouent la même suite (tests reproductibles) ; la suite avance à chaque tirage, et `pick(…, avoid)` évite de
 * rejouer deux fois de suite la même chose. `salt` sépare deux usages (ex. « idle » et « peek »).
 */
export function useSeed(id: string | undefined, salt = ''): Seed {
  const base = useRef<{ minute: number; seed: Seed } | null>(null);
  const key = `${id ?? 'pet'}:${salt}`;
  return useMemo(() => {
    const get = (): Seed => {
      const minute = currentMinute();
      if (!base.current || base.current.minute !== minute) base.current = { minute, seed: makeSeed(hashString(key) ^ minute) };
      return base.current.seed;
    };
    base.current = null;
    return {
      next: () => get().next(),
      range: (a, b) => get().range(a, b),
      pick: (items, avoid) => get().pick(items, avoid),
      chance: (p) => get().chance(p),
    };
  }, [key]);
}

/** Vrai la nuit (22 h – 7 h, heure locale) : les pets dorment. */
export function isNight(date: Date = new Date()): boolean {
  const h = date.getHours();
  return h >= 22 || h < 7;
}
