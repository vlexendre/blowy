/**
 * V5.5 (D-058, spec §2.6 I-O6, §10.1) — astreinte : aucun créneau de sortie, aucune sortie, aucun rendez-vous
 * Duo hors des heures couvertes par une équipe humaine (mutualisée par FUSEAU, `SafetyOnCallShift`).
 */
export interface OnCallCoverage {
  /** L'intervalle [from, to] est-il entièrement couvert (union des tours d'astreinte du fuseau) ? */
  covered(timezone: string, from: Date, to: Date): Promise<boolean>;
}
export const ONCALL_COVERAGE = Symbol.for('blowy.oncall_coverage');

/** Marges couvertes autour d'une sortie ou d'un RDV : du début du check-in à la fin prévue. */
export const ONCALL_MARGIN_BEFORE_MS = 30 * 60_000;

/** Union d'intervalles [a, b] ⊇ [from, to] ? (pur) */
export function intervalCovered(shifts: readonly { startsAt: Date; endsAt: Date }[], from: Date, to: Date): boolean {
  let cursor = from.getTime();
  for (const s of [...shifts].sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime())) {
    if (s.startsAt.getTime() > cursor) break;
    cursor = Math.max(cursor, s.endsAt.getTime());
    if (cursor >= to.getTime()) return true;
  }
  return cursor >= to.getTime();
}
