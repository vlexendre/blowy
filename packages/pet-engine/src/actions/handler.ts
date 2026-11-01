/**
 * Pattern Command/Strategy : un handler par type d'événement, enregistré dans une table.
 * Un handler mute la copie de travail du monde (déjà avancée à `ctx.now`) et pousse ses effets.
 */
import type { EngineContext, EffectSink, EngineEvent, EngineEventType, EventOf, RejectReason, World } from '../model/index.js';

export interface ActionHandler<E extends EngineEvent> {
  readonly type: EngineEventType;
  handle(world: World, event: E, ctx: EngineContext, out: EffectSink): void;
}

export type HandlerRegistry = { [T in EngineEventType]?: ActionHandler<EventOf<T>> };

export function defineHandler<T extends EngineEventType>(type: T, handle: ActionHandler<EventOf<T>>['handle']): ActionHandler<EventOf<T>> {
  return { type, handle };
}

/** Rejet explicite (aucune mutation). */
export const reject = (out: EffectSink, reason: RejectReason): void => {
  out.push({ type: 'ACTION_REJECTED', reason });
};
