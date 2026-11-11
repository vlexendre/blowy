import { Inject, Injectable } from '@nestjs/common';
import { duoPhotoLine, lifeGainedLine } from '@blowy/content';
import { applyLinkEvent } from '@blowy/domain';
import type { Storage } from '../../../integrations/storage/ports';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, DAILY_PHOTOS, IDS, STORAGE } from '../../../shared/tokens';
import { PetCharacter } from '../../pets/application/pet-character';
import type { DailyPhotosRepository } from '../ports';
import type { LinkActionResult } from './link-action';
import { LinkSession } from './link-session';
import { photoPathPattern } from './photo-ticket.usecase';

const PHOTO_EVENTS_PER_DAY = 3;

/**
 * Photo du jour : une par personne et par jour dans un lien. Quand la deuxième arrive,
 * le lien gagne une vie et sa série avance (`duo_photo`).
 */
@Injectable()
export class SendPhoto {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(DAILY_PHOTOS) private readonly photos: DailyPhotosRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async execute(linkId: string, userId: string, path: string): Promise<LinkActionResult> {
    const draft = await this.session.open(linkId, userId);
    const today = draft.today;
    if (draft.link.status !== 'active') {
      await this.session.commit(draft);
      throw new DomainError('link_not_active', 'Ce lien dort. Ranime-le pour envoyer ta photo.');
    }
    if (!photoPathPattern(linkId, userId, today).test(path)) throw new DomainError('invalid', 'Cette photo ne correspond pas à ton envoi du jour.');
    const sameDay = await this.photos.forDay(linkId, today);
    if (sameDay.some((p) => p.userId === userId)) throw new DomainError('already_done', 'Tu as déjà envoyé ta photo du jour ici.');
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', 'La photo n’est pas encore arrivée. Réessaie.');

    const added = await this.photos.add({ id: this.ids.uuid(), linkId, userId, day: today, mediaPath: path, createdAt: this.clock.now().toISOString() });
    if (!added) throw new DomainError('already_done', 'Tu as déjà envoyé ta photo du jour ici.');

    draft.user(userId, 'photo', null, path);
    const solo = applyLinkEvent(draft.link, 'photo', today);
    let state = solo.state;
    let leveledUp = solo.leveledUp;
    const other = draft.otherOf(userId);
    if (sameDay.some((p) => p.userId === other)) {
      const duo = applyLinkEvent(state, 'duo_photo', today);
      state = duo.state;
      leveledUp ||= duo.leveledUp;
      draft.pet(other, duoPhotoLine(draft.pair(other), state.streak, draft.seed('duo')));
      if (duo.lifeGained) draft.pet(userId, lifeGainedLine(draft.pair(userId), state.lives, draft.seed('life-gained')));
    }
    draft.update(state);
    if (leveledUp) draft.announceLevel(state.level, userId);
    const messages = await this.session.commit(draft);

    await this.character.apply(userId, 'photo_sent', { maxPerDay: PHOTO_EVENTS_PER_DAY });
    return { link: draft.link, messages };
  }
}
