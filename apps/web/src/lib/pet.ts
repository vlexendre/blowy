/** Chemin de l'image d'un pet selon son espèce et son humeur (fichiers dans public/img). */
import type { Mood, Species } from '@blowy/domain';

export const petImageSrc = (species: Species, mood: Mood): string => `/img/${species}_${mood}.webp`;
export const petFallbackSrc = (species: Species): string => `/img/${species}_neutre.webp`;

/** Pose l'image du pet, avec repli sur l'humeur neutre si le fichier manque. */
export function setPetImage(img: HTMLImageElement, species: Species, mood: Mood, alt: string): void {
  img.onerror = () => {
    img.onerror = null;
    img.src = petFallbackSrc(species);
  };
  img.alt = alt;
  img.src = petImageSrc(species, mood);
}
