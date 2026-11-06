/**
 * Objectif de groupe J(G) en milli-points ENTIERS (spec-v5 §4.3) :
 *   J = 1000·mean(w) + λr·romCov‰/1000 + λf·friendFit‰/1000 − λg·genderImb‰/1000 − λs·(cible − |G|)
 * + contrainte dure `genderCapOk` (D-039 : ≤ `maxSameGender` du même genre, exception non mixte demandée).
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
  /** V5.2 B : chercheurs d'histoire ayant ≥ `storyGuarantee.minCompatible` personnes `story`-compatibles. */
  storyGuaranteed: number;
  /** Tout membre « romance seulement » a ≥ 1 personne rom-compatible dans le groupe. */
  romanceOnlyCovered: boolean;
  /**
   * D-039 / V5.3 A.2 — contrainte DURE : jamais plus de `maxSameGender` (3) personnes du même genre
   * (`UNDISCLOSED` n'est pas un genre commun), sauf groupe non mixte demandé (tous les membres ont
   * restreint « qui je veux rencontrer » au même genre unique).
   */
  genderCapOk: boolean;
}

const UNDISCLOSED = GENDERS.indexOf('UNDISCLOSED');

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
  let guaranteed = 0;
  const minStory = c.storyGuarantee.minCompatible;
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
    if (has) {
      let n = 0;
      for (let y = 0; y < s && n < minStory; y++) if (y !== x && P.story(a, members[y]!)) n++;
      if (n >= minStory) guaranteed++;
    }
  }
  let maxSame = 0;
  for (let g = 0; g < genderCounts.length; g++) if (g !== UNDISCLOSED && genderCounts[g]! > maxSame) maxSame = genderCounts[g]!;
  let nonMixedRequested = s > 0 && P.meetOnly[members[0]!]! >= 0;
  for (let x = 1; x < s && nonMixedRequested; x++) if (P.meetOnly[members[x]!] !== P.meetOnly[members[0]!]) nonMixedRequested = false;
  const genderCapOk = maxSame <= c.maxSameGender || nonMixedRequested;
  let imbalance = 0;
  if (s > 0 && (seekers > 0 || allMeetEmpty)) {
    let max = 0;
    for (const n of genderCounts) if (n > max) max = n;
    imbalance = Math.max(0, Math.floor((1000 * max) / s) - c.maxGenderSharePermille);
  }
  const meanMilli = pairs > 0 ? Math.floor((1000 * sumW) / pairs) : 0;
  const romCov = seekers > 0 ? Math.floor((1000 * covered) / seekers) : 0;
  const storyCov = c.storyGuarantee.enabled && seekers > 0 ? Math.floor((1000 * guaranteed) / seekers) : 0;
  const friendFit = pairs > 0 ? Math.floor((1000 * friendPairs) / pairs) : 0;
  // V5.6 (§4.3) : mélange calme/animé dans un groupe — pénalité douce par membre minoritaire (le lieu reste un filtre dur).
  let calm = 0;
  let lively = 0;
  for (let x = 0; x < s; x++) {
    const amb = P.ambiance[members[x]!];
    if (amb === 1) calm++;
    else if (amb === 2) lively++;
  }
  const ambianceMismatch = Math.min(calm, lively);
  const objectiveMilli =
    meanMilli +
    Math.floor((c.lambdaRomance * romCov) / 1000) +
    Math.floor((c.lambdaFriend * friendFit) / 1000) +
    Math.floor((c.storyGuarantee.lambdaGuarantee * storyCov) / 1000) -
    Math.floor((c.lambdaGender * imbalance) / 1000) -
    c.lambdaSize * Math.max(0, c.targetSize - s) -
    (c.lambdaAmbiance ?? 0) * ambianceMismatch;
  return { objectiveMilli, pairMinScore: pairs > 0 ? minW : 0, sumW, pairs, romanceSeekers: seekers, romanceCovered: covered, genderImbalancePermille: imbalance, romanceOnlyCovered, storyGuaranteed: guaranteed, genderCapOk };
}

/** V5.2 B : « potes uniquement » par membre (index → booléen), même règle que `storyFriendsOnly`. */
export function friendsOnlyFlags(members: readonly number[], P: PairTable, t: Tuning): boolean[] {
  const min = t.outings.composition.storyGuarantee.minCompatible;
  return members.map((a) => {
    if (P.seeksRomance[a] !== 1) return false;
    let n = 0;
    for (const b of members) if (b !== a && P.story(a, b)) n++;
    return n < min;
  });
}

/** `units` sont-elles toutes compatibles avec tous les `members` ? */
export function compatibleWith(units: readonly number[], members: readonly number[], P: PairTable): boolean {
  for (const u of units) for (const m of members) if (!P.compatible(u, m)) return false;
  return true;
}
