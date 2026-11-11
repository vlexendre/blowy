import { Inject, Injectable } from '@nestjs/common';
import { firstMessageOfDayLine, sweetReactionLine, teaseReactionLine } from '@blowy/content';
import { applyLinkEvent } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PetCharacter } from '../../pets/application/pet-character';
import type { LinkActionResult } from './link-action';
import { LinkSession } from './link-session';

export interface SendMessageInput {
  linkId: string;
  userId: string;
  body: string;
  tone?: 'sweet' | 'tease';
}

/** Messages par jour qui font bouger la jauge « bavard ». */
const TALK_EVENTS_PER_DAY = 10;
/** Mots doux / vannes par jour qui font bouger la jauge « tendre ». */
const TONE_EVENTS_PER_DAY = 5;

@Injectable()
export class SendMessage {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(PetCharacter) private readonly character: PetCharacter,
  ) {}

  async execute(input: SendMessageInput): Promise<LinkActionResult> {
    const { userId } = input;
    const draft = await this.session.open(input.linkId, userId);
    if (draft.link.status !== 'active') {
      await this.session.commit(draft);
      throw new DomainError('link_not_active', 'Ce lien dort. Ranime-le pour écrire à nouveau.');
    }
    const link = draft.link;
    const today = draft.today;
    // L'expérience par messages est plafonnée par jour : le compteur repart à 0 chaque jour.
    const firstToday = link.messageXpOn !== today;
    const xpToday = firstToday ? 0 : link.messageXp;
    const effect = applyLinkEvent(link, 'message', today, xpToday);
    draft.update({ ...effect.state, messageXpOn: today, messageXp: xpToday + (effect.state.xp - link.xp) });

    draft.user(userId, 'text', input.body);
    if (firstToday) draft.pet(userId, firstMessageOfDayLine(draft.pair(userId), draft.seed('first', userId)));
    const other = draft.otherOf(userId);
    if (input.tone === 'sweet') draft.pet(other, sweetReactionLine(draft.pair(other), draft.seed('sweet', String(link.messageXp))));
    if (input.tone === 'tease') draft.pet(other, teaseReactionLine(draft.pair(other), draft.seed('tease', String(link.messageXp))));
    if (effect.leveledUp) draft.announceLevel(effect.state.level, userId);
    const messages = await this.session.commit(draft);

    await this.character.apply(userId, 'message_sent', { maxPerDay: TALK_EVENTS_PER_DAY });
    if (input.tone) await this.character.apply(userId, input.tone === 'sweet' ? 'sweet_word' : 'tease', { maxPerDay: TONE_EVENTS_PER_DAY });
    return { link: draft.link, messages };
  }
}
