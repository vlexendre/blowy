/**
 * Table des paires d'un lot de candidats : compatibilité (filtres réciproques nommés §4.2 +
 * score minimal) et score de paire w(a,b) ∈ [0,100] (§4.3), calculés paresseusement et mis en cache.
 * Le score réutilise `scoreVision` avec les poids de groupe (G = 0, distance 0 : aucune distance
 * n'est jamais calculée).
 */
import { GENDERS, ageBracketBounds, ageBracketOf, pairKey, type Gender } from '@blowy/domain';
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
  /** V5.6 (E11) : tranches acceptées pour une histoire (vide/absent = repli `groupAge`). */
  storyAgeBrackets?: readonly string[];
}

const ageOk = (s: SeeksProfile, o: SeeksProfile) => s.groupAge === undefined || o.age === undefined || (o.age >= s.groupAge.min && o.age <= s.groupAge.max);

/** rom(a,b) : les deux cherchent la romance, chacun est dans les genres romance (et la tranche d'âge) de l'autre (§4.2, V5.1 A.1). */
export function romanceCompatible(a: SeeksProfile, b: SeeksProfile): boolean {
  return a.seeks.romance && b.seeks.romance && a.romanceGenders.includes(b.gender) && b.romanceGenders.includes(a.gender) && ageOk(a, b) && ageOk(b, a);
}

/** La tranche fixe (V5.2 C.9) de `o` recoupe-t-elle la tranche d'âge souhaitée par `s` ? (inconnu → oui) */
const bracketOk = (s: SeeksProfile, o: SeeksProfile) => {
  if (o.age !== undefined && s.storyAgeBrackets && s.storyAgeBrackets.length > 0) return s.storyAgeBrackets.includes(ageBracketOf(o.age));
  if (s.groupAge === undefined || o.age === undefined) return true;
  const [lo, hi] = ageBracketBounds(ageBracketOf(o.age));
  return lo <= s.groupAge.max && hi >= s.groupAge.min;
};

/**
 * V5.2 (B.5) : compatibilité « histoire » de la garantie « pour toi » — les deux cherchent une
 * histoire, genres recherchés réciproques, et la tranche FIXE de chacun recoupe la tranche d'âge
 * souhaitée par l'autre (jamais l'âge exact). En composition, le filtre AGE_PREFERENCE (âge exact)
 * s'applique en plus à toute paire du groupe.
 */
export function storyCompatible(a: SeeksProfile, b: SeeksProfile): boolean {
  return a.seeks.romance && b.seeks.romance && a.romanceGenders.includes(b.gender) && b.romanceGenders.includes(a.gender) && bracketOk(a, b) && bracketOk(b, a);
}

/** Une personne de la garantie : son profil d'intentions et sa team (les membres de sa team ne comptent pas). */
export interface StoryMember {
  userId: string;
  teamId: string | null;
  seeks: SeeksProfile;
}

/**
 * V5.2 (B.5–B.6) : booléen « potes uniquement » par personne d'un groupe — vrai ssi la personne
 * cherche une histoire et que le groupe compte moins de `minCompatible` personnes `storyCompatible`
 * avec elle (hors sa team). Rien d'autre ne sort : ni qui, ni combien.
 */
export function storyFriendsOnly(members: readonly StoryMember[], t: Tuning): Map<string, boolean> {
  const min = t.outings.composition.storyGuarantee.minCompatible;
  const out = new Map<string, boolean>();
  for (const m of members) {
    if (!m.seeks.seeks.romance) {
      out.set(m.userId, false);
      continue;
    }
    let n = 0;
    for (const o of members) if (o !== m && o.userId !== m.userId && !(m.teamId !== null && o.teamId === m.teamId) && storyCompatible(m.seeks, o.seeks)) n++;
    out.set(m.userId, n < min);
  }
  return out;
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
  /** D-039 : genre unique de « qui je veux rencontrer » (−1 si aucun ou plusieurs) — exception « groupe non mixte demandé ». */
  readonly meetOnly: Int8Array;
  /** Index de team (−1 = seul·e) : les membres d'une même team ne comptent pas pour la garantie. */
  readonly team: Int32Array;
  private readonly bracketLo: Int16Array;
  private readonly bracketHi: Int16Array;
  /** V5.6 : tranche fixe de chacun (clé de la grille) et tranches « histoire » acceptées (vide = repli `groupAge`). */
  private readonly bracketKey: readonly string[];
  private readonly storyBrackets: readonly (ReadonlySet<string> | null)[];
  /** V5.6 (§4.3) : ambiance souhaitée (0 = peu importe, 1 = calme, 2 = animé) — pénalité douce de mélange. */
  readonly ambiance: Int8Array;
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
    this.meetOnly = Int8Array.from(cands, (c) => (c.meetGenders.length === 1 ? genderIndex(c.meetGenders[0]!) : -1));
    this.romanceMask = Int32Array.from(cands, (c) => genderMask(c.romanceGenders));
    const teams = new Map<string, number>();
    this.team = Int32Array.from(cands, (c) => (c.teamId === null ? -1 : (teams.get(c.teamId) ?? (teams.set(c.teamId, teams.size), teams.size - 1))));
    this.bracketLo = Int16Array.from(cands, (c) => ageBracketBounds(ageBracketOf(c.profile.age))[0]);
    this.bracketHi = Int16Array.from(cands, (c) => ageBracketBounds(ageBracketOf(c.profile.age))[1]);
    this.bracketKey = cands.map((c) => ageBracketOf(c.profile.age));
    this.storyBrackets = cands.map((c) => (c.storyAgeBrackets && c.storyAgeBrackets.length > 0 ? new Set(c.storyAgeBrackets) : null));
    this.ambiance = Int8Array.from(cands, (c) => (c.ambiance === 'CALM' ? 1 : c.ambiance === 'LIVELY' ? 2 : 0));
    this.profiles = cands.map(filterProfileOf);
    this.cache = new Int16Array(n * n).fill(UNKNOWN);
    this.tStar = groupScoringTuning(tuning);
  }

  /** Motif d'exclusion de la paire (diagnostic), ou null si compatible. */
  exclusion(i: number, j: number): ExclusionReason | null {
    const key = pairKey(this.ids[i]!, this.ids[j]!);
    const exempt = this.exemptPairs.has(key);
    const facts: PairFacts = { distanceKm: 0, blockedOrReported: this.facts.blockedPairs.has(key), metBefore: !exempt && this.facts.metPairs.has(key), knownContact: !exempt && (this.facts.knownContactPairs?.has(key) ?? false), pendingProposals: [0, 0] };
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

  /** `storyCompatible` sur la table (hors même team) ; même règle que la fonction exportée. */
  story(i: number, j: number): boolean {
    if (!this.rom(i, j) || (this.team[i]! >= 0 && this.team[i] === this.team[j])) return false;
    const a = this.cands[i]!.groupAge;
    const b = this.cands[j]!.groupAge;
    const sa = this.storyBrackets[i];
    const sb = this.storyBrackets[j];
    const iAcceptsJ = sa ? sa.has(this.bracketKey[j]!) : this.bracketLo[j]! <= a.max && this.bracketHi[j]! >= a.min;
    const jAcceptsI = sb ? sb.has(this.bracketKey[i]!) : this.bracketLo[i]! <= b.max && this.bracketHi[i]! >= b.min;
    return iAcceptsJ && jAcceptsI;
  }

  candidate(i: number): OutingCandidate {
    return this.cands[i]!;
  }
}
