/**
 * Contrat « progression » (maquette V7) : étincelles de la semaine, ligue entre voisins, 18 trophées.
 * Les règles sont dans `@blowy/domain` (`progression.ts`).
 */
import { SPECIES, TROPHY_FAMILIES } from '@blowy/domain';
import { z } from 'zod';

const API = '/v1';

export const TrophyFamilyZ = z.enum(TROPHY_FAMILIES);

export const TrophyZ = z.object({
  family: TrophyFamilyZ,
  /** Niveaux gagnés : 0 aucun, 1 bronze, 2 argent, 3 or. */
  won: z.number().int().min(0).max(3),
  value: z.number().int().min(0),
  /** Prochain seuil, null quand l'or est gagné. */
  next: z.number().int().nullable(),
});
export type Trophy = z.infer<typeof TrophyZ>;

export const LeagueRowZ = z.object({
  rank: z.number().int().min(1),
  userId: z.string().uuid(),
  displayName: z.string(),
  species: z.enum(SPECIES),
  sparks: z.number().int().min(0),
  podium: z.boolean(),
  me: z.boolean(),
});
export type LeagueRow = z.infer<typeof LeagueRowZ>;

/** `GET /v1/progression`. */
export const ProgressionZ = z.object({
  /** Étincelles de la semaine. */
  sparks: z.number().int().min(0),
  streak: z.object({ current: z.number().int().min(0), best: z.number().int().min(0) }),
  trophies: z.array(TrophyZ),
  trophiesWon: z.number().int().min(0),
  trophiesTotal: z.number().int().min(0),
  league: z.object({
    /** Dernier jour de la ligue en cours (dimanche, jour de Paris). */
    endsOn: z.string(),
    /** Sans position : pas de voisins, la ligue n'a que toi. */
    located: z.boolean(),
    rows: z.array(LeagueRowZ),
  }),
});
export type Progression = z.infer<typeof ProgressionZ>;

export const progressionRoutes = {
  progression: () => `${API}/progression`,
} as const;
