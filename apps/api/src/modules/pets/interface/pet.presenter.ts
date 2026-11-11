import type { Pet, PetEvent, PetView, PublicPet } from '@blowy/contract';
import { type Mood, formOf, traitsOf } from '@blowy/domain';
import type { PetViewResult } from '../application/get-pet-view.usecase';
import type { PetEventRecord, PetRecord } from '../ports';

/** Le pet doit déjà avoir son usure appliquée (`withDecay` ou `PetCharacter.load`). */
export const toPetDto = (pet: PetRecord): Pet => ({
  id: pet.id,
  name: pet.name,
  species: pet.species,
  gauges: pet.gauges,
  form: formOf(pet.gauges),
  traits: traitsOf(pet.gauges),
  bornAt: pet.createdAt,
});

export const toPublicPet = (pet: PetRecord, mood: Mood): PublicPet => ({ name: pet.name, species: pet.species, form: formOf(pet.gauges), mood });

const toEventDto = (e: PetEventRecord): PetEvent => ({ id: e.id, kind: e.kind, delta: e.delta, at: e.createdAt });

export const toPetView = (r: PetViewResult): PetView => ({
  pet: toPetDto(r.pet),
  events: r.events.map(toEventDto),
  challenge: { id: r.challenge.id, question: r.challenge.question, choices: r.challenge.choices.map((c) => c.label), doneToday: r.doneToday },
  wordsCount: r.wordsCount,
});
