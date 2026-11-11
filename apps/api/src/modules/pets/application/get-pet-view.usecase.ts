import { Inject, Injectable } from '@nestjs/common';
import type { Challenge } from '@blowy/content';
import { type Clock, todayOf } from '../../../shared/clock';
import { CLOCK, PETS, WORD_VOTES } from '../../../shared/tokens';
import type { PetEventRecord, PetRecord, PetsRepository, WordVotesRepository } from '../ports';
import { challengeOfDay } from './challenge-of-day';
import { PetCharacter } from './pet-character';

export interface PetViewResult {
  pet: PetRecord;
  events: PetEventRecord[];
  challenge: Challenge;
  doneToday: boolean;
  wordsCount: number;
}

const EVENTS_SHOWN = 30;

@Injectable()
export class GetPetView {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(WORD_VOTES) private readonly votes: WordVotesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(ownerId: string): Promise<PetViewResult> {
    const pet = await this.character.load(ownerId);
    const [events, done, wordsCount] = await Promise.all([
      this.pets.listEvents(pet.id, EVENTS_SHOWN),
      this.character.countToday(pet.id, 'challenge_done'),
      this.votes.count(ownerId),
    ]);
    return { pet, events, challenge: challengeOfDay(ownerId, todayOf(this.clock)), doneToday: done > 0, wordsCount };
  }
}
