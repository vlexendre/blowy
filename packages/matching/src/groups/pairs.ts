/**
 * Table des paires d'un lot de candidats : compatibilité (filtres réciproques nommés §4.2 +
 * score minimal) et score de paire w(a,b) ∈ [0,100] (§4.3), calculés paresseusement et mis en cache.
 * Le score réutilise `scoreVision` avec les poids de groupe (G = 0, distance 0 : aucune distance
 * n'est jamais calculée).
 */
import { GENDERS, pairKey, type Gender } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { ExclusionReason, MatchProfile, PairFacts } from '../types.js';
import { PAIR_FILTERS, firstExclusion } from '../filters/index.js';
import { scoreVision } from '../score/index.js';
import type { CompositionFacts, OutingCandidate } from './types.js';

const GENDER_BIT: Record<Gender, number> = Object.fromEntries(GENDERS.map((g, i) => [g, 1 << i])) as Record<Gender, number>;
export const genderMask = (genders: readonly Gender[]): number => genders.reduce((m, g) => m | GENDER_BIT[g], 0);
export const genderIndex = (g: Gender): number => GENDERS.indexOf(g);

/** Ce qu'il faut savoir des intentions d'une personne pour les règles romance / amis. */
export interface SeeksProfile {
  gender: Gender;
  seeks: { friends: boolean; romance: boolean };
  meetGenders: readonly Gender[];
  romanceGenders: readonly Gender[];
  /** V5.1 (A.1) : âges appliqués en silence au dépouillement quand fournis. */
  age?: number;
  groupAge?: { min: number; max: number };
}

const ageOk = (s: SeeksProfile, o: SeeksProfile) => s.groupAge === undefined || o.age === undefined || (o.age >= s.groupAge.min && o.age <= s.groupAge.max);

/** rom(a,b) : les deux cherchent la romance, chacun est dans les genres romance (et la tranche d'âge) de l'autre (§4.2, V5.1 A.1). */
export function romanceCompatible(a: SeeksProfile, b: SeeksProfile): boolean {
  return a.seeks.romance && b.seeks.romance && a.romanceGenders.includes(b.gender) && b.romanceGenders.includes(a.gender) && ageOk(a, b) && ageOk(b, a);
}

/** Voie Duo (§4.2, mode DUO, en plus de `FILTERS`) : romance réciproque, ou amitié réciproque respectant « qui je veux rencontrer ». */
export function duoLaneCompatible(a: SeeksProfile, b: SeeksProfile): boolean {
  if (romanceCompatible(a, b)) return true;
  const meetOk = (s: SeeksProfile, o: SeeksProfile) => s.meetGenders.length === 0 || s.meetGenders.includes(o.gender);
  return a.seeks.friends && b.seeks.friends && meetOk(a, b) && meetOk(b, a);
}

/** Tuning t* : poids du score de vision remplacés par les poids de groupe (§4.3). */
export const groupScoringTuning = (t: Tuning): Tuning => ({ ...t, matching: { ...t.matching, weights: t.outings.composition.visionWeights } });

/** Profil de filtrage d'un candidat : âge de groupe, « qui je veux rencontrer », présences réelles. */
export const filterProfileOf = (c: OutingCandidate): MatchProfile => ({
  ...c.profile,
  preferences: { ...c.profile.preferences, minAge: c.groupAge.min, maxAge: c.groupAge.max },
  meetGenders: c.meetGenders,
  attendance: c.attendance,
});

/** w(a,b) = arrondi de la moyenne des deux scores de vision orientés (M est asymétrique). */
export function groupPairScore(a: MatchProfile, b: MatchProfile, tStar: Tuning): number {
  return Math.round((scoreVision(a, b, 0, tStar).score + scoreVision(b, a, 0, tStar).score) / 2);
}

const UNKNOWN = -2;
const INCOMPATIBLE = -1;

