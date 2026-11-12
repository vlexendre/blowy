import type { Encounters } from '@blowy/contract';
import { toPerson } from '../../me/interface/person.presenter';
import { shapeOf } from '@blowy/domain';
import { moodForShape } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import type { Candidate, EncountersResult } from '../application/list-encounters.usecase';

/** Dans les rencontres, les visages sont toujours cachés ; l'humeur du pet suit sa forme. */
const person = (c: Candidate) => toPerson(c.profile, toPublicPet(c.pet, moodForShape(shapeOf(c.pet.needs))), 'hidden', null);

export const toEncountersDto = (r: EncountersResult): Encounters => ({
  incoming: r.incoming.map((i) => ({ id: i.encounter.id, from: person(i), compatibility: i.compatibility, intro: i.intro, at: i.encounter.createdAt })),
  suggestions: r.suggestions.map((s) => ({
    user: person(s),
    compatibility: s.compatibility,
    via: s.via,
    mutualName: s.mutualName,
    intro: s.intro,
    waved: s.waved,
  })),
  petShape: r.petShape,
});
