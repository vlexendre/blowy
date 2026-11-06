/** Composition des sorties V5 (spec-v5 §4) : pure, déterministe, entiers. */
export * from './types.js';
export { acceptsSlot, composeOutings, composeSeedingOutings, compositionSeed, pairExclusion, priorityCompare, slotClassKey, teamPairs } from './compose.js';
export { backfillCandidate } from './backfill.js';
export { evaluateGroup, type GroupEvaluation } from './objective.js';
export { PairTable, duoLaneCompatible, groupPairScore, groupScoringTuning, romanceCompatible, type SeeksProfile } from './pairs.js';
