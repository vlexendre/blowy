/**
 * @blowy/pet-engine/v5 — moteur pet V5 (souvenirs, accessoires) et calendrier des sorties.
 * Pur : `now`, `seed`, `engineVersion`, `tuning` en contexte ; aucune horloge, aucun aléa.
 */
export * from './model.js';
export { reduceV5, reduceV5Mut } from './reduce.js';
export { HANDLERS_V5, type ActionHandlerV5, type HandlerRegistryV5 } from './handlers.js';
export { poseForV5 } from './pose.js';
export { stageForXpV5, nextStageProgress } from './progress.js';
export { createPetV5, migratePetV4ToV5, type MigratablePetV4 } from './migrate.js';
export * from './calendar.js';