export class PairTable {
  readonly n: number;
  readonly ids: readonly string[];
  readonly gender: Int8Array;
  readonly seeksRomance: Uint8Array;
  readonly seeksFriends: Uint8Array;
  /** romance seulement (sans amis) : doit avoir ≥ 1 rom-compatible dans son groupe. */
  readonly romanceOnly: Uint8Array;
  readonly meetEmpty: Uint8Array;
  private readonly romanceMask: Int32Array;
  private readonly profiles: MatchProfile[];
  private readonly cache: Int16Array;
  private readonly tStar: Tuning;

  constructor(
    private readonly cands: readonly OutingCandidate[],
    private readonly facts: CompositionFacts,
    private readonly tuning: Tuning,
    /** Paires internes aux teams : seules les règles de blocage s'appliquent entre elles. */
    private readonly exemptPairs: ReadonlySet<string> = new Set(),
  ) {
    const n = cands.length;
    this.n = n;
    this.ids = cands.map((c) => c.profile.userId);
    this.gender = Int8Array.from(cands, (c) => genderIndex(c.profile.gender));
    this.seeksRomance = Uint8Array.from(cands, (c) => (c.seeks.romance ? 1 : 0));
    this.seeksFriends = Uint8Array.from(cands, (c) => (c.seeks.friends ? 1 : 0));
    this.romanceOnly = Uint8Array.from(cands, (c) => (c.seeks.romance && !c.seeks.friends ? 1 : 0));
    this.meetEmpty = Uint8Array.from(cands, (c) => (c.meetGenders.length === 0 ? 1 : 0));
    this.romanceMask = Int32Array.from(cands, (c) => genderMask(c.romanceGenders));
    this.profiles = cands.map(filterProfileOf);
    this.cache = new Int16Array(n * n).fill(UNKNOWN);
    this.tStar = groupScoringTuning(tuning);
  }

  /** Motif d'exclusion de la paire (diagnostic), ou null si compatible. */
  exclusion(i: number, j: number): ExclusionReason | null {
    const key = pairKey(this.ids[i]!, this.ids[j]!);
    const exempt = this.exemptPairs.has(key);
    const facts: PairFacts = { distanceKm: 0, blockedOrReported: this.facts.blockedPairs.has(key), metBefore: !exempt && this.facts.metPairs.has(key), pendingProposals: [0, 0] };
    return firstExclusion({ a: this.profiles[i]!, b: this.profiles[j]!, facts, tuning: this.tuning }, PAIR_FILTERS);
  }

  /** w(i,j) si la paire peut être dans un même groupe, sinon −1. */
  score(i: number, j: number): number {
    const k = i < j ? i * this.n + j : j * this.n + i;
    let v = this.cache[k]!;
    if (v === UNKNOWN) {
      const key = pairKey(this.ids[i]!, this.ids[j]!);
      if (i === j) v = INCOMPATIBLE;
      else if (this.exemptPairs.has(key)) {
        // Membres d'une même team : ils ont choisi de venir ensemble ; seul un blocage les sépare.
        v = this.facts.blockedPairs.has(key) ? INCOMPATIBLE : groupPairScore(this.profiles[i]!, this.profiles[j]!, this.tStar);
      } else if (this.exclusion(i, j) !== null) v = INCOMPATIBLE;
      else {
        const w = groupPairScore(this.profiles[i]!, this.profiles[j]!, this.tStar);
        v = w >= this.tuning.outings.composition.minPairScore ? w : INCOMPATIBLE;
      }
      this.cache[k] = v;
    }
    return v;
  }

  compatible(i: number, j: number): boolean {
    return this.score(i, j) >= 0;
  }

  rom(i: number, j: number): boolean {
    return this.seeksRomance[i] === 1 && this.seeksRomance[j] === 1 && (this.romanceMask[i]! & (1 << this.gender[j]!)) !== 0 && (this.romanceMask[j]! & (1 << this.gender[i]!)) !== 0;
  }

  candidate(i: number): OutingCandidate {
    return this.cands[i]!;
  }
}
