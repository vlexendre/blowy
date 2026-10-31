/** Heures en millisecondes epoch UTC ; timezone IANA séparée. Aucune lecture d'horloge ici. */
export type EpochMs = number;
export type IanaTimeZone = string;

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;
export const TICK_MS = 15 * MINUTE_MS;
