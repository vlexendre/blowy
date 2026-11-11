import { Inject, Injectable } from '@nestjs/common';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK } from '../../../shared/tokens';
import { challengeOfDay } from './challenge-of-day';
import { PetCharacter } from './pet-character';

/** Réponse au défi du jour : une fois par jour ; effet du défi + petit effet de la réponse choisie. */
@Injectable()
export class AnswerChallenge {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(ownerId: string, choice: 0 | 1): Promise<void> {
    const pet = await this.character.load(ownerId);
    if ((await this.character.countToday(pet.id, 'challenge_done')) > 0) {
      throw new DomainError('already_done', 'Tu as déjà relevé le défi du jour. Reviens demain !');
    }
    const challenge = challengeOfDay(ownerId, todayOf(this.clock));
    await this.character.apply(ownerId, 'challenge_done', { extra: challenge.choices[choice].delta });
  }
}
