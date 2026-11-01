/**
 * Simulateur seedé de relations sur N jours. Utilise UNIQUEMENT le moteur public (reduceMut) :
 * aucune règle recopiée. Pas de simulation horaire : chaque heure éveillée tire des actions,
 * le moteur intègre le temps exactement entre deux événements.
 */
import { DEFAULT_TUNING, type Tuning } from '@blowy/tuning';
import { HOUR_MS, DAY_MS, SPECIES, type Species, type VisionAxes } from '@blowy/domain';
import { ENGINE_VERSION, type EngineContext, type EngineEffect, type EngineEvent, type EventInput, type World } from '../model/index.js';
import { reduceMut } from '../reduce.js';
import { createPet, createRelationship, emptyWorld } from '../factory.js';
import { displayGauges } from '../gauges/index.js';
import { rngFrom, type Rng } from '../random/index.js';
import { localParts, isNightHour, daysFromCivil } from '../time/index.js';
import { PROFILES, type EngagementProfile } from './profiles.js';

export interface SimulationOptions {
  relationships: number;
  days: number;
  seed: string;
  tuning?: Tuning;
  startMs?: number;
  tz?: string;
}

interface Person {
  petId: string;
  profile: EngagementProfile;
  churned: boolean;
  pausedUntil: number;
  absentUntil: number;
  coins: number;
}

interface RelSim {
  id: string;
  people: [Person, Person];
  levelDays: Partial<Record<number, number>>;
  sickHours: number;
  activePetHours: number;
  everSick: boolean;
  silentExit: boolean;
  churnedExit: boolean;
}

export interface SimulationReport {
  tuningVersion: string;
  engineVersion: string;
  seed: string;
  relationships: number;
  days: number;
  medianDaysToLevel: Record<'N2' | 'N3' | 'N5' | 'N7', number | null>;
  reachedShare: Record<'N2' | 'N3' | 'N5' | 'N7', number>;
  n3ByDay14Share: number;
  n3ByDay14Hypothesis: number;
  byProfile: Record<string, { relationships: number; n3ByDay14Share: number; medianDaysToN3: number | null }>;
  coins: { created: number; spent: number; createdPerPersonPerDay: number; byReason: Record<string, number> };
  sickness: { relationshipsWithSickActivePetShare: number; sickPetHoursShare: number };
  silentExitShare: number;
  elapsedMs: number;
}

const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;
const chance = (rng: Rng, p: number): boolean => rng() < p;
const poisson = (rng: Rng, mean: number): number => {
  let k = 0;
  for (let p = Math.exp(-mean), s = p, u = rng(); u > s && k < 8; k++) {
    p *= mean / (k + 1);
    s += p;
  }
  return k;
};
const axis = (rng: Rng): number => Math.round((rng() * 2 - 1) * 100) / 100;
const randomAxes = (rng: Rng): VisionAxes => ({ kindMischief: axis(rng), sportyContemplative: axis(rng), scienceArt: axis(rng), homeAdventure: axis(rng) });
const pickProfile = (rng: Rng): EngagementProfile => {
  let u = rng();
  for (const p of PROFILES) if ((u -= p.share) <= 0) return p;
  return PROFILES[PROFILES.length - 1]!;
};
/** Affinité : distribution en cloche autour de 62 (sélection par le matching). HYPOTHÈSE */
const affinity = (rng: Rng): number => Math.max(20, Math.min(98, Math.round(62 + (rng() + rng() + rng() - 1.5) * 30)));

const round1 = (v: number | null): number | null => (v === null ? null : Math.round(v * 10) / 10);
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

