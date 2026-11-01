/** Horloge injectable : aucun use case ne lit Date.now directement. */
export interface Clock {
  now(): Date;
}
export const CLOCK = Symbol('Clock');

/** Source aléatoire injectable (graines serveur, jetons). */
export interface RandomSource {
  /** Chaîne hexadécimale de `bytes` octets cryptographiquement sûrs. */
  hex(bytes: number): string;
  uuid(): string;
}
export const RANDOM = Symbol('RandomSource');
