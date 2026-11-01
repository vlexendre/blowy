/**
 * Accumulateurs temporels d'une relation (ms admissibles = hors pauses effectives).
 * Chaque accumulateur décrit : s'il avance, ses seuils, et l'effet à leur franchissement.
 * Pattern Strategy : la liste ACCUMULATORS est parcourue par l'avanceur, aucun cas spécial.
 */
import { DAY_MS, HOUR_MS } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { EngineContext, EffectSink, RelationshipState, World } from '../model/index.js';
import { SIDES, otherSide, stepsReached, type Side } from '../shared/index.js';
import { adjustGauge } from '../gauges/index.js';
import { bumpScore, isPresent, petOf } from '../relationship/index.js';
import { localDayKey } from '../time/index.js';
import { rollDaily } from '../shared/index.js';
import { PET_DAILY_KEYS } from '../model/index.js';

export interface Accumulator {
  /** Avance-t-il (état constant pendant l'intervalle : les pets ne bougent pas seuls) ? */
  active(rel: RelationshipState, world: World): boolean;
  /** ms admissibles avant le prochain seuil (≥ 1), ou null. */
  untilNext(rel: RelationshipState, t: Tuning): number | null;
  add(rel: RelationshipState, dt: number): void;
  /** Applique les franchissements atteints à l'instant `atMs`. */
  fire(rel: RelationshipState, world: World, atMs: number, ctx: EngineContext, out: EffectSink): void;
}

const live = (rel: RelationshipState): boolean => rel.status === 'ACTIVE' || rel.status === 'MOVED_IN' || rel.status === 'LEGACY';
const remaining = (acc: number, threshold: number): number | null => (acc < threshold ? threshold - acc : null);
function minOf(values: ReadonlyArray<number | null>): number | null {
  let m: number | null = null;
  for (const v of values) if (v !== null && (m === null || v < m)) m = v;
  return m;
}

/** Pénalité d'humeur bornée par le plafond quotidien global du pet. */
function applyMoodPenalty(world: World, rel: RelationshipState, side: Side, atMs: number, ctx: EngineContext, out: EffectSink): void {
  const pet = petOf(world, rel, side);
  if (!pet) return;
  const t = ctx.tuning;
  pet.daily = rollDaily(pet.daily, localDayKey(atMs, pet.tz), PET_DAILY_KEYS);
  const allowed = Math.max(0, Math.min(t.actions.inactivity.moodPenalty, t.actions.inactivity.dailyMoodPenaltyCap - pet.daily.counts.moodPenalty));
  if (allowed > 0) {
    adjustGauge(pet, 'mood', -allowed, t);
    pet.daily.counts.moodPenalty += allowed;
  }
  out.push({ type: 'MOOD_PENALTY', petId: pet.id, points: allowed, atMs, cappedFrom: t.actions.inactivity.moodPenalty });
}

/** Inactivité (franchissement unique à 48 h) + absence (paliers quotidiens après 24 h) : même compteur `idleMs`. */
const inactivity: Accumulator = {
  active: (rel) => live(rel),
  untilNext: (rel, t) => {
    const a = t.actions.absence;
    const c = [remaining(rel.idleMs, a.graceHours * HOUR_MS + rel.absenceStepsApplied * DAY_MS), rel.inactivityCrossed ? null : remaining(rel.idleMs, t.actions.inactivity.thresholdHours * HOUR_MS)];
    return minOf(c);
  },
  add: (rel, dt) => {
    rel.idleMs += dt;
  },
  fire: (rel, world, atMs, ctx, out) => {
    const t = ctx.tuning;
    const a = t.actions.absence;
    const reached = stepsReached(rel.idleMs, a.graceHours * HOUR_MS, DAY_MS);
    for (; rel.absenceStepsApplied < reached; rel.absenceStepsApplied++) {
      rel.complicity = bumpScore(rel.complicity, a.complicityPerDay);
      rel.tension = bumpScore(rel.tension, a.tensionPerDay);
      out.push({ type: 'ABSENCE_DAY', relationshipId: rel.id, atMs });
    }
    if (!rel.inactivityCrossed && rel.idleMs >= t.actions.inactivity.thresholdHours * HOUR_MS) {
      rel.inactivityCrossed = true; // un seul événement par épisode, jamais répété par tick
      out.push({ type: 'INACTIVITY_THRESHOLD_CROSSED', relationshipId: rel.id, atMs });
      for (const s of SIDES) applyMoodPenalty(world, rel, s, atMs, ctx, out);
    }
  },
};

