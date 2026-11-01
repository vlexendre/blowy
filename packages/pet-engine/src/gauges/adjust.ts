/** Ajustements ponctuels de jauges (actions), bornés [0,100], en points. */
import type { Tuning } from '@blowy/tuning';
import type { GaugeKey, PetState } from '../model/index.js';
import { SCORE_MAX, clamp, pointsToUnits, unitsToPoints } from '../shared/index.js';

export function adjustGauge(pet: PetState, key: GaugeKey, deltaPoints: number, t: Tuning): void {
  pet.gauges[key] = clamp(pet.gauges[key] + pointsToUnits(deltaPoints), 0, pointsToUnits(SCORE_MAX));
  // Sortir de la famine remet à zéro le minuteur de santé.
  if (key === 'satiety' && pet.gauges.satiety >= pointsToUnits(t.gauges.starvation.satietyBelow)) pet.starvedMs = 0;
}

/** Jauges affichables (points entiers). */
export function displayGauges(pet: PetState): Record<GaugeKey, number> {
  const g = pet.gauges;
  return { satiety: unitsToPoints(g.satiety), energy: unitsToPoints(g.energy), mood: unitsToPoints(g.mood), health: unitsToPoints(g.health) };
}

export const gaugePoints = (pet: PetState, key: GaugeKey): number => pet.gauges[key] / pointsToUnits(1);

export const isSick = (pet: PetState, t: Tuning): boolean => gaugePoints(pet, 'health') < t.poses.sickHealthBelow;
export const isHungry = (pet: PetState, t: Tuning): boolean => gaugePoints(pet, 'satiety') < t.poses.hungrySatietyBelow;
/** Aide vitale : un pet malade ou affamé ne refuse jamais. */
export const needsVitalHelp = (pet: PetState, t: Tuning): boolean => isSick(pet, t) || isHungry(pet, t);
