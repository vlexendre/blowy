import { type Day, dayOf } from '@blowy/domain';

/** Horloge injectable : les cas d'usage n'appellent jamais `Date.now()` directement. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** Jour civil courant (Europe/Paris). */
export const todayOf = (clock: Clock): Day => dayOf(clock.now());

/** Horloge du développement local : l'heure du système, décalable pour voir l'usure, la bouderie ou un lien fantôme sans attendre. */
export class ShiftedClock implements Clock {
  private offsetMs = 0;
  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }
  advanceHours(hours: number): void {
    this.offsetMs += hours * 3_600_000;
  }
}

/** Horloge qu'on peut avancer à la main (développement local, tests). */
export const canAdvance = (clock: Clock): clock is Clock & { advanceHours(hours: number): void } =>
  typeof (clock as { advanceHours?: unknown }).advanceHours === 'function';
