import { type Day, type Mood, type Needs, type Shape, dayOf, daysBetween, decayGauges, decayNeeds } from '@blowy/domain';
import type { PetRecord } from '../ports';

/** Usure rattrapée à la lecture : les jauges retombent vers 0 pour chaque jour écoulé depuis `decayedOn`. */
export function withDecay(pet: PetRecord, today: Day): PetRecord {
  const days = daysBetween(pet.decayedOn, today);
  if (days <= 0) return pet;
  return { ...pet, gauges: decayGauges(pet.gauges, days), decayedOn: today };
}

/**
 * Les besoins s'usent à la lecture, comme les jauges. On n'enregistre l'usure que par pas entiers de
 * NEEDS_STEP_HOURS heures (anciens besoins − usure du pas, `needsAt` avancé d'autant) : avec les vitesses
 * actuelles (3,5 et 2,5 points par heure), un pas de 2 h retire un nombre entier de points, donc relire
 * souvent n'accélère ni ne ralentit l'usure. Le reste (moins de 2 h) est appliqué à l'affichage.
 */
export const NEEDS_STEP_HOURS = 2;
const HOUR_MS = 3_600_000;

export const hoursSince = (iso: string, now: Date): number => (now.getTime() - new Date(iso).getTime()) / HOUR_MS;

/** Besoins à l'instant `now`. */
export const needsNow = (pet: PetRecord, now: Date): Needs => decayNeeds(pet.needs, hoursSince(pet.needsAt, now));

/** Usure à enregistrer (pas entiers), ou null s'il n'y a pas encore un pas complet. */
export function settledNeeds(pet: PetRecord, now: Date): { needs: Needs; needsAt: string } | null {
  const steps = Math.floor(hoursSince(pet.needsAt, now) / NEEDS_STEP_HOURS);
  if (steps <= 0) return null;
  const hours = steps * NEEDS_STEP_HOURS;
  return { needs: decayNeeds(pet.needs, hours), needsAt: new Date(new Date(pet.needsAt).getTime() + hours * HOUR_MS).toISOString() };
}

/** Pet tel qu'il est maintenant (jauges et besoins rattrapés), pour l'afficher. Ne pas l'enregistrer avec `saveNeeds`. */
export function livePet(pet: PetRecord, now: Date): PetRecord {
  return { ...withDecay(pet, dayOf(now)), needs: needsNow(pet, now) };
}

/** Humeur montrée aux autres hors des liens : un pet qui boude a l'air triste, un pet en forme a l'air content. */
export const moodForShape = (shape: Shape): Mood => (shape === 'boude' ? 'triste' : shape === 'en_forme' ? 'joie' : 'neutre');
