import { type Day, dayOf } from '@blowy/domain';

/** Horloge injectable : les cas d'usage n'appellent jamais `Date.now()` directement. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** Jour civil courant (Europe/Paris). */
export const todayOf = (clock: Clock): Day => dayOf(clock.now());
