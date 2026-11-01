/**
 * @blowy/pet-engine — moteur pur, déterministe et rejouable.
 * Aucune horloge, aucun aléa global, aucune E/S : `now`, `seed`, `engineVersion`, `tuning` en contexte.
 */
export * from './model/index.js';
export { reduce, reduceMut, type ReduceResult } from './reduce.js';
export { advanceTime, advanceWorld, coalesceNotifications } from './world/index.js';
export { poseFor, displayGauges, isSick, needsVitalHelp, gaugeRates, integrateGauges } from './gauges/index.js';
export { resolveCall, refusalProbability, rngFrom, pickIndex, type Rng, type CallDecision, type CallDecisionInput, type RefusalInput } from './random/index.js';
export {
  balanceFactorPermille,
  kPermilleFor,
  contributionTotals,
  affinityMultiplierPermille,
  linkGainMilli,
  quoteLinkGain,
  linkFreezeReason,
  sameLocation,
  relationshipPauses,
  type LinkGainQuote,
} from './relationship/index.js';
export { eligibleLevel, reachableLevel, gateOpen, capabilitiesFor, canTransferToNeighborhood, CAPABILITY_RULES, stageFor, type CapabilityInput } from './progression/index.js';
export { inherit, composeBabyName, completedNights, type HeredityInput, type HeredityResult } from './egg/index.js';
export { groupCohesion, groupGainsActive, groupMissionValid, type GroupEdge } from './group/index.js';
export { planNotifications, type NotificationCandidate, type NotificationPlan } from './notify/index.js';
export { createPet, createRelationship, createEgg, defaultGates, emptyWorld } from './factory.js';
export { localDayKey, isLocalWeekend, splitDayNight, wallToUtc, localParts, offsetAt, type Interval } from './time/index.js';
export { GAUGE_UNIT, pointsToUnits, unitsToPoints, type Side, type PerSide } from './shared/index.js';

import { linkGainMilli, quoteLinkGain } from './relationship/index.js';
/** Alias attendu par le plan de travail : gain du Lien en milli-points (base·k·m). */
export const computeLinkGain = linkGainMilli;
export const quoteLinkGainFor = quoteLinkGain;
