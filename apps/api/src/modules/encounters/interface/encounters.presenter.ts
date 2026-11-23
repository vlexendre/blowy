import { blockedMessage } from '../application/wave-guard';
import { type Locale, visionText } from '@blowy/content';
import type { EncounterHistory, Encounters } from '@blowy/contract';
import { type BlurredFaces, NO_BLURRED_FACES, faceOf } from '../../me/application/avatar-blurs';
import { toPerson } from '../../me/interface/person.presenter';
import { shapeOf } from '@blowy/domain';
import { moodForShape } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import { toExplanation } from '../../vision/interface/vision.presenter';
import type { HistoryPage } from '../application/list-encounter-history.usecase';
import type { Candidate, EncountersResult } from '../application/list-encounters.usecase';

/**
 * Dans les rencontres, jamais la photo d'origine (décision 7) : la vignette très floue du serveur si elle existe
 * (`faces`, signées par `AvatarBlurs`), sinon le minimoa. L'humeur du pet suit sa forme.
 */
const person = (c: Pick<Candidate, 'profile' | 'pet'>, faces: BlurredFaces) => {
  const { face, avatarUrl } = faceOf(faces, c.profile.id);
  return toPerson(c.profile, toPublicPet(c.pet, moodForShape(shapeOf(c.pet.needs))), face, avatarUrl);
};

/** Les profils dont les rencontres montrent le visage (pour signer leurs vignettes floues en un appel). */
export const encounterProfiles = (r: Pick<EncountersResult, 'incoming' | 'suggestions'>) => [...r.incoming.map((i) => i.profile), ...r.suggestions.map((s) => s.profile)];

export const toEncountersDto = (r: EncountersResult, locale: Locale = 'fr', faces: BlurredFaces = NO_BLURRED_FACES): Encounters => ({
  incoming: r.incoming.map((i) => ({
    id: i.encounter.id,
    from: person(i, faces),
    compatibility: i.compatibility,
    explanation: i.explanation ? toExplanation(i.explanation, i.profile.displayName, locale) : null,
    intro: i.intro,
    at: i.encounter.createdAt,
  })),
  suggestions: r.suggestions.map((s) => ({
    user: person(s, faces),
    compatibility: s.compatibility,
    explanation: toExplanation(s.explanation, s.profile.displayName, locale),
    via: s.via,
    mutualName: s.mutualName,
    intro: s.intro,
    waved: s.waved,
  })),
  petShape: r.petShape,
  waves: { left: r.waves.left, blocked: r.waves.blocked, message: blockedMessage(r.waves.blocked, locale) },
  far: r.far ? { count: r.far.count, strong: r.far.strong, label: visionText.in(locale).map.far(r.far.count, r.far.strong) } : null,
});

/** Historique : même règle (flou ou minimoa), y compris pour un lien noué depuis ; la photo nette se voit dans le lien. */
export const toEncounterHistoryDto = (page: HistoryPage, faces: BlurredFaces = NO_BLURRED_FACES): EncounterHistory => ({
  items: page.entries.map((e) => ({
    id: e.encounter.id,
    person: person(e, faces),
    direction: e.direction,
    outcome: e.outcome,
    linkId: e.linkId,
    at: e.encounter.statusAt,
  })),
  nextBefore: page.nextBefore,
});
