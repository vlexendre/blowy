import type { Pet, PetEvent, PetView, PublicPet, Wardrobe } from '@blowy/contract';
import { ITEMS, type Mood, formOf, itemProgress, shapeOf, traitsOf, wellbeing } from '@blowy/domain';
import type { WardrobeState } from '../application/wardrobe';
import type { PetViewResult } from '../application/get-pet-view.usecase';
import type { PetEventRecord, PetRecord } from '../ports';

/** Le pet doit être rattrapé à l'instant présent (`PetCharacter.load` ou `livePet`). */
export const toPetDto = (pet: PetRecord): Pet => ({
  id: pet.id,
  name: pet.name,
  species: pet.species,
  gauges: pet.gauges,
  form: formOf(pet.gauges),
  traits: traitsOf(pet.gauges),
  needs: pet.needs,
  wellbeing: wellbeing(pet.needs),
  shape: shapeOf(pet.needs),
  outfit: pet.outfit,
  bornAt: pet.createdAt,
});

export const toPublicPet = (pet: PetRecord, mood: Mood): PublicPet => ({
  name: pet.name,
  species: pet.species,
  form: formOf(pet.gauges),
  mood,
  outfit: pet.outfit,
});

const toEventDto = (e: PetEventRecord): PetEvent => ({ id: e.id, kind: e.kind, delta: e.delta, at: e.createdAt });

export const toPetView = (r: PetViewResult): PetView => ({
  pet: toPetDto(r.pet),
  events: r.events.map(toEventDto),
  challenge: { id: r.challenge.id, question: r.challenge.question, choices: r.challenge.choices.map((c) => c.label), doneToday: r.doneToday },
  wordsCount: r.wordsCount,
  careDays: r.pet.careDays,
  newItems: r.newItems,
});

/** Tout le catalogue, dans l'ordre : possédé, à gagner (avec l'étape) ou premium. */
export const toWardrobe = (w: WardrobeState): Wardrobe => ({
  items: ITEMS.map((item) => {
    const progress = itemProgress(item, w.stats);
    return {
      id: item.id,
      slot: item.slot,
      state: w.owned.has(item.id) ? 'owned' : item.unlock.kind === 'premium' ? 'premium' : 'locked',
      goal: item.unlock.kind === 'stat' && progress ? { stat: item.unlock.stat, ...progress } : null,
    };
  }),
  outfit: w.pet.outfit,
});
