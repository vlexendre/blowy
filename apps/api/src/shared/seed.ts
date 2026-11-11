/** Graine déterministe (FNV-1a 32 bits) tirée d'identifiants stables : remplace l'aléa dans les cas d'usage. */
export function seedOf(...parts: readonly string[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickBySeed<T>(items: readonly T[], seed: number): T {
  const item = items[seed % items.length];
  if (item === undefined) throw new Error('pickBySeed : liste vide');
  return item;
}
