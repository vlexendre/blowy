import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { deltaForWords } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES, WORD_VOTES } from '../../../shared/tokens';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord, PetsRepository, WordVotesRepository } from '../../pets/ports';

export interface WordsTarget {
  profile: Profile;
  pet: PetRecord;
}

export interface VoteInput {
  code: string;
  words: readonly string[];
  ip: string;
  userAgent: string;
}

const normalize = (code: string): string => code.trim().toUpperCase();

/** « 3 mots » : des potes décrivent la personne en 3 mots ; chaque vote fait bouger les jauges de son pet. */
@Injectable()
export class Words {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(WORD_VOTES) private readonly votes: WordVotesRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async target(code: string): Promise<WordsTarget> {
    const profile = await this.profiles.findByWordsCode(normalize(code));
    const pet = profile ? await this.pets.findByOwner(profile.id) : null;
    if (!profile || !pet) throw new DomainError('not_found', 'Ce lien « 3 mots » n’existe pas.');
    return { profile, pet: livePet(pet, this.clock.now()) };
  }

  async vote(input: VoteInput): Promise<void> {
    const { profile } = await this.target(input.code);
    if (new Set(input.words).size !== input.words.length) throw new DomainError('invalid', 'Choisis trois mots différents.');
    // Un vote par appareil : empreinte non réversible de l'IP, du navigateur et du code (rien n'est stocké en clair).
    const voterHash = createHash('sha256').update(`${input.ip}|${input.userAgent}|${normalize(input.code)}`).digest('hex');
    const added = await this.votes.add({ targetUser: profile.id, words: input.words, voterHash, createdAt: this.clock.now().toISOString() });
    if (!added) throw new DomainError('already_done', 'Tu as déjà donné tes 3 mots. Merci !');
    await this.character.apply(profile.id, 'three_words', { extra: deltaForWords(input.words) });
  }
}
