import { Inject, Injectable } from '@nestjs/common';
import { duoPhotoLine, lifeGainedLine } from '@blowy/content';
import { applyLinkEvent } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import type { Storage } from '../../../integrations/storage/ports';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, DAILY_PHOTOS, IDS, PETS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetsRepository } from '../../pets/ports';
import type { DailyPhotosRepository } from '../ports';
import type { LinkActionResult } from './link-action';
import { LiveActivities } from '../../notifications/live-activities';
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
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LiveActivities) private readonly live: LiveActivities,
  ) {}

  async execute(linkId: string, userId: string, path: string): Promise<LinkActionResult> {
    const draft = await this.session.open(linkId, userId);
    const today = draft.today;
    if (draft.link.status !== 'active') {
      await this.session.commit(draft);
      throw new DomainError('link_not_active', errorText('linkSleepingPhoto'));
    }
    if (!photoPathPattern(linkId, userId, today).test(path)) throw new DomainError('invalid', errorText('photoWrongPath'));
    const sameDay = await this.photos.forDay(linkId, today);
    if (sameDay.some((p) => p.userId === userId)) throw new DomainError('already_done', errorText('photoAlreadySent'));
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', errorText('photoNotArrived'));

    const added = await this.photos.add({ id: this.ids.uuid(), linkId, userId, day: today, mediaPath: path, createdAt: this.clock.now().toISOString() });
    if (!added) throw new DomainError('already_done', errorText('photoAlreadySent'));

    draft.user(userId, 'photo', null, path);
    const solo = applyLinkEvent(draft.link, 'photo', today);
    let state = solo.state;
    let leveledUp = solo.leveledUp;
    const other = draft.otherOf(userId);
    if (sameDay.some((p) => p.userId === other)) {
      const duo = applyLinkEvent(state, 'duo_photo', today);
      state = duo.state;
      leveledUp ||= duo.leveledUp;
      draft.pet(other, duoPhotoLine(draft.localeOf(other), draft.pair(other), state.streak, draft.seed('duo')));
      if (duo.lifeGained) draft.pet(userId, lifeGainedLine(draft.localeOf(userId), draft.pair(userId), state.lives, draft.seed('life-gained')));
    }
    const streakBefore = draft.link.streak;
    draft.update(state);
    if (leveledUp) draft.announceLevel(state.level, userId);
    const messages = await this.session.commit(draft);
    // Meilleure série des deux pets : elle reste acquise même quand la série du lien retombe.
    if (state.streak > streakBefore) await this.pets.raiseBestStreak([draft.link.userA, draft.link.userB], state.streak);

    await this.character.apply(userId, 'photo_sent', { maxPerDay: PHOTO_EVENTS_PER_DAY });
    // Son activité « photo » de ce lien (démarrée quand l'autre a posté) : « Photo envoyée », puis retirée.
    await this.live.endPhoto(userId, linkId);
    // L'autre n'a pas encore posté : on le lui dit (« Léa a posté, à toi »), état prêt pour une activité en direct.
    if (!sameDay.some((p) => p.userId === other)) {
      const me = await this.profiles.findById(userId);
      await this.notifier.notify(other, 'daily_photo', { linkId, name: me?.displayName ?? '' });
    }
    return { link: draft.link, messages };
  }
}
