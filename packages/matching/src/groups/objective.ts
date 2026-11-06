/**
 * Objectif de groupe J(G) en milli-points ENTIERS (spec-v5 §4.3) :
 *   J = 1000·mean(w) + λr·romCov‰/1000 + λf·friendFit‰/1000 − λg·genderImb‰/1000 − λs·(cible − |G|)
 * Les λ multiplient des parts (‰ ramenées à 1) ; tout est arrondi vers le bas : aucune dérive flottante.
 */
import { GENDERS } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { PairTable } from './pairs.js';

export interface GroupEvaluation {
  objectiveMilli: number;
  pairMinScore: number;
  sumW: number;
  pairs: number;
  romanceSeekers: number;
  romanceCovered: number;
  genderImbalancePermille: number;
  /** Tout membre « romance seulement » a ≥ 1 personne rom-compatible dans le groupe. */
  romanceOnlyCovered: boolean;
}

const genderCounts = new Int32Array(GENDERS.length);

/** Évalue un groupe supposé compatible paire à paire (l'appelant le garantit). */
export function evaluateGroup(members: readonly number[], P: PairTable, t: Tuning): GroupEvaluation {
  const c = t.outings.composition;
  const s = members.length;
  let sumW = 0;
  let minW = 100;
  let friendPairs = 0;
  let pairs = 0;
  for (let x = 0; x < s; x++) {
    const a = members[x]!;
    for (let y = x + 1; y < s; y++) {
      const b = members[y]!;
      const w = P.score(a, b);
      sumW += w;
      if (w < minW) minW = w;
      pairs++;
      if (P.seeksFriends[a] === 1 && P.seeksFriends[b] === 1) friendPairs++;
    }
  }
  let seekers = 0;
  let covered = 0;
  let romanceOnlyCovered = true;
  let allMeetEmpty = true;
  genderCounts.fill(0);
  for (let x = 0; x < s; x++) {
    const a = members[x]!;
    genderCounts[P.gender[a]!]!++;
    if (P.meetEmpty[a] === 0) allMeetEmpty = false;
    if (P.seeksRomance[a] !== 1) continue;
    seekers++;
    let has = false;
    for (let y = 0; y < s && !has; y++) if (y !== x && P.rom(a, members[y]!)) has = true;
    if (has) covered++;
    else if (P.romanceOnly[a] === 1) romanceOnlyCovered = false;
  }
  let imbalance = 0;
  if (s > 0 && (seekers > 0 || allMeetEmpty)) {
    let max = 0;
    for (const n of genderCounts) if (n > max) max = n;
    imbalance = Math.max(0, Math.floor((1000 * max) / s) - c.maxGenderSharePermille);
  }
  const meanMilli = pairs > 0 ? Math.floor((1000 * sumW) / pairs) : 0;
  const romCov = seekers > 0 ? Math.floor((1000 * covered) / seekers) : 0;
  const friendFit = pairs > 0 ? Math.floor((1000 * friendPairs) / pairs) : 0;
  const objectiveMilli =
    meanMilli +
    Math.floor((c.lambdaRomance * romCov) / 1000) +
    Math.floor((c.lambdaFriend * friendFit) / 1000) -
    Math.floor((c.lambdaGender * imbalance) / 1000) -
    c.lambdaSize * Math.max(0, c.targetSize - s);
  return { objectiveMilli, pairMinScore: pairs > 0 ? minW : 0, sumW, pairs, romanceSeekers: seekers, romanceCovered: covered, genderImbalancePermille: imbalance, romanceOnlyCovered };
}

/** `units` sont-elles toutes compatibles avec tous les `members` ? */
export function compatibleWith(units: readonly number[], members: readonly number[], P: PairTable): boolean {
  for (const u of units) for (const m of members) if (!P.compatible(u, m)) return false;
  return true;
}
