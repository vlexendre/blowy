import type { VisionProfile, VisionSignal } from '@blowy/domain';

/** Port partagé : les autres chantiers enregistrent des observations de vision par ici, jamais en écrivant les tables. */
export const VISION_SIGNALS = Symbol('VISION_SIGNALS');
export interface VisionSignals {
  record(userId: string, signals: VisionSignal[]): Promise<void>;
}

/**
 * Lecture pour les autres chantiers (défi du jour qui vise l'axe le moins sûr, sortie confirmée par la position).
 * Ne renvoie jamais rien de « qui tu veux rencontrer ».
 */
export const VISION_READER = Symbol('VISION_READER');
export interface VisionReader {
  /** Profil de vision à l'instant présent (EMPTY_VISION si rien n'est connu). */
  profileOf(userId: string): Promise<VisionProfile>;
  /** Dernier relevé hors de la zone du domicile (ISO), ou null. */
  lastAwayAt(userId: string): Promise<string | null>;
}

/** Dépôts du module (adaptateur mémoire et Supabase). */
export const VISION_STORE = Symbol('VISION_STORE');
export const PLACES = Symbol('PLACES');
export const MATCH_CACHE = Symbol('MATCH_CACHE');
