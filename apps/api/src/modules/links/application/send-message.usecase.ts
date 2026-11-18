import { Inject, Injectable } from '@nestjs/common';
import { lifeGainedLine, streakMilestoneLine } from '@blowy/content';
import { LINK_STREAK_MILESTONES, applyLinkMessage } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import { DomainError, errorText } from '../../../shared/errors';
import { PETS, PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { LiveActivities } from '../../notifications/live-activities';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetsRepository } from '../../pets/ports';
import { ChatMinimoas } from '../minimoas/chat-minimoas';
import { sideOf } from '../ports';
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
/** Jours « à deux » par jour (tous liens confondus) qui font bouger le caractère et la sociabilité. */
const TOGETHER_EVENTS_PER_DAY = 3;

/**
 * Un message d'une personne. La série du lien vit avec la conversation (spéc §24) : le premier message du deuxième à
 * écrire dans la journée en fait un jour « à deux » (série +1, une vie rendue s'il en manque, un palier fêté par les
 * minimoas).
 */
@Injectable()
export class SendMessage {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LiveActivities) private readonly live: LiveActivities,
  ) {}

  async execute(input: SendMessageInput): Promise<LinkActionResult> {
    const { userId } = input;
    const draft = await this.session.open(input.linkId, userId);
    if (draft.link.status !== 'active') {
      await this.session.commit(draft);
      throw new DomainError('link_not_active', errorText('linkSleepingWrite'));
    }
    const link = draft.link;
    const today = draft.today;
    // L'expérience par messages est plafonnée par jour : le compteur repart à 0 chaque jour.
    const firstInLinkToday = link.messageXpOn !== today;
    const xpToday = firstInLinkToday ? 0 : link.messageXp;
    const effect = applyLinkMessage(link, sideOf(link, userId), today, xpToday);
    draft.update({ ...effect.state, messageXpOn: today, messageXp: xpToday + effect.messageXp });

    draft.user(userId, 'text', input.body);
    const other = draft.otherOf(userId);
    if (effect.duoDay) {
      const streak = effect.state.streak;
      // Un palier de série (3, 7, 14…) : le minimoa de l'autre le remarque. Les autres jours, le chiffre parle seul.
      if ((LINK_STREAK_MILESTONES as readonly number[]).includes(streak)) {
        draft.pet(other, streakMilestoneLine(draft.localeOf(other), draft.pair(other), streak, draft.seed('streak', String(streak))));
      }
      if (effect.lifeGained) draft.pet(userId, lifeGainedLine(draft.localeOf(userId), draft.pair(userId), effect.state.lives, draft.seed('life-gained')));
    }
    // Les minimoas réagissent (règles tout de suite ; IA éventuelle après la réponse), dans leurs plafonds.
    const followUp = await this.minimoas.onUserMessage(draft, userId, input.body, { firstToday: firstInLinkToday, tone: input.tone });
    if (effect.leveledUp) draft.announceLevel(effect.state.level, userId);
    const messages = await this.session.commit(draft);
    this.minimoas.later(followUp);

    await this.character.apply(userId, 'message_sent', { maxPerDay: TALK_EVENTS_PER_DAY });
    if (input.tone) await this.character.apply(userId, input.tone === 'sweet' ? 'sweet_word' : 'tease', { maxPerDay: TONE_EVENTS_PER_DAY });
    if (effect.duoDay) {
      // Ce que faisait la photo du jour : un peu plus tendre et joueur, et de la sociabilité, pour les deux.
      for (const person of [userId, other]) await this.character.apply(person, 'wrote_together', { maxPerDay: TOGETHER_EVENTS_PER_DAY });
      // Meilleure série des deux minimoas : elle reste acquise même quand la série du lien retombe (objets à gagner).
      await this.pets.raiseBestStreak([link.userA, link.userB], effect.state.streak);
    }
    // Premier message du jour ici : l'activité en direct « à toi d'écrire » de ce lien (s'il y en a une) est finie.
    if (effect.firstToday) await this.live.endLinkStreak(userId, link.id, effect.state.streak);
    // Push : jamais le contenu du message, seulement le prénom (un envoi par lien toutes les 5 minutes au plus).
    const me = await this.profiles.findById(userId);
    await this.notifier.notify(other, 'message', { linkId: link.id, name: me?.displayName ?? '', about: userId });
    return { link: draft.link, messages };
  }
}
