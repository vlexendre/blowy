/** Retour haptique : jamais seul porteur d'une information (toujours doublé d'un texte). */
export interface HapticsPort {
  tap(): void;
  success(): void;
  warning(): void;
}
