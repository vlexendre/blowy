/** Lieu unique : comparaisons et présence au lieu attitré d'une relation. */
import type { VirtualLocationRef } from '@blowy/domain';
import type { PetState, RelationshipState, World } from '../model/index.js';
import type { Side } from '../shared/index.js';

export const sameLocation = (a: VirtualLocationRef, b: VirtualLocationRef): boolean => a.kind === b.kind && a.contextId === b.contextId;

export const homeOf = (pet: PetState): VirtualLocationRef => ({ kind: 'HOME', contextId: pet.id });

export function petOf(world: World, rel: RelationshipState, side: Side): PetState | undefined {
  return world.pets[rel.petIds[side]];
}

export function isPresent(world: World, rel: RelationshipState, side: Side): boolean {
  const pet = petOf(world, rel, side);
  return !!pet && sameLocation(pet.location, rel.spot);
}

export const bothPresent = (world: World, rel: RelationshipState): boolean => isPresent(world, rel, 0) && isPresent(world, rel, 1);

export function relationshipsAt(world: World, loc: VirtualLocationRef): RelationshipState[] {
  return Object.values(world.relationships).filter((r) => r.status !== 'ENDED' && sameLocation(r.spot, loc));
}

export function sideOf(rel: RelationshipState, petId: string): Side | null {
  return rel.petIds[0] === petId ? 0 : rel.petIds[1] === petId ? 1 : null;
}
