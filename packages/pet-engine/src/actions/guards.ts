/** Gardes partagées par les handlers (lookup + préconditions), écrites une seule fois. */
import type { EngineContext, EffectSink, PetState, RelDailyKey, RelationshipState, World } from '../model/index.js';
import { REL_DAILY_KEYS } from '../model/index.js';
import { capabilitiesFor } from '../progression/index.js';
import { bothPresent, isRelationshipPaused } from '../relationship/index.js';
import { localDayKey } from '../time/index.js';
import { rollDaily } from '../shared/index.js';
import { reject } from './handler.js';
import type { Capability } from '@blowy/domain';

export function liveRelationship(world: World, id: string, out: EffectSink): RelationshipState | null {
  const rel = world.relationships[id];
  if (!rel) return reject(out, 'NOT_FOUND'), null;
  if (rel.status === 'ENDED') return reject(out, 'RELATIONSHIP_INACTIVE'), null;
  return rel;
}

export function findPet(world: World, id: string, out: EffectSink): PetState | null {
  const pet = world.pets[id];
  if (!pet) reject(out, 'NOT_FOUND');
  return pet ?? null;
}

/** Vérifie une capacité actuelle ; motif de rejet exact (pause vs niveau/porte). */
export function requireCapability(world: World, rel: RelationshipState, cap: Capability, ctx: EngineContext, out: EffectSink): boolean {
  const paused = isRelationshipPaused(world, rel, ctx.now);
  if (capabilitiesFor(rel, { paused, tuning: ctx.tuning }).has(cap)) return true;
  const blockedByPause = paused && capabilitiesFor(rel, { paused: false, tuning: ctx.tuning }).has(cap);
  reject(out, blockedByPause ? 'RELATIONSHIP_PAUSED' : 'LEVEL_TOO_LOW');
  return false;
}

export function requireTogether(world: World, rel: RelationshipState, out: EffectSink): boolean {
  if (bothPresent(world, rel)) return true;
  reject(out, 'NOT_SAME_PLACE');
  return false;
}

/** Compteurs journaliers de la relation (jour local de relation). */
export function relDaily(rel: RelationshipState, ctx: EngineContext): Record<RelDailyKey, number> {
  rel.daily = rollDaily(rel.daily, localDayKey(ctx.now, rel.tz), REL_DAILY_KEYS);
  return rel.daily.counts;
}

/**
 * Double plafond : `actionKey` (bouton encore possible) et `gainKey` (gain rapporté).
 * Renvoie 'REJECT' si l'action elle-même est plafonnée, 'NO_GAIN' si seule l'animation est jouée.
 */
export function consumeCaps(
  counts: Record<RelDailyKey, number>,
  actionKey: RelDailyKey,
  gainKey: RelDailyKey,
  caps: { actionCapPerDay: number; gainCapPerDay: number },
): 'REJECT' | 'NO_GAIN' | 'GAIN' {
  if (counts[actionKey] >= caps.actionCapPerDay) return 'REJECT';
  counts[actionKey] += 1;
  if (counts[gainKey] >= caps.gainCapPerDay) return 'NO_GAIN';
  counts[gainKey] += 1;
  return 'GAIN';
}