const silence: Accumulator = {
  active: (rel) => live(rel) && !rel.silenceClosed,
  untilNext: (rel, t) => (rel.silenceClosed ? null : remaining(rel.silenceMs, t.reliability.silenceCloseDays * DAY_MS)),
  add: (rel, dt) => {
    rel.silenceMs += dt;
  },
  fire: (rel, _world, atMs, ctx, out) => {
    if (rel.silenceClosed || rel.silenceMs < ctx.tuning.reliability.silenceCloseDays * DAY_MS) return;
    rel.silenceClosed = true;
    out.push({ type: 'RELATIONSHIP_SILENCE_CLOSE', relationshipId: rel.id, atMs });
  },
};

function waitingFor(side: Side): Accumulator {
  const waits = (rel: RelationshipState, world: World): boolean => live(rel) && isPresent(world, rel, side) && !isPresent(world, rel, otherSide(side));
  return {
    active: waits,
    untilNext: (rel, t) => {
      const s = rel.sides[side];
      const w = t.actions.waiting;
      return minOf([!s.waitingNotified ? remaining(s.waitingMs, w.notifyAfterHours * HOUR_MS) : null, !s.waitingTensionApplied ? remaining(s.waitingMs, w.tensionAfterHours * HOUR_MS) : null]);
    },
    add: (rel, dt) => {
      rel.sides[side].waitingMs += dt;
    },
    fire: (rel, world, atMs, ctx, out) => {
      const s = rel.sides[side];
      const w = ctx.tuning.actions.waiting;
      if (!s.waitingNotified && s.waitingMs >= w.notifyAfterHours * HOUR_MS) {
        s.waitingNotified = true;
        // « X attend Y » : X réellement présent, Y absent (condition de `active`).
        if (waits(rel, world))
          out.push({ type: 'NOTIFY', category: 'REAL_WAITING', template: 'notif.waiting', key: `waiting:${rel.id}:${side}`, atMs, relationshipId: rel.id, petId: rel.petIds[side] });
      }
      if (!s.waitingTensionApplied && s.waitingMs >= w.tensionAfterHours * HOUR_MS) {
        s.waitingTensionApplied = true;
        rel.tension = bumpScore(rel.tension, w.tensionIncrease);
      }
    },
  };
}

function replyDebtFor(side: Side): Accumulator {
  return {
    active: (rel) => live(rel) && rel.sides[side].replyDebtMs !== null,
    untilNext: (rel, t) => {
      const s = rel.sides[side];
      return s.replyDebtMs === null || s.ghostPenalized ? null : remaining(s.replyDebtMs, t.reliability.ghostingAfterHours * HOUR_MS);
    },
    add: (rel, dt) => {
      const s = rel.sides[side];
      if (s.replyDebtMs !== null) s.replyDebtMs += dt;
    },
    fire: (rel, _world, atMs, ctx, out) => {
      const s = rel.sides[side];
      if (s.replyDebtMs === null || s.ghostPenalized || s.replyDebtMs < ctx.tuning.reliability.ghostingAfterHours * HOUR_MS) return;
      s.ghostPenalized = true; // une seule pénalité par épisode
      out.push({ type: 'RELIABILITY_PENALTY', relationshipId: rel.id, side, points: ctx.tuning.reliability.ghostingPenalty, atMs });
    },
  };
}

export const ACCUMULATORS: readonly Accumulator[] = [inactivity, silence, waitingFor(0), waitingFor(1), replyDebtFor(0), replyDebtFor(1)];

