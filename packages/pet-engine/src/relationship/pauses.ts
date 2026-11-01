/** Pauses effectives d'une relation : pauses de la relation ∪ pauses globales des deux côtés (§5.14). */
import type { RelationshipState, World } from '../model/index.js';
import { isInside, type Interval } from '../time/index.js';
import { petOf } from './location.js';

export function relationshipPauses(world: World, rel: RelationshipState): Interval[] {
  return [...rel.pauses, ...(petOf(world, rel, 0)?.pauses ?? []), ...(petOf(world, rel, 1)?.pauses ?? [])];
}

export const isRelationshipPaused = (world: World, rel: RelationshipState, atMs: number): boolean => isInside(atMs, relationshipPauses(world, rel));
