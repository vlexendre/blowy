/** Cadeau : N ≥ 2, objet réellement débité par le backend, complicité +10, 2 effets/jour. Aucun XP Lien (pas d'achat indirect). */
import { MEMORY_KEYS, addMemory, bumpScore, petOf, touchInteraction } from '../relationship/index.js';
import { otherSide } from '../shared/index.js';
import { defineHandler, reject } from './handler.js';
import { consumeCaps, requireCapability, liveRelationship, relDaily } from './guards.js';
import { ACTION_REACTIONS, react } from './reactions.js';

export const giftHandler = defineHandler('GIFT', (world, ev, ctx, out) => {
  const rel = liveRelationship(world, ev.relationshipId, out);
  if (!rel) return;
  if (!ev.itemDebited) return reject(out, 'ITEM_NOT_DEBITED');
  if (!requireCapability(world, rel, 'GIFT', ctx, out)) return;
  const g = ctx.tuning.actions.gift;
  const verdict = consumeCaps(relDaily(rel, ctx), 'giftAction', 'giftGain', g);
  if (verdict === 'REJECT') return reject(out, 'ACTION_CAP_REACHED');
  const receiver = petOf(world, rel, otherSide(ev.actorSide));
  if (receiver) react(receiver, ACTION_REACTIONS.GIFT, ctx, out);
  if (verdict === 'NO_GAIN') {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: 'GIFT', relationshipId: rel.id, petId: null });
    return;
  }
  rel.complicity = bumpScore(rel.complicity, g.complicity);
  rel.tension = bumpScore(rel.tension, g.tension);
  touchInteraction(rel, ctx.tuning);
  addMemory(rel, MEMORY_KEYS.GIFT, ctx.tuning, out);
});
