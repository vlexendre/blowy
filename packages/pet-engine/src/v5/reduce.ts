/**
 * reduceV5(state, event, {now, seed, engineVersion, tuning}) → {state, effects} : pur et déterministe.
 *  1. idempotence locale (eventId déjà vu) ; 2. cohérence du pet ; 3. handler du registre V5.
 * Aucune avance du temps : il n'y a plus de dynamique temporelle en V5.
 */
import { cloneJson } from '../shared/clone.js';
import { HANDLERS_V5, type ActionHandlerV5 } from './handlers.js';
import type { EffectV5, EngineContextV5, PetEventTypeV5, PetEventV5, PetStateV5, ReduceResultV5 } from './model.js';

/** Identifiants d'événements conservés (même valeur que le moteur V4, `time.dedupeEventIds`). */
const remember = (pet: PetStateV5, eventId: string, ctx: EngineContextV5): void => {
  pet.recentEventIds.push(eventId);
  const max = ctx.tuning.time.dedupeEventIds;
  if (pet.recentEventIds.length > max) pet.recentEventIds.splice(0, pet.recentEventIds.length - max);
};

/** Variante en place (copie de travail possédée par l'appelant). */
export function reduceV5Mut(pet: PetStateV5, event: PetEventV5, ctx: EngineContextV5): EffectV5[] {
  if (pet.recentEventIds.includes(event.eventId)) return [{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }];
  const out: EffectV5[] = [];
  if (event.petId !== pet.id) out.push({ type: 'ACTION_REJECTED', reason: 'PET_MISMATCH' });
  else {
    const handler = HANDLERS_V5[event.type as PetEventTypeV5] as ActionHandlerV5<PetEventTypeV5> | undefined;
    if (!handler) out.push({ type: 'ACTION_REJECTED', reason: 'UNKNOWN_EVENT' });
    else handler.handle(pet, event as never, ctx, out);
  }
  remember(pet, event.eventId, ctx);
  return out;
}

/** Réduction pure : l'état d'entrée n'est jamais muté. */
export function reduceV5(pet: PetStateV5, event: PetEventV5, ctx: EngineContextV5): ReduceResultV5 {
  if (pet.recentEventIds.includes(event.eventId)) return { state: pet, effects: [{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }] };
  const next = cloneJson(pet);
  return { state: next, effects: reduceV5Mut(next, event, ctx) };
}
