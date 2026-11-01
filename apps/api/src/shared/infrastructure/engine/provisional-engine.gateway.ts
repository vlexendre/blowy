/**
 * ADAPTER PROVISOIRE de EngineGateway, en attendant l'API publique de @blowy/pet-engine et
 * @blowy/matching (agent B). Tous les nombres viennent de @blowy/tuning ; les formules sont
 * celles du brief (§6, §7) au plus simple. À REMPLACER par PetEngineGateway (même port) :
 * aucun use case ne dépend de cette classe. Signalé `engineVersion = provisional@…`.
 */
import { LINK_LEVEL_THRESHOLDS, type PetPose, type Species } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type {
  CallInput,
  CareResult,
  EngineGateway,
  EngineParams,
  LinkGain,
  PetCareAction,
  PetSnapshot,
  PetTimeContext,
  RelationshipSnapshot,
  SharedAction,
  VisionCandidate,
  VisionScore,
} from '../../application/ports/engine.gateway.js';

const HOUR = 3_600_000;
const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));

function localHour(at: Date, tz: string): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(at));
}

/** PRNG déterministe (graine serveur + compteur) — mulberry32 sur hash FNV. */
function rand01(seed: string, counter: number): number {
  let h = 2166136261;
  for (const ch of `${seed}:${counter}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let t = (h >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export class ProvisionalEngineGateway implements EngineGateway {
  readonly engineVersion: string;
  readonly tuningVersion: string;
  readonly params: EngineParams;

  constructor(private readonly t: Tuning) {
    this.engineVersion = `provisional@${t.version}`;
    this.tuningVersion = t.version;
    this.params = {
      proposalTtlHours: t.matching.proposalTtlHours,
      matchingRunHour: t.matching.dailyRunHour,
      batchSize: t.matching.batch.size,
      messageReplyWindowHours: t.actions.messages.replyWindowHours,
      reliabilityGhostingAfterHours: t.reliability.ghostingAfterHours,
      reliabilityGhostingPenalty: t.reliability.ghostingPenalty,
      silenceCloseDays: t.reliability.silenceCloseDays,
      relationshipInitial: { ...t.relationshipInitial },
      moveInMinLevel: 3,
      inactiveAfterDays: t.matching.inactiveAfterDays,
      ghosterLimitMinReliability: t.matching.ghosterLimitMinReliability,
      branchVoteDeadlineHours: 72, // HYPOTHÈSE C : échéance commune de vote (à verser au tuning par B)
      consentOfferTtlHours: 72, // HYPOTHÈSE C : durée de validité d'une offre de consentement
      lazyCatchUpAfterDays: t.time.lazyCatchUpAfterDays,
      sickHealthBelow: t.poses.sickHealthBelow,
    };
  }

  initialPet(_species: Species, now: Date): PetSnapshot {
    return { gauges: { ...this.t.gauges.initial }, petXpMilli: 0, asOf: now, engineState: { lowSatietyMs: 0 }, engineVersion: this.engineVersion, tuningVersion: this.tuningVersion };
  }

  /** Intégration par pas d'au plus 15 min avec bascule jour/nuit et pauses (decay suspendu). */
  advancePet(s: PetSnapshot, to: Date, species: Species, ctx: PetTimeContext): PetSnapshot {
    if (to <= s.asOf) return s;
    const g = this.t.gauges;
    const st = { ...s.gauges };
    let lowMs = Number((s.engineState as { lowSatietyMs?: number } | null)?.lowSatietyMs ?? 0);
    let cur = s.asOf.getTime();
    const end = to.getTime();
    const step = this.t.time.tickMinutes * 60_000;
    while (cur < end) {
      const next = Math.min(end, cur + step);
      const dtH = (next - cur) / HOUR;
      const mid = new Date((cur + next) / 2);
      const paused = ctx.pauses.some((p) => p.from.getTime() <= mid.getTime() && mid.getTime() < p.to.getTime());
      if (!paused) {
        const h = localHour(mid, ctx.timezone);
        const night = this.t.time.night.startHour > this.t.time.night.endHour ? h >= this.t.time.night.startHour || h < this.t.time.night.endHour : h >= this.t.time.night.startHour && h < this.t.time.night.endHour;
        const div = night ? g.nightDecayDivisor : 1;
        st.satiety = clamp(st.satiety - (g.speciesSatietyDecayPerHour[species] ?? g.decayPerHour.satiety) * dtH / div);
        st.energy = night ? clamp(st.energy + g.nightEnergyRecoveryPerHour * dtH) : clamp(st.energy - g.decayPerHour.energy * dtH);
        st.mood = clamp(st.mood - g.decayPerHour.mood * dtH / div);
        if (st.satiety < g.starvation.satietyBelow) {
          lowMs += next - cur;
          if (lowMs > g.starvation.graceHours * HOUR) st.health = clamp(st.health - g.decayPerHour.health * dtH, g.healthFloor);
        } else lowMs = 0;
      }
      cur = next;
    }
    return { ...s, gauges: st, asOf: to, engineState: { lowSatietyMs: lowMs } };
  }

  care(s: PetSnapshot, action: PetCareAction, _species: Species, _now: Date, _ctx: PetTimeContext): CareResult {
    const sick = this.isSick(s);
    if (action === 'FEED') {
      const gauges = { ...s.gauges, satiety: clamp(s.gauges.satiety + this.t.care.feed.satiety) };
      const xp = sick ? 0 : this.t.care.feed.petXp * 1000;
      return { snapshot: { ...s, gauges, petXpMilli: s.petXpMilli + xp }, petXpGainMilli: xp, reaction: 'JOYFUL' };
    }
    const gauges = { ...s.gauges, health: clamp(s.gauges.health + this.t.care.heal.health) };
    return { snapshot: { ...s, gauges }, petXpGainMilli: 0, reaction: 'AFFECTIONATE' };
  }

  isSick(s: PetSnapshot): boolean {
    return s.gauges.health < this.t.poses.sickHealthBelow;
  }

  poseFor(s: PetSnapshot, now: Date, ctx: PetTimeContext): PetPose {
    const p = this.t.poses;
    const h = localHour(now, ctx.timezone);
    const night = h >= this.t.time.night.startHour || h < this.t.time.night.endHour;
    if (s.gauges.health < p.sickHealthBelow) return 'SICK';
    if (night || s.gauges.energy < p.asleepEnergyBelow) return 'ASLEEP';
    if (s.gauges.satiety < p.hungrySatietyBelow) return 'HUNGRY';
    if (s.gauges.mood < p.sadMoodBelow) return 'SAD';
    if (s.gauges.mood > p.joyfulMoodAbove) return 'JOYFUL';
    return 'PRESENTATION';
  }

  private multiplier(r: RelationshipSnapshot): number {
    const { mine: a, theirs: b } = r.contributions;
    const k = a + b === 0 ? 1 : 1 - (this.t.link.balancePenaltyPermille / 1000) * (Math.abs(a - b) / (a + b));
    const am = this.t.link.affinityMultiplier;
    const m = (am.basePermille + (am.spanPermille * r.affinity) / 100) / 1000;
    return k * m;
  }

  private gate(r: RelationshipSnapshot): boolean {
    return !r.paused && !r.eitherPetSick;
  }

  sharedActionGain(action: SharedAction, r: RelationshipSnapshot, _relDay: string): LinkGain | null {
    const a = action === 'HUG' ? this.t.actions.hug : this.t.actions.play;
    if (action === 'HUG' && (r.reachedLevel < this.t.actions.hug.minLevel || r.complicity < this.t.actions.hug.minComplicity)) return null;
    const key = action === 'HUG' ? 'hug' : 'play';
    const done = r.todayCounters[key]?.count ?? 0;
    const earns = done < a.gainCapPerDay && this.gate(r);
    const xp = earns ? Math.round(a.linkXp * 1000 * this.multiplier(r)) : 0;
    return {
      xpMilli: xp,
      complicityDelta: earns && action === 'HUG' ? this.t.actions.hug.complicity : 0,
      tensionDelta: earns && action === 'HUG' ? this.t.actions.hug.tension : 0,
      counters: { [key]: { count: 1, xpMilli: xp } },
      contributionWeight: earns ? this.t.link.contributionWeights.play : 0,
      moodDelta: a.mood,
      energyDelta: action === 'PLAY' ? this.t.actions.play.energy : 0,
    };
  }

  messageRoundTripGain(r: RelationshipSnapshot, _relDay: string): LinkGain {
    const m = this.t.actions.messages;
    const today = r.todayCounters['message'] ?? { count: 0, xpMilli: 0 };
    const capMilli = m.dailyXpCap * 1000;
    // Plafond appliqué à la base (avant multiplicateurs), bonus du premier aller-retour inclus.
    const base = (m.roundTripXp + (today.count === 0 ? m.firstRoundTripBonusXp : 0)) * 1000;
    const usedBase = Math.min(capMilli, today.count === 0 ? 0 : (m.roundTripXp * today.count + m.firstRoundTripBonusXp) * 1000);
    const allowedBase = this.gate(r) ? Math.max(0, Math.min(base, capMilli - usedBase)) : 0;
    const xp = Math.round(allowedBase * this.multiplier(r));
    return { xpMilli: xp, complicityDelta: 0, tensionDelta: 0, counters: { message: { count: 1, xpMilli: xp } }, contributionWeight: this.t.link.contributionWeights.message, moodDelta: 0, energyDelta: 0 };
  }

  resolveCall(i: CallInput): { refused: boolean } {
    if (i.petSick || i.lastCallRefused) return { refused: false };
    const r = this.t.refusal;
    const E = (i.vision.axes.kindMischief + 1) / 2;
    const A = clamp(i.waitingHours, 0, r.waitingHoursCap);
    const p = clamp(r.base + r.mischiefWeight * E + r.desireWeight * (i.desire / 100) + r.waitingWeight * (A / 100) + (r.speciesBonus[i.species] ?? 0), r.min, r.max);
    return { refused: rand01(i.seed, i.counter) < p };
  }

  levelFor(xpMilli: number, branch: RelationshipSnapshot['branch']): number {
    const th = this.t.link.levelThresholds ?? LINK_LEVEL_THRESHOLDS;
    let lvl = 1;
    for (let i = 0; i < th.length; i++) if (xpMilli >= th[i]! * 1000) lvl = i + 1;
    const cap = branch === 'UNDECIDED' ? this.t.link.undecidedMaxLevel : branch === 'FRIEND' ? this.t.link.friendMaxLevel : 7;
    return Math.min(lvl, cap);
  }

  visionScore(a: VisionCandidate, b: VisionCandidate): VisionScore {
    const w = this.t.matching.weights;
    const sim = (x: number, y: number) => 1 - Math.abs(x - y) / 2;
    const comp = (x: number, y: number) => 1 - Math.abs(x + y) / 2;
    const C = (sim(a.vision.axes.sportyContemplative, b.vision.axes.sportyContemplative) + sim(a.vision.axes.homeAdventure, b.vision.axes.homeAdventure) + comp(a.vision.axes.kindMischief, b.vision.axes.kindMischief) + comp(a.vision.axes.scienceArt, b.vision.axes.scienceArt)) / 4;
    const pa = new Set(a.vision.passions);
    const inter = b.vision.passions.filter((x) => pa.has(x)).length;
    const union = new Set([...a.vision.passions, ...b.vision.passions]).size;
    const P = union ? inter / union : 0;
    const mx = this.t.matching.matrices;
    const D = mx.sunday[a.vision.sunday]?.[b.vision.sunday] ?? 0;
    const E = mx.school[a.vision.school]?.[b.vision.school] ?? 0;
    const R = a.rhythm ?? this.t.matching.rhythm.neutral;
    const full = this.t.matching.geography.fullScoreKm;
    const maxD = a.maxMutualDistanceKm;
    const d = a.distanceKm;
    const G = d === null ? 0.5 : d <= full ? 1 : maxD <= full ? 0 : clamp(1 - (d - full) / (maxD - full), 0, 1);
    const S = mx.species[a.species]?.[b.species] ?? 0.5;
    const M = ((a.reputation ?? this.t.matching.reputation.neutral) + (b.reputation ?? this.t.matching.reputation.neutral)) / 2;
    const breakdown = { C, P, D, E, R, G, S, M };
    const score = 100 * (w.C * C + w.P * P + w.D * D + w.E * E + w.R * R + w.G * G + w.S * S + w.M * M);
    return { score: clamp(score), breakdown };
  }
}
