/**
 * Unités internes entières du moteur.
 *  - Jauges : « unités de jauge » = points × GAUGE_UNIT. GAUGE_UNIT = 12 h en ms, ce qui rend
 *    un taux r points/h divisé par d (d | 12) égal à r·12/d unités par ms : entier exact.
 *    L'intégration par morceaux est donc additive au ms près (ticks == rattrapage).
 *  - XP : milli-points entiers (MILLI du domain).
 */
import { HOUR_MS, MILLI } from '@blowy/domain';

export const GAUGE_HOURS_BASE = 12;
export const GAUGE_UNIT = GAUGE_HOURS_BASE * HOUR_MS;

/** Bornes des jauges et scores relationnels (§6 : jauges [0,100], scores bornés). */
export const SCORE_MAX = 100;

export const pointsToUnits = (points: number): number => Math.round(points * GAUGE_UNIT);
/** Conversion d'affichage uniquement (arrondi inférieur, jamais réinjectée dans le calcul). */
export const unitsToPoints = (units: number): number => Math.floor(units / GAUGE_UNIT);
/** Unités de jauge perdues par ms pour un taux en points/h et un diviseur nocturne. */
export const ratePerMs = (pointsPerHour: number, divisor: number): number => (pointsPerHour * GAUGE_HOURS_BASE) / divisor;

export const pointsToMilli = (points: number): number => points * MILLI;
export { MILLI };
