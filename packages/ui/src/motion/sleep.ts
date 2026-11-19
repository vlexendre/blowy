import { isNight } from './seed';

/** Les premières 24 h après sa naissance, un minimoa ne dort jamais : on fait connaissance. */
export const AWAKE_FIRST_MS = 24 * 3_600_000;
/** Au-delà de ce délai sans toucher l'accueil (le jour, après les premières 24 h), il s'endort. */
export const IDLE_SLEEP_MS = 25_000;

export interface PetSleepInput {
  /** Instant courant (passé par l'écran : la règle n'a pas d'horloge). */
  now: number | Date;
  /** Naissance du minimoa (`Pet.bornAt`). Inconnue ou illisible : traité comme un nouveau-né (jamais endormi). */
  bornAt?: string | number | Date | null;
  /** Pendant l'inscription : jamais endormi. */
  onboarding?: boolean;
  /** Délai d'endormissement au repos ; défaut `IDLE_SLEEP_MS`. */
  idleSleepMs?: number;
}

export interface PetSleep {
  /** Ambiance de nuit (22 h – 7 h, heure locale de `now`) : veilleuse, bâillement, bulle du soir. */
  night: boolean;
  /** Moins de 24 h depuis sa naissance (ou inscription en cours). */
  firstDay: boolean;
  /**
   * Délai sans toucher avant qu'il s'endorme tout seul (`PetActor.sleepAfter`), ou `null` : jamais. Jamais les premières
   * 24 h, jamais la nuit (il ne s'endort pas pendant qu'on le regarde, même tard) ; le jour, après `idleSleepMs`.
   */
  sleepAfter: number | null;
}

/**
 * Quand un minimoa peut s'endormir sur l'écran (règle pure : l'instant courant est un paramètre). Il ne dort jamais
 * d'emblée ; s'il s'endort au repos, l'écran le dit et propose de le réveiller (`PetStage.sleep`).
 */
export function petSleep(o: PetSleepInput): PetSleep {
  const now = o.now instanceof Date ? o.now : new Date(o.now);
  const night = isNight(now);
  const born = o.bornAt === null || o.bornAt === undefined ? Number.NaN : new Date(o.bornAt).getTime();
  // Naissance dans le futur (horloge de l'appareil en retard) : encore le premier jour.
  const firstDay = !!o.onboarding || !Number.isFinite(born) || now.getTime() - born < AWAKE_FIRST_MS;
  return { night, firstDay, sleepAfter: firstDay || night ? null : (o.idleSleepMs ?? IDLE_SLEEP_MS) };
}
