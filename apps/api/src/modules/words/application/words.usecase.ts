import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { MyWords } from '@blowy/contract';
import { WORDS_RESULT_MIN_VOTES, deltaForWords, topWords } from '@blowy/domain';
import { NOTIFIER, type Notifier } from '../../../integrations/push/notifier';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES, WORD_VOTES } from '../../../shared/tokens';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord, PetsRepository, WordVotesRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import { Growth } from '../../growth/application/growth';

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
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(Growth) private readonly growth: Growth,
  ) {}

  async target(code: string): Promise<WordsTarget> {
    // Compte suspendu : la page n'existe plus pendant la suspension (Audience).
    const profile = await this.audience.publiclyVisible(await this.profiles.findByWordsCode(normalize(code)));
    const pet = profile ? await this.pets.findByOwner(profile.id) : null;
    if (!profile || !pet) throw new DomainError('not_found', errorText('wordsNotFound'));
    return { profile, pet: livePet(pet, this.clock.now()) };
  }

  /** Ton lien et ton résultat : les 3 mots les plus choisis, à partir de 3 votes (personne n'est reconnaissable). */
  async mine(userId: string): Promise<MyWords> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const votes = await this.votes.words(userId);
    return { code: profile.wordsCode, votes: await this.votes.count(userId), top: votes.length >= WORDS_RESULT_MIN_VOTES ? topWords(votes) : [], minVotes: WORDS_RESULT_MIN_VOTES };
  }

  visited(): Promise<void> {
    return this.growth.visit('m');
  }

  async vote(input: VoteInput): Promise<void> {
    const { profile } = await this.target(input.code);
    if (new Set(input.words).size !== input.words.length) throw new DomainError('invalid', errorText('wordsDistinct'));
    // Un vote par appareil : empreinte non réversible de l'IP, du navigateur et du code (rien n'est stocké en clair).
    const voterHash = createHash('sha256').update(`${input.ip}|${input.userAgent}|${normalize(input.code)}`).digest('hex');
    const added = await this.votes.add({ targetUser: profile.id, words: input.words, voterHash, createdAt: this.clock.now().toISOString() });
    if (!added) throw new DomainError('already_done', errorText('wordsAlready'));
    await this.character.apply(profile.id, 'three_words', { extra: deltaForWords(input.words) });
    await this.notifier.notify(profile.id, 'words_received');
    await this.growth.vote();
  }
}
