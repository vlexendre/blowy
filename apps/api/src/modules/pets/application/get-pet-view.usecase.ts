import { Inject, Injectable } from '@nestjs/common';
import type { RenameRule } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, PETS, PROFILES, WORD_VOTES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { PetEventRecord, PetRecord, PetsRepository, WordVotesRepository } from '../ports';
import { PetCharacter } from './pet-character';
import { renameStateOf } from './rename-state';
import { Wardrobe } from './wardrobe';

export interface PetViewResult {
  pet: PetRecord;
  events: PetEventRecord[];
  wordsCount: number;
  /** Objets attribués pendant cette requête. */
  newItems: string[];
  rename: RenameRule;
}

const EVENTS_SHOWN = 30;

@Injectable()
export class GetPetView {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(WORD_VOTES) private readonly votes: WordVotesRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Vue du pet ; attribue au passage les objets gagnés depuis la dernière vue. */
  async execute(ownerId: string): Promise<PetViewResult> {
    const newItems = await this.wardrobe.sync(ownerId);
    const pet = await this.character.load(ownerId);
    const [events, wordsCount, profile] = await Promise.all([
      this.pets.listEvents(pet.id, EVENTS_SHOWN),
      this.votes.count(ownerId),
      this.profiles.findById(ownerId),
    ]);
    const rename = renameStateOf(pet, profile, this.clock.now());
    return { pet, events, wordsCount, newItems, rename };
  }
}
