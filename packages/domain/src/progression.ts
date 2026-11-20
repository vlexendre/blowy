/**
 * Progression (maquette V7, « Ligue » et « Trophées ») : des étincelles gagnées chaque semaine en faisant ce qui rapproche
 * des gens (la séance, écrire, dire bonjour, un nouveau lien), une ligue de la semaine entre voisins, et 18 trophées
 * (6 familles × bronze, argent, or). Pur : les compteurs et le jour sont passés en paramètre.
 *
 * Tout se calcule à partir de ce qui existe déjà (séances, messages, bonjours, liens, série) : rien n'est stocké en plus.
 */
import { type Day, addDays } from './days';

/** Jour de la semaine d'un jour civil (0 = dimanche). */
const dayOfWeek = (d: Day): number => new Date(`${d}T12:00:00Z`).getUTCDay();

// ── Étincelles ──────────────────────────────────────────────────────────────

/** Ce que rapporte chaque geste. Écrire rapporte peu, et au plus `MESSAGE_SPARKS_CAP` par semaine (pas de spam). */
export const SPARKS = { session: 10, message: 1, wave: 5, link: 20 } as const;
export const MESSAGE_SPARKS_CAP = 100;

/** Ce qu'une personne a fait pendant la semaine. */
export interface WeekActivity {
  sessions: number;
  messages: number;
  waves: number;
  links: number;
}

export const NO_ACTIVITY: WeekActivity = { sessions: 0, messages: 0, waves: 0, links: 0 };

/** Étincelles de la semaine. */
export function weeklySparks(a: WeekActivity): number {
  return a.sessions * SPARKS.session + Math.min(a.messages * SPARKS.message, MESSAGE_SPARKS_CAP) + a.waves * SPARKS.wave + a.links * SPARKS.link;
}

/** Lundi de la semaine de `day` (la ligue se remet à zéro chaque lundi). */
export function weekStart(day: Day): Day {
  return addDays(day, -((dayOfWeek(day) + 6) % 7));
}

/** Dernier jour de la ligue en cours (dimanche). */
export const weekEnd = (day: Day): Day => addDays(weekStart(day), 6);

// ── Ligue ───────────────────────────────────────────────────────────────────

/** Taille d'une ligue (les voisins les plus proches de la même zone). */
export const LEAGUE_SIZE = 20;
/** Les premiers de la semaine sont mis en avant (zone verte de la maquette). */
export const LEAGUE_PODIUM = 3;

export interface LeagueEntry {
  userId: string;
  sparks: number;
}

/**
 * Classement : étincelles décroissantes, puis identifiant (ordre stable). Une personne à 0 reste dans la liste (c'est
 * la semaine qui commence), mais n'est jamais sur le podium.
 */
export function rankLeague<T extends LeagueEntry>(entries: readonly T[]): (T & { rank: number; podium: boolean })[] {
  return [...entries]
    .sort((a, b) => b.sparks - a.sparks || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0))
    .map((e, i) => ({ ...e, rank: i + 1, podium: i < LEAGUE_PODIUM && e.sparks > 0 }));
}

// ── Trophées ────────────────────────────────────────────────────────────────

/** Ce qu'une personne a fait depuis le début. */
export interface LifetimeStats {
  /** Bonjours envoyés. */
  waves: number;
  /** Meilleure série de Ton chemin (jours d'affilée). */
  bestStreak: number;
  /** Messages écrits. */
  messages: number;
  /** Liens noués (personnes rencontrées). */
  links: number;
  /** Séances de Ton chemin terminées. */
  sessions: number;
  /** Zones différentes des personnes rencontrées. */
  places: number;
}

export const TROPHY_FAMILIES = ['bonjour', 'serie', 'bavard', 'communs', 'introspection', 'explorateur'] as const;
export type TrophyFamily = (typeof TROPHY_FAMILIES)[number];
export const TROPHY_TIERS = ['bronze', 'argent', 'or'] as const;
export type TrophyTier = (typeof TROPHY_TIERS)[number];

/** Le compteur de chaque famille et ses trois seuils (bronze, argent, or). */
export const TROPHY_RULES: Record<TrophyFamily, { stat: keyof LifetimeStats; goals: readonly [number, number, number] }> = {
  bonjour: { stat: 'waves', goals: [1, 10, 50] },
  serie: { stat: 'bestStreak', goals: [3, 7, 30] },
  bavard: { stat: 'messages', goals: [100, 500, 2000] },
  communs: { stat: 'links', goals: [1, 5, 15] },
  introspection: { stat: 'sessions', goals: [12, 30, 90] },
  explorateur: { stat: 'places', goals: [2, 5, 10] },
};

export interface TrophyView {
  family: TrophyFamily;
  /** Niveaux gagnés (0 à 3). */
  won: 0 | 1 | 2 | 3;
  value: number;
  /** Prochain seuil, ou null quand l'or est gagné. */
  next: number | null;
}

export function trophies(stats: LifetimeStats): TrophyView[] {
  return TROPHY_FAMILIES.map((family) => {
    const { stat, goals } = TROPHY_RULES[family];
    const value = Math.max(0, Math.trunc(stats[stat]));
    const won = goals.filter((g) => value >= g).length as 0 | 1 | 2 | 3;
    return { family, won, value, next: won < 3 ? ((goals as readonly number[])[won] ?? null) : null };
  });
}

/** Nombre total de trophées gagnés (sur 18). */
export const trophiesWon = (list: readonly TrophyView[]): number => list.reduce((n, t) => n + t.won, 0);
export const TROPHY_COUNT = TROPHY_FAMILIES.length * TROPHY_TIERS.length;