function simulateOne(index: number, o: Required<SimulationOptions>, t: Tuning, coinsByReason: Record<string, number>): { rel: RelSim; spent: number } {
  const rng = rngFrom(o.seed, 'rel', String(index));
  const world: World = emptyWorld();
  const start = o.startMs;
  const species = (): Species => pick(rng, SPECIES);
  const ids = [`p${index}a`, `p${index}b`] as const;
  for (const id of ids) world.pets[id] = createPet({ id, species: species(), axes: randomAxes(rng), tz: o.tz, nowMs: start }, t);
  const r = createRelationship({ id: `r${index}`, petIds: [ids[0], ids[1]], tz: o.tz, affinity: affinity(rng), nowMs: start }, t);
  world.relationships[r.id] = r;
  const people: [Person, Person] = [0, 1].map((s) => ({ petId: r.petIds[s]!, profile: pickProfile(rng), churned: false, pausedUntil: 0, absentUntil: 0, coins: 0 })) as [Person, Person];
  const sim: RelSim = { id: r.id, people, levelDays: { 1: 0 }, sickHours: 0, activePetHours: 0, everSick: false, silentExit: false, churnedExit: false };
  let seq = 0;
  let spent = 0;
  let now = start;
  const ctx = (): EngineContext => ({ now, seed: o.seed, engineVersion: ENGINE_VERSION, tuning: t });
  const handle = (effects: EngineEffect[]): void => {
    for (const e of effects) {
      if (e.type === 'COINS_CREDIT') {
        const p = people.find((x) => x.petId === e.petId);
        if (p) p.coins += e.amount;
        coinsByReason[e.reason] = (coinsByReason[e.reason] ?? 0) + e.amount;
      } else if (e.type === 'LEVEL_REACHED') {
        sim.levelDays[e.level] ??= (now - start) / DAY_MS;
      } else if (e.type === 'RELATIONSHIP_SILENCE_CLOSE') {
        sim.silentExit = true;
      }
    }
  };
  const fire = (ev: EventInput): EngineEffect[] => {
    const effects = reduceMut(world, { ...ev, eventId: `${r.id}:${seq++}` } as EngineEvent, ctx());
    handle(effects);
    return effects;
  };
  const rel = () => world.relationships[r.id]!;
  const sideOfPerson = (i: 0 | 1) => i;
  const streakDay = new Set<string>();

  for (let h = 0; h < o.days * 24; h++) {
    now = start + h * HOUR_MS;
    const hour = localParts(now, o.tz).hour;
    const awake = !isNightHour(hour, t.time.night);
    const relation = rel();
    if (relation.status === 'ENDED' || sim.silentExit) break;

    // Événements quotidiens (à 9 h locale) : churn, pauses, absences, missions, dépenses, emménagement/branche.
    if (hour === 9) {
      for (const i of [0, 1] as const) {
        const p = people[i];
        if (p.churned) continue;
        if (chance(rng, p.profile.churnPerDay)) p.churned = true;
        else if (now > p.pausedUntil && now > p.absentUntil && chance(rng, p.profile.pausePerDay)) {
          const len = Math.round((3 + rng() * 7) * DAY_MS);
          p.pausedUntil = now + len;
          fire({ type: 'PAUSE_SET', scope: 'PET', targetId: p.petId, interval: { startMs: now, endMs: now + len } });
        } else if (now > p.absentUntil && chance(rng, p.profile.absencePerDay)) p.absentUntil = now + Math.round((2 + rng() * 4) * DAY_MS);
      }
      const lvl = relation.reachedLevel;
      const eligibleXp = relation.xpMilli;
      const gatesNeeded = (): Partial<World['relationships'][string]['gates']> | null => {
        if (lvl === 2 && eligibleXp >= t.link.levelThresholds[2]! * 1000 && chance(rng, 0.6)) return { moveInAccepted: true };
        if (lvl === 3 && relation.gates.branch === 'UNDECIDED' && chance(rng, 0.8)) return { branch: chance(rng, 0.45) ? 'PLUS' : 'FRIEND' };
        if (lvl === 4 && relation.gates.branch === 'PLUS' && chance(rng, 0.5)) return { plusRevealAccepted: true };
        if (lvl === 5 && relation.gates.branch === 'PLUS' && chance(rng, 0.35)) return { irlDateConfirmed: true };
        if (lvl === 6 && relation.gates.branch === 'PLUS' && chance(rng, 0.5)) return { eggAccepted: true };
        return null;
      };
      const g = gatesNeeded();
      if (g && people.every((p) => !p.churned)) {
        fire({ type: 'GATES_UPDATED', relationshipId: r.id, gates: g });
        if (g.moveInAccepted) fire({ type: 'MOVE_IN', relationshipId: r.id });
      }
      // Missions (journée de relation) et dépenses.
      const missionToday = [0, 1].map((i) => !people[i]!.churned && now > people[i]!.absentUntil && chance(rng, people[i]!.profile.missionPerDay));
      const joint = missionToday[0] && missionToday[1] && chance(rng, Math.min(people[0].profile.jointMissionShare, people[1].profile.jointMissionShare) * 2);
      for (const i of [0, 1] as const) {
        if (!missionToday[i]) continue;
        const missionId = joint ? 'M-shared' : `M-${i}`;
        fire({ type: 'MISSION_VALIDATED', petId: people[i].petId, missionId, relationshipId: r.id, boost: chance(rng, 0.5) ? 'SATIETY' : 'MOOD', weekendEntitlement: false });
        streakDay.add(`${i}:${Math.floor(h / 24)}`);
      }
      for (const p of people) {
        if (p.churned || !chance(rng, p.profile.spendPerDay)) continue;
        const price = chance(rng, 0.6) ? t.coins.catalog.streakFreeze : t.coins.catalog.visibilityBoost;
        if (p.coins >= price) {
          p.coins -= price;
          spent += price;
        }
      }
      // Série : palier de 7 jours de mission (approximation : 7 jours de mission cumulés).
      for (const i of [0, 1] as const) {
        const days = [...streakDay].filter((k) => k.startsWith(`${i}:`)).length;
        if (missionToday[i] && days > 0 && days % t.coins.streakMilestone.days === 0) {
          people[i].coins += t.coins.streakMilestone.coins;
          coinsByReason.STREAK_MILESTONE = (coinsByReason.STREAK_MILESTONE ?? 0) + t.coins.streakMilestone.coins;
        }
      }
    }

    if (awake) {
      for (const i of [0, 1] as const) {
        const p = people[i];
        if (p.churned || now < p.absentUntil || !chance(rng, p.profile.openPerHour)) continue;
        const pet = world.pets[p.petId]!;
        const g = displayGauges(pet);
        // Nourrir est gratuit : la personne nourrit jusqu'à satiété affichée ≥ 70 (au plus 3 fois). HYPOTHÈSE comportementale
        if (g.satiety < 60 && chance(rng, p.profile.feedPerOpen))
          for (let k = 0; k < 3 && displayGauges(pet).satiety < 70; k++) fire({ type: 'FEED_PET', petId: p.petId, weekendEntitlement: false });
        if (g.health < t.poses.sickHealthBelow) fire({ type: 'HEAL_PET', petId: p.petId });
        const spot = rel().spot;
        if (pet.location.kind !== spot.kind || pet.location.contextId !== spot.contextId) {
          fire({ type: 'CALL_PET', petId: p.petId, to: spot, purpose: 'MEET' });
          if (pet.location.contextId !== spot.contextId) fire({ type: 'CALL_PET', petId: p.petId, to: spot, purpose: 'MEET' });
        }
        for (let m = poisson(rng, p.profile.messagesPerOpen); m > 0; m--) fire({ type: 'MESSAGE_PUBLISHED', relationshipId: r.id, authorSide: sideOfPerson(i), messageId: `m${seq}`, human: true });
        if (chance(rng, p.profile.playPerOpen)) fire({ type: 'PLAY', relationshipId: r.id, actorSide: i });
        if (chance(rng, p.profile.hugPerOpen)) fire({ type: 'HUG', relationshipId: r.id, actorSide: i });
        // Fin de session : le pet rentre parfois à la maison (multi-relations ailleurs). HYPOTHÈSE 30 %
        if (!pet.movedInRelationshipId && chance(rng, 0.3)) fire({ type: 'CALL_PET', petId: p.petId, to: { kind: 'HOME', contextId: p.petId }, purpose: 'HOME' });
      }
    }
    if (h % 24 === 23) {
      fire({ type: 'ADVANCE' });
      // Maladie mesurée sur les pets dont la personne joue encore (un compte parti n'est pas un échec d'équilibrage).
      for (const p of people) {
        if (p.churned) continue;
        sim.activePetHours += 24;
        if (displayGauges(world.pets[p.petId]!).health < t.poses.sickHealthBelow) {
          sim.sickHours += 24;
          sim.everSick = true;
        }
      }
    }
  }
  sim.churnedExit = people.some((p) => p.churned);
  return { rel: sim, spent };
}

