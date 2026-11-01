/** D (dimanches), E (écoles), S (espèces) : lecture de matrices symétriques versionnées du tuning. */
import type { School, Species, Sunday } from '@blowy/domain';
import { clamp01, type Tuning } from '@blowy/tuning';

const cell = <K extends string>(m: Record<K, Record<K, number>>, a: K, b: K): number => clamp01(m[a]?.[b] ?? 0);

export const sundayScore = (a: Sunday, b: Sunday, t: Tuning): number => cell(t.matching.matrices.sunday, a, b);
export const schoolScore = (a: School, b: School, t: Tuning): number => cell(t.matching.matrices.school, a, b);
export const speciesScore = (a: Species, b: Species, t: Tuning): number => cell(t.matching.matrices.species, a, b);
