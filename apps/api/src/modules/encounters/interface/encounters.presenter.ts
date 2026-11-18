import { type Locale, visionText } from '@blowy/content';
import type { EncounterHistory, Encounters } from '@blowy/contract';
import { toPerson } from '../../me/interface/person.presenter';
import { shapeOf } from '@blowy/domain';
import { moodForShape } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import { toExplanation } from '../../vision/interface/vision.presenter';
import type { HistoryPage } from '../application/list-encounter-history.usecase';
import type { Candidate, EncountersResult } from '../application/list-encounters.usecase';

/** Dans les rencontres, les visages sont toujours cachés ; l'humeur du pet suit sa forme. */
const person = (c: Pick<Candidate, 'profile' | 'pet'>) => toPerson(c.profile, toPublicPet(c.pet, moodForShape(shapeOf(c.pet.needs))), 'hidden', null);

export const toEncountersDto = (r: EncountersResult, locale: Locale = 'fr'): Encounters => ({
  incoming: r.incoming.map((i) => ({
    id: i.encounter.id,
    from: person(i),
    compatibility: i.compatibility,
    explanation: i.explanation ? toExplanation(i.explanation, i.profile.displayName, locale) : null,
    intro: i.intro,
    at: i.encounter.createdAt,
  })),
  suggestions: r.suggestions.map((s) => ({
    user: person(s),
    compatibility: s.compatibility,
    explanation: toExplanation(s.explanation, s.profile.displayName, locale),
    via: s.via,
    mutualName: s.mutualName,
    intro: s.intro,
    waved: s.waved,
  })),
  petShape: r.petShape,
  far: r.far ? { count: r.far.count, strong: r.far.strong, label: visionText.in(locale).map.far(r.far.count, r.far.strong) } : null,
});

export const toEncounterHistoryDto = (page: HistoryPage): EncounterHistory => ({
  items: page.entries.map((e) => ({
    id: e.encounter.id,
    person: person(e),
    direction: e.direction,
    outcome: e.outcome,
    linkId: e.linkId,
    at: e.encounter.statusAt,
  })),
  nextBefore: page.nextBefore,
});
