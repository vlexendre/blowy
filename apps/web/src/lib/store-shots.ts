/**
 * Captures de l'App Store pour la galerie de la landing : public/img/store/manifest.json, écrit par
 * scripts/store-images.mjs. Absent : liste vide (la section n'apparaît pas).
 */
export interface StoreShot {
  name: string;
  width: number;
  height: number;
  alt: string | null;
}
interface Manifest {
  widths: number[];
  shots: StoreShot[];
}

const found = import.meta.glob<{ default: Manifest }>('/public/img/store/manifest.json', { eager: true });
const manifest: Manifest | undefined = Object.values(found)[0]?.default;

export const storeShots: StoreShot[] = manifest?.shots ?? [];
export const storeWidths: number[] = manifest?.widths ?? [];
export const storeSrc = (name: string, width: number): string => `/img/store/${name}-${width}.webp`;
