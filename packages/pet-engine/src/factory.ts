/** Fabriques d'états initiaux (profil versionné lu du tuning). */
import type { Species, VirtualLocationRef, VisionAxes, PetKind } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { GAUGE_KEYS, PET_DAILY_KEYS, REL_DAILY_KEYS, type EggState, type PetState, type ProgressionGates, type RelationshipState, type SideState, type World } from './model/index.js';
import { SCORE_MAX, clamp, emptyDaily, pointsToUnits, perSide, type PerSide } from './shared/index.js';
import { localDayKey } from './time/index.js';

export function createPet(p: { id: string; species: Species; axes: VisionAxes; tz: string; nowMs: number; kind?: PetKind }, t: Tuning): PetState {
  const gauges = {} as PetState['gauges'];
  for (const k of GAUGE_KEYS) gauges[k] = pointsToUnits(t.gauges.initial[k]);
  return {
    id: p.id,
    kind: p.kind ?? 'PRIMARY',
    species: p.species,
    axes: { ...p.axes },
    tz: p.tz,
    stage: 'BABY',
    gauges,
    starvedMs: 0,
    xpMilli: 0,
    location: { kind: 'HOME', contextId: p.id },
    reaction: null,
    consecutiveRefusals: 0,
    callCount: 0,
    movedInRelationshipId: null,
    pauses: [],
    daily: emptyDaily(localDayKey(p.nowMs, p.tz), PET_DAILY_KEYS),
    advancedToMs: p.nowMs,
  };
}

export const defaultGates = (): ProgressionGates => ({
  moveInAccepted: false,
  branch: 'UNDECIDED',
  plusRevealAccepted: false,
  irlDateConfirmed: false,
  eggAccepted: false,
  photoPreference: ['FROM_LEVEL_4_WITH_CONSENT', 'FROM_LEVEL_4_WITH_CONSENT'],
  photoConsent: [false, false],
  photoOriginalConsent: [false, false],
  transferToNeighborhoodAccepted: false,
});

const newSide = (t: Tuning): SideState => ({
  desire: t.relationshipInitial.desire,
  waitingMs: 0,
  waitingNotified: false,
  waitingTensionApplied: false,
  contributions: {},
  replyDebtMs: null,
  ghostPenalized: false,
  recoveryDayKey: null,
});

export function createRelationship(
  r: { id: string; petIds: PerSide<string>; tz: string; affinity: number; nowMs: number; spot?: VirtualLocationRef; context?: RelationshipState['context'] },
  t: Tuning,
): RelationshipState {
  const petIds: PerSide<string> = r.petIds[0] <= r.petIds[1] ? [r.petIds[0], r.petIds[1]] : [r.petIds[1], r.petIds[0]];
  return {
    id: r.id,
    context: r.context ?? 'DATE',
    petIds,
    tz: r.tz,
    status: 'ACTIVE',
    affinity: clamp(Math.round(r.affinity), 0, SCORE_MAX),
    xpMilli: 0,
    reachedLevel: 1,
    gates: defaultGates(),
    complicity: t.relationshipInitial.complicity,
    tension: t.relationshipInitial.tension,
    spot: r.spot ?? { kind: 'DATE_SPOT', contextId: r.id },
    sides: perSide(() => newSide(t)),
    idleMs: 0,
    inactivityCrossed: false,
    absenceStepsApplied: 0,
    silenceMs: 0,
    silenceClosed: false,
    messageTurn: null,
    daily: emptyDaily(localDayKey(r.nowMs, r.tz), REL_DAILY_KEYS),
    missionContexts: {},
    memories: [],
    pauses: [],
    advancedToMs: r.nowMs,
  };
}

export function createEgg(e: { id: string; relationshipId: string; tz: string }): EggState {
  return { id: e.id, relationshipId: e.relationshipId, tz: e.tz, status: 'INCUBATING', heat: 0, sessions: [], taps: [null, null], nameVotes: [null, null], babyName: null, hatchedAtMs: null };
}

export const emptyWorld = (): World => ({ pets: {}, relationships: {}, neighborhood: {}, eggs: {}, recentEventIds: [] });