export function simulate(opts: SimulationOptions): SimulationReport {
  const t0 = performance.now();
  const o: Required<SimulationOptions> = {
    tuning: DEFAULT_TUNING,
    startMs: daysFromCivil(2026, 11, 2) * DAY_MS + 7 * HOUR_MS, // lundi 2 novembre 2026, 8 h Paris
    tz: 'Europe/Paris',
    ...opts,
  };
  const t = o.tuning;
  const coinsByReason: Record<string, number> = {};
  const rels: RelSim[] = [];
  let spent = 0;
  for (let i = 0; i < o.relationships; i++) {
    const res = simulateOne(i, o, t, coinsByReason);
    rels.push(res.rel);
    spent += res.spent;
  }
  const levels = { N2: 2, N3: 3, N5: 5, N7: 7 } as const;
  const medianDaysToLevel = {} as SimulationReport['medianDaysToLevel'];
  const reachedShare = {} as SimulationReport['reachedShare'];
  for (const [k, l] of Object.entries(levels) as Array<[keyof typeof levels, number]>) {
    const ds = rels.map((r) => r.levelDays[l]).filter((d): d is number => d !== undefined);
    medianDaysToLevel[k] = round1(median(ds));
    reachedShare[k] = Math.round((ds.length / rels.length) * 1000) / 1000;
  }
  const n3by14 = (rs: RelSim[]): number => (rs.length ? rs.filter((r) => (r.levelDays[3] ?? Infinity) <= 14).length / rs.length : 0);
  const byProfile: SimulationReport['byProfile'] = {};
  for (const p of PROFILES) {
    // Profil de la relation = profil le moins engagé des deux (facteur limitant).
    const rank = (n: string) => PROFILES.findIndex((x) => x.name === n);
    const rs = rels.filter((r) => PROFILES[Math.max(rank(r.people[0].profile.name), rank(r.people[1].profile.name))]!.name === p.name);
    byProfile[p.name] = { relationships: rs.length, n3ByDay14Share: Math.round(n3by14(rs) * 1000) / 1000, medianDaysToN3: round1(median(rs.map((r) => r.levelDays[3]).filter((d): d is number => d !== undefined))) };
  }
  const created = Object.values(coinsByReason).reduce((a, b) => a + b, 0);
  return {
    tuningVersion: t.version,
    engineVersion: ENGINE_VERSION,
    seed: o.seed,
    relationships: o.relationships,
    days: o.days,
    medianDaysToLevel,
    reachedShare,
    n3ByDay14Share: Math.round(n3by14(rels) * 1000) / 1000,
    n3ByDay14Hypothesis: 0.2,
    byProfile,
    coins: { created, spent, createdPerPersonPerDay: Math.round((created / (rels.length * 2 * o.days)) * 100) / 100, byReason: coinsByReason },
    sickness: {
      relationshipsWithSickActivePetShare: Math.round((rels.filter((r) => r.everSick).length / rels.length) * 1000) / 1000,
      sickPetHoursShare: Math.round((rels.reduce((s, r) => s + r.sickHours, 0) / Math.max(1, rels.reduce((s, r) => s + r.activePetHours, 0))) * 10000) / 10000,
    },
    silentExitShare: Math.round((rels.filter((r) => r.silentExit).length / rels.length) * 1000) / 1000,
    elapsedMs: Math.round(performance.now() - t0),
  };
}
