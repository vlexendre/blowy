/**
 * Dispatcher pur : reduce(world, event, ctx) → { state, effects }.
 *  1. Idempotence locale : un eventId déjà vu ne change rien (la contrainte DB reste l'autorité).
 *  2. Avance du temps jusqu'à ctx.now (exacte, convergente).
 *  3. Délégation au handler enregistré pour event.type.
 */
import type { EngineContext, EngineEffect, EngineEvent, World } from './model/index.js';
import { HANDLERS, type ActionHandler } from './actions/index.js';
import { advanceWorldMut } from './world/advance.js';
import { cloneJson } from './shared/index.js';

export interface ReduceResult {
  state: World;
  effects: EngineEffect[];
}

const isDuplicate = (world: World, event: EngineEvent): boolean => world.recentEventIds.includes(event.eventId);

/** Variante en place (copie de travail possédée par l'appelant : transaction backend, simulateur). */
export function reduceMut(world: World, event: EngineEvent, ctx: EngineContext): EngineEffect[] {
  if (isDuplicate(world, event)) return [{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }];
  const effects: EngineEffect[] = [];
  advanceWorldMut(world, ctx.now, ctx, effects);
  const handler = HANDLERS[event.type] as ActionHandler<EngineEvent> | undefined;
  if (!handler) effects.push({ type: 'ACTION_REJECTED', reason: 'UNKNOWN_EVENT' });
  else handler.handle(world, event, ctx, effects);
  world.recentEventIds.push(event.eventId);
  if (world.recentEventIds.length > ctx.tuning.time.dedupeEventIds) world.recentEventIds.splice(0, world.recentEventIds.length - ctx.tuning.time.dedupeEventIds);
  return effects;
}

/** Réduction pure : l'état d'entrée n'est jamais muté. */
export function reduce(world: World, event: EngineEvent, ctx: EngineContext): ReduceResult {
  if (isDuplicate(world, event)) return { state: world, effects: [{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }] };
  const next = cloneJson(world);
  return { state: next, effects: reduceMut(next, event, ctx) };
}
