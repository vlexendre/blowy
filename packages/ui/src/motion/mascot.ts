/**
 * Minimoa animé (docs/MOTION.md, « Minimoa animé ») : règles pures, sans React Native (testées seules).
 * L'API dit quel personnage jouer (`mascot` de la séance) ; l'app ne fait que traduire un moment (rire, réfléchir,
 * applaudir) en événement du lecteur, et décider s'il faut jouer le lecteur ou garder l'affichage habituel.
 */

/** Les trois moments que joue un minimoa animé ; il revient seul au repos après chacun. */
export type MascotMoment = 'happy' | 'think' | 'cheer';
export const MASCOT_MOMENTS: readonly MascotMoment[] = ['happy', 'think', 'cheer'];

/** Ce que l'API envoie (forme de `MascotZ` du contrat, lue telle quelle). */
export interface MascotSource {
  provider: 'masko';
  url: string;
  appKey: string;
  /** Nom de l'événement du lecteur pour chaque moment (`action::happy`…). */
  events: Readonly<Record<MascotMoment, string>>;
}

/**
 * Nom d'animation du serveur (réaction d'une option, `namedMotion`) → moment du minimoa animé. Réfléchir pour `think`,
 * applaudir pour une fête (`confetti`, `party`, `stars`, `clap`, `dance`), rire pour tout le reste ; absent ou inconnu
 * (contenu plus récent que l'app) : rire (`happy`).
 */
const MOMENT_OF: Readonly<Record<string, MascotMoment>> = {
  think: 'think',
  confetti: 'cheer',
  party: 'cheer',
  stars: 'cheer',
  clap: 'cheer',
  dance: 'cheer',
  hop: 'happy',
  joy: 'happy',
  sparkles: 'happy',
  laugh: 'happy',
  wave: 'happy',
  surprise: 'happy',
  shy: 'happy',
};

export function mascotMomentFor(name: string | null | undefined): MascotMoment {
  if (!name) return 'happy';
  return Object.prototype.hasOwnProperty.call(MOMENT_OF, name) ? (MOMENT_OF[name] as MascotMoment) : 'happy';
}

/** L'événement à déclencher pour un moment (null : pas de personnage, ou nom vide). */
export function mascotEvent(source: MascotSource | null | undefined, moment: MascotMoment): string | null {
  const name = source?.events[moment];
  return name ? name : null;
}

export interface MascotModeInput {
  source: MascotSource | null | undefined;
  /** Le lecteur natif est dans ce build (absent : web, vieux client de dev, Expo Go). */
  available: boolean;
  /** « Réduire les animations » : pas de boucle, l'affichage habituel (qui sait déjà se tenir tranquille). */
  reduced: boolean;
  /** Erreur de chargement, pas de réseau, délai dépassé, plantage du lecteur. */
  failed: boolean;
}

/** Jouer le lecteur, ou garder l'affichage habituel (jamais d'écran vide). */
export function mascotMode({ source, available, reduced, failed }: MascotModeInput): 'masko' | 'fallback' {
  if (!source || source.provider !== 'masko' || !source.url || !source.appKey) return 'fallback';
  if (!available || reduced || failed) return 'fallback';
  return 'masko';
}

/** Délai au-delà duquel un personnage qui ne s'est pas montré est abandonné pour l'affichage habituel. */
export const MASCOT_LOAD_TIMEOUT_MS = 12_000;
