/**
 * Univers du chemin écrits d'un bloc (forme et textes des 5 langues ensemble), un fichier par univers. Chaque univers :
 * 10 étapes de 5 questions. Assemblés après les 6 univers de départ (`catalogue.ts`), dans l'ordre de `index.ts`.
 *
 * Poids d'une option : sa place sur l'axe (−100 à 100), sens toujours 1.
 * - foyer : −100 indépendance, liberté ↔ +100 proches, vie à plusieurs, tablées.
 * - ancrage : −100 racines, le familier ↔ +100 l'ailleurs, la nouveauté, la curiosité.
 * - elan : −100 temps pour soi, profiter ↔ +100 projets, ambition, se dépasser.
 * - rythme : −100 calme, cocooning, en petit comité ↔ +100 sortir, du monde, bouger, la fête.
 * - cap : −100 spontané, l'imprévu ↔ +100 organisé, planifié.
 * Curseur (`s`) : bout gauche puis bout droit, et `m` (réaction quand il s'arrête au milieu) dans chaque langue.
 */
import type { CheminFormat, Locale, VisionAxis } from '@blowy/domain';
import type { SEED_TAGS } from '../catalogue';

export type SeedTag = (typeof SEED_TAGS)[number];
/** [icône (un emoji), poids, trait partagé ou null]. */
export type PackOption = readonly [icon: string, weight: number, tag: SeedTag | null];
/** Textes d'une question dans une langue : la question, l'amorce (« Demande-lui… »), [libellé, réaction] par option. */
export interface PackText {
  t: string;
  o: string;
  a: readonly (readonly [label: string, reaction: string])[];
  m?: string;
}
export type ByLang<T> = Record<Locale, T>;
export interface PackQuestion {
  id: string;
  format: CheminFormat;
  axis: VisionAxis;
  options: readonly PackOption[];
  texts: ByLang<PackText>;
}
export interface PackStep {
  id: string;
  title: ByLang<string>;
  questions: readonly PackQuestion[];
}
export interface SeedPack {
  id: string;
  icon: string;
  /** [titre, sous-titre] par langue. */
  title: ByLang<readonly [string, string]>;
  steps: readonly PackStep[];
}

/** Question à choix (2 à 4 options). */
export const c = (id: string, axis: VisionAxis, options: readonly PackOption[], texts: ByLang<PackText>): PackQuestion => ({ id, format: 'choice', axis, options, texts });
/** Curseur : bout gauche, bout droit. */
export const s = (id: string, axis: VisionAxis, left: PackOption, right: PackOption, texts: ByLang<PackText>): PackQuestion => ({ id, format: 'slider', axis, options: [left, right], texts });
