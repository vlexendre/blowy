/** Taux de jauges en unités/ms selon espèce et période (jour/nuit), lus du tuning. */
import type { Species } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { ratePerMs } from '../shared/index.js';

export interface GaugeRates {
  satiety: number;
  /** Positif = baisse ; négatif = remontée (nuit). */
  energy: number;
  mood: number;
  health: number;
}

export function gaugeRates(t: Tuning, species: Species, night: boolean): GaugeRates {
  const g = t.gauges;
  const d = night ? g.nightDecayDivisor : 1;
  return {
    satiety: ratePerMs(g.speciesSatietyDecayPerHour[species], d),
    // Nuit : récupération nette, en remplacement de la baisse (pas en plus d'une baisse réduite).
    energy: night ? -ratePerMs(g.nightEnergyRecoveryPerHour, 1) : ratePerMs(g.decayPerHour.energy, 1),
    mood: ratePerMs(g.decayPerHour.mood, d),
    health: ratePerMs(g.decayPerHour.health, d),
  };
}
