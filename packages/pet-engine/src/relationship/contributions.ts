/**
 * Contributions orientées sur fenêtre glissante de N jours locaux (relation), pondérées
 * message=1, jeu=1, mission=3 (tuning), plafonnées par jour et par type.
 * k = 1 − p·|a−b|/(a+b) (p = 0,5), k = 1 si a+b = 0 ; calcul sur le snapshot pris
 * IMMÉDIATEMENT AVANT l'enregistrement de l'événement courant.
 */
import type { Tuning } from '@blowy/tuning';
import { CONTRIBUTION_KINDS, type ContributionKind, type RelationshipState, type SideState } from '../model/index.js';
import { PERMILLE, type Side } from '../shared/index.js';
import { dayKeyFromDays, daysFromDayKey, localDay } from '../time/index.js';

function windowKeys(nowMs: number, tz: string, days: number): Set<string> {
  const today = localDay(nowMs, tz);
  const keys = new Set<string>();
  for (let i = 0; i < days; i++) keys.add(dayKeyFromDays(today - i));
  return keys;
}

export function weightedContribution(side: SideState, keys: Set<string>, t: Tuning): number {
  let sum = 0;
  for (const [day, counts] of Object.entries(side.contributions)) {
    if (!keys.has(day)) continue;
    for (const k of CONTRIBUTION_KINDS) sum += counts[k] * t.link.contributionWeights[k];
  }
  return sum;
}

export function contributionTotals(rel: RelationshipState, nowMs: number, t: Tuning): [number, number] {
  const keys = windowKeys(nowMs, rel.tz, t.link.contributionWindowDays);
  return [weightedContribution(rel.sides[0], keys, t), weightedContribution(rel.sides[1], keys, t)];
}

/** k en permille entier (arrondi inférieur). */
export function balanceFactorPermille(a: number, b: number, t: Tuning): number {
  if (a + b === 0) return PERMILLE;
  return PERMILLE - Math.ceil((t.link.balancePenaltyPermille * Math.abs(a - b)) / (a + b));
}

export function kPermilleFor(rel: RelationshipState, nowMs: number, t: Tuning): number {
  const [a, b] = contributionTotals(rel, nowMs, t);
  return balanceFactorPermille(a, b, t);
}

/** Enregistre une contribution (après le calcul du gain), plafonnée par jour ; purge hors fenêtre. */
export function recordContribution(rel: RelationshipState, side: Side, kind: ContributionKind, nowMs: number, t: Tuning): boolean {
  const s = rel.sides[side];
  const today = localDay(nowMs, rel.tz);
  const key = dayKeyFromDays(today);
  const counts = (s.contributions[key] ??= { message: 0, play: 0, mission: 0 });
  for (const day of Object.keys(s.contributions)) if (today - daysFromDayKey(day) >= t.link.contributionWindowDays) delete s.contributions[day];
  if (counts[kind] >= t.link.dailyContributionCaps[kind]) return false;
  counts[kind] += 1;
  return true;
}
