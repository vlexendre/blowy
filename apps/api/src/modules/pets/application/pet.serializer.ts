/** Sérialiseurs explicites : PublicPetProfile (tiers) et OwnPetView (propriétaire). */
import type { OwnPetView, PublicPetProfile } from '@blowy/api-contract';
import type { PetPose } from '@blowy/domain';
import { storedToVision } from '../domain/pet.js';
import type { PetAggregate } from './ports/pet.repository.js';

export function toPublicPetProfile(p: Pick<PetAggregate, 'id' | 'name' | 'species' | 'stage' | 'vision'>, pose: PetPose): PublicPetProfile {
  return { id: p.id, name: p.name, species: p.species, stage: p.stage, vision: p.vision ? storedToVision(p.vision) : null, pose };
}

export function toOwnPetView(p: PetAggregate, pose: PetPose): OwnPetView {
  const g = p.snapshot.gauges;
  const r = (x: number) => Math.round(x * 10) / 10;
  return {
    ...toPublicPetProfile(p, pose),
    kind: p.kind,
    gauges: { satiety: r(g.satiety), energy: r(g.energy), mood: r(g.mood), health: r(g.health) },
    petXp: Math.floor(p.snapshot.petXpMilli / 1000),
    location: { kind: p.location.kind, relationshipId: p.location.contextId, since: p.location.since.toISOString() },
    stateAsOf: p.snapshot.asOf.toISOString(),
    version: p.version,
    engineVersion: p.snapshot.engineVersion,
  };
}
