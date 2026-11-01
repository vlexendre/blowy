/** Cycle de vie : portes de consentement, pauses (≤ 14 j), emménagement, fin de relation. */
import { DAY_MS } from '@blowy/domain';
import { updateProgression } from '../progression/index.js';
import { homeOf, petOf } from '../relationship/index.js';
import { SIDES } from '../shared/index.js';
import { defineHandler, reject } from './handler.js';
import { findPet, liveRelationship } from './guards.js';

export const gatesHandler = defineHandler('GATES_UPDATED', (world, ev, ctx, out) => {
  const rel = liveRelationship(world, ev.relationshipId, out);
  if (!rel) return;
  rel.gates = { ...rel.gates, ...ev.gates };
  // Les portes peuvent débloquer un niveau dont l'XP était déjà accumulée.
  updateProgression(rel, ctx.tuning, out, rel.xpMilli);
});

export const pauseHandler = defineHandler('PAUSE_SET', (world, ev, ctx, out) => {
  if (ev.interval.endMs - ev.interval.startMs > ctx.tuning.pause.maxDays * DAY_MS) return reject(out, 'PAUSE_TOO_LONG');
  const target = ev.scope === 'PET' ? findPet(world, ev.targetId, out) : liveRelationship(world, ev.targetId, out);
  if (!target) return;
  // Pas de rattrapage punitif : le temps est simplement exclu des intégrations.
  target.pauses.push({ ...ev.interval });
});

export const moveInHandler = defineHandler('MOVE_IN', (world, ev, ctx, out) => {
  const rel = liveRelationship(world, ev.relationshipId, out);
  if (!rel) return;
  if (!rel.gates.moveInAccepted) return reject(out, 'LEVEL_TOO_LOW');
  rel.status = 'MOVED_IN';
  rel.spot = { kind: 'SHARED_HOME', contextId: rel.id };
  // Seul un emménagement accepté par les deux autorise le déplacement conjoint.
  for (const s of SIDES) {
    const pet = petOf(world, rel, s);
    if (!pet) continue;
    const from = pet.location;
    pet.location = { ...rel.spot };
    pet.movedInRelationshipId = rel.id;
    out.push({ type: 'PET_MOVED', petId: pet.id, from, to: pet.location });
  }
  updateProgression(rel, ctx.tuning, out, rel.xpMilli);
});

export const endHandler = defineHandler('RELATIONSHIP_ENDED', (world, ev, _ctx, out) => {
  const rel = world.relationships[ev.relationshipId];
  if (!rel) return reject(out, 'NOT_FOUND');
  rel.status = 'ENDED';
  for (const side of rel.sides) side.replyDebtMs = null; // sécurité/blocage annulent la dette
  // Le pet rentre à son lieu autorisé, sans perte de tenue ni d'XP personnelle.
  for (const s of SIDES) {
    const pet = petOf(world, rel, s);
    if (!pet) continue;
    if (pet.movedInRelationshipId === rel.id) pet.movedInRelationshipId = null;
    if (pet.location.contextId === rel.id) {
      const from = pet.location;
      pet.location = homeOf(pet);
      out.push({ type: 'PET_MOVED', petId: pet.id, from, to: pet.location });
    }
  }
});
