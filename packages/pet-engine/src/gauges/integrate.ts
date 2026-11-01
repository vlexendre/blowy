/**
 * Intégration exacte des jauges sur un intervalle admissible, découpé jour/nuit puis aux
 * franchissements internes (satiété sous le seuil de famine, fin du délai de grâce de 12 h).
 * Toutes les quantités sont entières (unités/ms) : intégrer [a,c) == intégrer [a,b) puis [b,c),
 * d'où la convergence ticks == rattrapage au ms près.
 */
import type { Tuning } from '@blowy/tuning';
import { HOUR_MS } from '@blowy/domain';
import type { PetState } from '../model/index.js';
import { SCORE_MAX, clamp, pointsToUnits } from '../shared/index.js';
import { splitDayNight, subtractIntervals, type Interval } from '../time/index.js';
import { gaugeRates, type GaugeRates } from './rates.js';

interface Thresholds {
  starveBelow: number;
  graceMs: number;
  healthFloor: number;
  max: number;
}

const thresholds = (t: Tuning): Thresholds => ({
  starveBelow: pointsToUnits(t.gauges.starvation.satietyBelow),
  graceMs: t.gauges.starvation.graceHours * HOUR_MS,
  healthFloor: pointsToUnits(t.gauges.healthFloor),
  max: pointsToUnits(SCORE_MAX),
});

/** Durée avant le prochain changement de régime (famine / grâce), bornée par `remaining`. */
function nextBreak(pet: PetState, r: GaugeRates, th: Thresholds, remaining: number): number {
  let dt = remaining;
  const s = pet.gauges.satiety;
  if (s >= th.starveBelow && r.satiety > 0) dt = Math.min(dt, Math.floor((s - th.starveBelow) / r.satiety) + 1);
  if (s < th.starveBelow && pet.starvedMs < th.graceMs) dt = Math.min(dt, th.graceMs - pet.starvedMs);
  return Math.max(1, dt);
}

function step(pet: PetState, r: GaugeRates, th: Thresholds, dt: number): void {
  const g = pet.gauges;
  const starving = g.satiety < th.starveBelow;
  const healthDecays = starving && pet.starvedMs >= th.graceMs;
  g.satiety = clamp(g.satiety - r.satiety * dt, 0, th.max);
  g.energy = clamp(g.energy - r.energy * dt, 0, th.max);
  g.mood = clamp(g.mood - r.mood * dt, 0, th.max);
  if (healthDecays && g.health > th.healthFloor) g.health = Math.max(th.healthFloor, g.health - r.health * dt);
  if (starving) pet.starvedMs += dt;
}

/** Intègre les jauges d'un pet (muté) sur [fromMs, toMs) hors pauses, en heure locale `tz`. */
export function integrateGauges(pet: PetState, fromMs: number, toMs: number, tz: string, pauses: readonly Interval[], t: Tuning): void {
  const th = thresholds(t);
  for (const admissible of subtractIntervals(fromMs, toMs, pauses)) {
    for (const seg of splitDayNight(admissible.startMs, admissible.endMs, tz, t.time.night)) {
      const r = gaugeRates(t, pet.species, seg.night);
      let remaining = seg.endMs - seg.startMs;
      while (remaining > 0) {
        const dt = nextBreak(pet, r, th, remaining);
        step(pet, r, th, dt);
        remaining -= dt;
      }
    }
  }
}
