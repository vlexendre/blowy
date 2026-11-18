/**
 * Images responsives : `srcset` des versions réduites produites par scripts/site-images/variants.py
 * (manifeste ./img-variants.json). Une image sans variante garde son seul `src`.
 */
import variants from './img-variants.json';

const table = variants as unknown as Record<string, [number, string][]>;

/** `srcset` d'une image du site (« /img/v/x-240.webp 240w, /img/m/x.webp 450w »), ou undefined sans variante. */
export function srcsetOf(src: string): string | undefined {
  const list = table[src];
  return list ? list.map(([w, path]) => `${path} ${w}w`).join(', ') : undefined;
}

/** Attributs `srcset` et `sizes` à poser sur un <img> (rien si l'image n'a pas de variante). */
export function responsive(src: string, sizes: string): { srcset?: string; sizes?: string } {
  const srcset = srcsetOf(src);
  return srcset ? { srcset, sizes } : {};
}

/** Plus petite version d'une image (visages affichés à 48 px au plus : la version 128 px suffit même en ×3). */
export function smallest(src: string): string {
  return table[src]?.[0]?.[1] ?? src;
}
