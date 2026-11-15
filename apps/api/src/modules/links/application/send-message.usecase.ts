import { Inject, Injectable } from '@nestjs/common';
import { applyLinkEvent } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import { ChatMinimoas } from '../minimoas/chat-minimoas';
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
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
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
    // Les minimoas réagissent (règles tout de suite ; IA éventuelle après la réponse), dans leurs plafonds.
    const followUp = await this.minimoas.onUserMessage(draft, userId, input.body, { firstToday, tone: input.tone });
    if (effect.leveledUp) draft.announceLevel(effect.state.level, userId);
    const messages = await this.session.commit(draft);
    this.minimoas.later(followUp);

    await this.character.apply(userId, 'message_sent', { maxPerDay: TALK_EVENTS_PER_DAY });
    if (input.tone) await this.character.apply(userId, input.tone === 'sweet' ? 'sweet_word' : 'tease', { maxPerDay: TONE_EVENTS_PER_DAY });
    // Push : jamais le contenu du message, seulement le prénom (un envoi par lien toutes les 5 minutes au plus).
    const me = await this.profiles.findById(userId);
    await this.notifier.notify(draft.otherOf(userId), 'message', { linkId: link.id, name: me?.displayName ?? '' });
    return { link: draft.link, messages };
  }
}
