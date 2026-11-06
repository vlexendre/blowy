/**
 * @blowy/pet-engine — moteur pur, déterministe et rejouable.
 * Aucune horloge, aucun aléa global, aucune E/S : `now`, `seed`, `engineVersion`, `tuning` en contexte.
 *
 * V5 (D-021) : `reduceV5` & co. (`./v5`, aussi `@blowy/pet-engine/v5`). Le moteur V4 reste réexporté
 * ici pour compatibilité ; il est DÉPRÉCIÉ — les nouveaux imports passent par `@blowy/pet-engine/v4`.
 */
export * from './v4/api.js';
export * from './v5/index.js';
