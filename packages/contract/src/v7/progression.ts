/**
 * Contrat « progression » (maquette V7) : étincelles de la semaine, ligue entre voisins, 18 trophées.
 * Les règles sont dans `@blowy/domain` (`progression.ts`).
 */
import { LEAGUE_TIERS, SPECIES, TROPHY_FAMILIES } from '@blowy/domain';
import { z } from 'zod';

const API = '/v1';

const n = z.number().int().min(0);

/** Étincelles d'une séance : 10 pour l'avoir faite, jusqu'à 5 pour la vitesse, jusqu'à 10 pour la cohérence. */
export const SessionSparksZ = z.object({ total: n, done: n, speed: n, coherence: n, checked: n, coherent: n, seconds: n });
export type SessionSparksDto = z.infer<typeof SessionSparksZ>;

export const LeagueTierZ = z.enum(LEAGUE_TIERS);

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
    /** Ta ligue cette semaine (décidée par les étincelles de la semaine d'avant). */
    tier: LeagueTierZ,
    lastWeekSparks: n,
    /** La ligue suivante et les étincelles à gagner cette semaine pour y monter (null : déjà Étoile). */
    next: z.object({ tier: LeagueTierZ, sparks: n }).nullable(),
    rows: z.array(LeagueRowZ),
  }),
});
export type Progression = z.infer<typeof ProgressionZ>;

export const progressionRoutes = {
  progression: () => `${API}/progression`,
} as const;
