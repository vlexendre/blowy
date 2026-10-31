/**
 * @blowy/api-contract — contrats Zod partagés (REST /v1 + événements WS).
 * Propriété : core/* = orchestrateur ; un fichier par module, propriétaire nommé dans
 * docs/agents/work-plan.md. Les consommateurs n'inventent pas leurs DTO.
 */
export * from './core/errors.js';
export * from './core/common.js';
export * from './core/command.js';
export * from './core/ws.js';
