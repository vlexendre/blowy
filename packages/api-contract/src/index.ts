/**
 * @blowy/api-contract — contrats Zod partagés (REST /v1 + événements WS).
 * Propriété : core/* = orchestrateur ; un fichier par module, propriétaire nommé dans
 * docs/agents/work-plan.md. Les consommateurs n'inventent pas leurs DTO.
 */
export * from './core/errors.js';
export * from './core/common.js';
export * from './core/command.js';
export * from './core/ws.js';
export * from './core/retired.js';
export * from './auth.js';
export * from './me.js';
export * from './consents.js';
export * from './pets.js';
export * from './matching.js';
export * from './relationships.js';
export * from './conversations.js';
export * from './economy.js';
export * from './media.js';
export * from './trust.js';
export * from './ai.js';
export * from './admin.js';
export * from './public.js';
export * from './referrals.js';
// V5 (spec-v5 §7) — publiés en T0, avant l'implémentation.
export * from './neighborhoods.js';
export * from './outings.js';
export * from './connections.js';
export * from './safety.js';
export * from './payments.js';
export * from './events-v5.js';
export * from './teams.js';
