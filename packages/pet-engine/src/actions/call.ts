/** Appeler son pet : déplacement ou refus seedé (jamais deux refus de suite, jamais une aide vitale). */
import { HOUR_MS } from '@blowy/domain';
import type { EngineContext, EffectSink, PetState, RelationshipState, World } from '../model/index.js';
import { needsVitalHelp } from '../gauges/index.js';
import { resolveCall } from '../random/index.js';
import { bumpScore, grantLinkXp, homeOf, isPresent, relationshipsAt, sameLocation, sideOf } from '../relationship/index.js';
import { otherSide } from '../shared/index.js';
import { defineHandler, reject } from './handler.js';
import { findPet } from './guards.js';
import { ACTION_REACTIONS, react } from './reactions.js';

/** Relation au lieu actuel du pet où l'autre pet est présent (source de l'envie V). */
function companionRelation(world: World, pet: PetState): RelationshipState | undefined {
  return relationshipsAt(world, pet.location).find((r) => {
    const s = sideOf(r, pet.id);
    return s !== null && isPresent(world, r, otherSide(s));
  });
}

const desireTowards = (rel: RelationshipState | undefined, petId: string): number => {
  const s = rel ? sideOf(rel, petId) : null;
  return rel && s !== null ? rel.sides[s].desire : 0;
};

const waitingHoursOfOther = (rel: RelationshipState | undefined, petId: string): number => {
  const s = rel ? sideOf(rel, petId) : null;
  return rel && s !== null ? rel.sides[otherSide(s)].waitingMs / HOUR_MS : 0;
};

/**
 * Arrivée au lieu d'une relation. Visite : +3 XP seulement si l'autre, présent, a accumulé une
 * NOUVELLE attente admissible > 6 h (ms serveur hors pauses ; consommée ici → pas de farming
 * par aller-retour ni par changement d'horloge client).
 */
function arrive(world: World, rel: RelationshipState, pet: PetState, ctx: EngineContext, out: EffectSink): void {
  const s = sideOf(rel, pet.id);
  if (s === null) return;
  const other = rel.sides[otherSide(s)];
  const qualifies = isPresent(world, rel, otherSide(s)) && other.waitingMs > ctx.tuning.actions.visit.minWaitingHours * HOUR_MS;
  for (const side of rel.sides) {
    side.waitingMs = 0;
    side.waitingNotified = false;
    side.waitingTensionApplied = false;
  }
  if (!qualifies) return;
  react(pet, ACTION_REACTIONS.REUNION, ctx, out);
  grantLinkXp(world, rel, 'VISIT', ctx.tuning.actions.visit.linkXp, ctx, out);
}

const MOVED_IN_ALLOWED = new Set(['SHARED_HOME', 'FRIEND_HOME']);

export const callHandler = defineHandler('CALL_PET', (world, ev, ctx, out) => {
  const t = ctx.tuning;
  const pet = findPet(world, ev.petId, out);
  if (!pet) return;
  const destination = ev.purpose === 'HOME' ? homeOf(pet) : ev.to;
  if (sameLocation(pet.location, destination)) return reject(out, 'ALREADY_AT_LOCATION');
  if (pet.movedInRelationshipId && !MOVED_IN_ALLOWED.has(destination.kind) && ev.purpose !== 'CARE') return reject(out, 'MOVED_IN_LOCKED');

  const toRel = relationshipsAt(world, destination).find((r) => sideOf(r, pet.id) !== null);
  const decision = resolveCall(
    {
      species: pet.species,
      kindMischief: pet.axes.kindMischief,
      desire: desireTowards(companionRelation(world, pet), pet.id),
      waitingHours: waitingHoursOfOther(toRel, pet.id),
      consecutiveRefusals: pet.consecutiveRefusals,
      vital: ev.purpose === 'CARE' || needsVitalHelp(pet, t),
      seed: ctx.seed,
      petId: pet.id,
      callIndex: pet.callCount,
    },
    t,
  );
  pet.callCount += 1;
  out.push({ type: 'CALL_RESOLVED', petId: pet.id, refused: decision.refused, probability: decision.probability, forcedAccept: decision.forcedAccept });

  if (decision.refused) {
    pet.consecutiveRefusals += 1;
    if (toRel) toRel.tension = bumpScore(toRel.tension, t.refusal.tensionOnRefusal);
    react(pet, ACTION_REACTIONS.REFUSAL, ctx, out);
    return;
  }
  pet.consecutiveRefusals = 0;
  const from = pet.location;
  pet.location = { ...destination };
  out.push({ type: 'PET_MOVED', petId: pet.id, from, to: pet.location });
  if (toRel) arrive(world, toRel, pet, ctx, out);
});
