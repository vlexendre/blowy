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

/** Ce que rapporte chaque geste (une séance : voir `sessionSparks`, de 10 à 25). Écrire rapporte peu, et au plus `MESSAGE_SPARKS_CAP` par semaine (pas de spam). */
export const SPARKS = { session: 10, message: 1, wave: 5, link: 20 } as const;
export const MESSAGE_SPARKS_CAP = 100;

/** Ce qu'une personne a fait pendant la semaine. */
export interface WeekActivity {
  sessions: number;
  /** Étincelles des séances (vitesse et cohérence comprises) ; une ancienne séance sans compte vaut `SPARKS.session`. */
  sessionSparks: number;
  messages: number;
  waves: number;
  links: number;
}

export const NO_ACTIVITY: WeekActivity = { sessions: 0, sessionSparks: 0, messages: 0, waves: 0, links: 0 };

/** Étincelles de la semaine. */
export function weeklySparks(a: WeekActivity): number {
  return a.sessionSparks + Math.min(a.messages * SPARKS.message, MESSAGE_SPARKS_CAP) + a.waves * SPARKS.wave + a.links * SPARKS.link;
}

/** Lundi de la semaine de `day` (la ligue se remet à zéro chaque lundi). */
export function weekStart(day: Day): Day {
  return addDays(day, -((dayOfWeek(day) + 6) % 7));
}

/** Dernier jour de la ligue en cours (dimanche). */
export const weekEnd = (day: Day): Day => addDays(weekStart(day), 6);

// ── Étincelles d'une séance : vitesse et cohérence ─────────────────────────

/**
 * Une séance terminée rapporte au plus 25 étincelles :
 * - 10 pour l'avoir faite ;
 * - jusqu'à 5 pour la vitesse (temps moyen par réponse, mesuré par le serveur : de l'ouverture de la séance à
 *   l'envoi). Trop vite (moins de 2 s par réponse en moyenne : on ne lit pas), rien ;
 * - jusqu'à 10 pour la cohérence : 2 par réponse qui rejoint ce que tu as déjà dit (ta réponse précédente à la même
 *   question, sinon ce que ton minimoa sait déjà de toi sur cet axe, quand il en est assez sûr). Une réponse sans
 *   rien à quoi la comparer (tu découvres un sujet) rapporte 1.
 * La vitesse seule ne paie pas beaucoup : répondre vite et au hasard fait perdre la cohérence.
 */
export const SESSION_SPARKS = { done: 10, speedMax: 5, perCoherent: 2, perNew: 1, max: 25 } as const;
/** Paliers de vitesse : secondes par réponse en moyenne → étincelles. */
export const SPEED_TIERS: readonly { maxSecondsPerAnswer: number; sparks: number }[] = [
  { maxSecondsPerAnswer: 9, sparks: 5 },
  { maxSecondsPerAnswer: 18, sparks: 3 },
  { maxSecondsPerAnswer: 36, sparks: 1 },
];
export const TOO_FAST_SECONDS_PER_ANSWER = 2;
/** Une réponse rejoint la précédente à la même question si l'écart sur l'axe (−100 à 100) est au plus de 40. */
export const COHERENT_SPAN_SAME_QUESTION = 40;
/** …ou ce que le minimoa sait de l'axe (confiance d'au moins 30) si l'écart est au plus de 60. */
export const COHERENT_SPAN_AXIS = 60;
export const COHERENT_MIN_CONFIDENCE = 30;

export interface SparkAnswer {
  /** Valeur de la réponse sur l'axe (−100 à 100, sens appliqué). */
  value: number;
  /** Ta réponse précédente à la même question (même échelle), ou null. */
  previous: number | null;
  /** Ce que le minimoa savait de cet axe avant la séance. */
  axis: { value: number; confidence: number } | null;
}

export interface SessionSparks {
  total: number;
  done: number;
  speed: number;
  coherence: number;
  /** Réponses comparées (à une réponse précédente ou à l'axe connu). */
  checked: number;
  /** Parmi elles, celles qui rejoignent ce que tu as déjà dit. */
  coherent: number;
  seconds: number;
}

export function speedSparks(seconds: number, answers: number): number {
  if (answers <= 0) return 0;
  const per = Math.max(0, seconds) / answers;
  if (per < TOO_FAST_SECONDS_PER_ANSWER) return 0;
  return SPEED_TIERS.find((t) => per <= t.maxSecondsPerAnswer)?.sparks ?? 0;
}

export function isCoherent(a: SparkAnswer): boolean | null {
  if (a.previous !== null) return Math.abs(a.value - a.previous) <= COHERENT_SPAN_SAME_QUESTION;
  if (a.axis && a.axis.confidence >= COHERENT_MIN_CONFIDENCE) return Math.abs(a.value - a.axis.value) <= COHERENT_SPAN_AXIS;
  return null;
}

export function sessionSparks(answers: readonly SparkAnswer[], seconds: number): SessionSparks {
  const verdicts = answers.map(isCoherent);
  const checked = verdicts.filter((v) => v !== null).length;
  const coherent = verdicts.filter((v) => v === true).length;
  const fresh = verdicts.filter((v) => v === null).length;
  const coherence = Math.min(10, coherent * SESSION_SPARKS.perCoherent + fresh * SESSION_SPARKS.perNew);
  const speed = speedSparks(seconds, answers.length);
  const total = Math.min(SESSION_SPARKS.max, SESSION_SPARKS.done + speed + coherence);
  return { total, done: SESSION_SPARKS.done, speed, coherence, checked, coherent, seconds: Math.max(0, Math.round(seconds)) };
}

// ── Paliers de ligue ────────────────────────────────────────────────────────

/**
 * Cinq ligues, de Plume à Étoile. Ta ligue de la semaine dépend des étincelles gagnées la semaine d'avant : rien à
 * garder en mémoire, et chacun sait ce qu'il faut pour monter (le seuil suivant).
 */
export const LEAGUE_TIERS = ['plume', 'pompon', 'houppette', 'couronne', 'etoile'] as const;
export type LeagueTier = (typeof LEAGUE_TIERS)[number];
export const LEAGUE_TIER_MIN: Record<LeagueTier, number> = { plume: 0, pompon: 60, houppette: 150, couronne: 280, etoile: 450 };

export function leagueTierOf(lastWeekSparks: number): LeagueTier {
  let tier: LeagueTier = 'plume';
  for (const t of LEAGUE_TIERS) if (lastWeekSparks >= LEAGUE_TIER_MIN[t]) tier = t;
  return tier;
}

/** La ligue suivante et le seuil à atteindre cette semaine pour y être la semaine prochaine (null : déjà Étoile). */
export function nextLeague(tier: LeagueTier): { tier: LeagueTier; sparks: number } | null {
  const next = LEAGUE_TIERS[LEAGUE_TIERS.indexOf(tier) + 1];
  return next ? { tier: next, sparks: LEAGUE_TIER_MIN[next] } : null;
}

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
