/**
 * Création et migration des pets vers V5 (spec-v5 §5.3) : stade conservé, `xpMilli` conservé,
 * aucun souvenir rétroactif sauf HATCHED (compté ici ; la ligne `PetMemory` est créée par le backend).
 * Les jauges, le lieu virtuel et les compteurs V4 sont abandonnés (colonnes mortes, §8.4).
 */
import type { Species, Stage } from '@blowy/domain';
import type { PetState } from '../model/index.js';
import type { PetStateV5 } from './model.js';

/** Pet V5 neuf, à l'éclosion de l'onboarding (souvenir HATCHED compté). */
export function createPetV5(id: string, species: Species): PetStateV5 {
  return { id, species, stage: 'BABY', xpMilli: 0, memoryCount: 1, memoriesByKind: { HATCHED: 1 }, attendedCount: 0, unlockedAccessories: [], equipped: [], reaction: null, recentEventIds: [] };
}

/** Sous-ensemble V4 utile à la migration (permet aussi une ligne DB sans `engineState`). */
export type MigratablePetV4 = Pick<PetState, 'id' | 'species' | 'stage' | 'xpMilli'>;

export function migratePetV4ToV5(pet: MigratablePetV4): PetStateV5 {
  return { ...createPetV5(pet.id, pet.species), stage: pet.stage as Stage, xpMilli: Math.max(0, Math.trunc(pet.xpMilli)) };
}
