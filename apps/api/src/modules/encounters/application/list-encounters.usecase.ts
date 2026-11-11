import { Inject, Injectable } from '@nestjs/common';
import { type EncounterVia, encounterIntroLine, wavedAtYouLine } from '@blowy/content';
import { compatibility } from '@blowy/domain';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { seedOf } from '../../../shared/seed';
import { BLOCKS, CLOCK, ENCOUNTERS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { PetCharacter, withDecay } from '../../pets/application/pet-character';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import type { BlocksRepository } from '../../safety/ports';
import type { EncounterRecord, EncountersRepository } from '../ports';

export interface Candidate {
  profile: Profile;
  pet: PetRecord;
  compatibility: number;
  intro: string;
}

export interface IncomingResult extends Candidate {
  encounter: EncounterRecord;
}

export interface SuggestionResult extends Candidate {
  via: EncounterVia;
  mutualName: string | null;
  waved: boolean;
}

export interface EncountersResult {
  incoming: IncomingResult[];
  suggestions: SuggestionResult[];
}

const MAX_SUGGESTIONS = 20;
/** Vivier des personnes récentes examinées pour les suggestions. */
const RECENT_POOL = 200;
const VIA_RANK: Record<EncounterVia, number> = { friend_of_friend: 0, nearby: 1, new: 2 };

const sameCity = (a: string | null, b: string | null): boolean =>
  a !== null && b !== null && a.trim().toLowerCase() !== '' && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Rencontres : les coucous reçus, puis des pets à croiser. Amis d'amis d'abord (avec le nom de l'ami commun),
 * puis même ville, puis les autres ; dans chaque groupe, les plus compatibles d'abord.
 */
@Injectable()
export class ListEncounters {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<EncountersResult> {
    const me = await this.profiles.findById(userId);
    if (!me) throw new DomainError('not_onboarded');
    const today = todayOf(this.clock);
    const [myPet, blocked, involved, myLinks, recent] = await Promise.all([
      this.character.load(userId),
      this.blocks.blockedEitherWay(userId),
      this.encounters.listInvolving(userId),
      this.links.listForUsers([userId]),
      this.profiles.listRecent(RECENT_POOL, userId),
    ]);
    const otherOf = (a: string, b: string): string => (a === userId ? b : a);

    const linked = new Set(myLinks.map((l) => otherOf(l.userA, l.userB)));
    const declined = new Set(involved.filter((e) => e.status === 'declined').map((e) => otherOf(e.fromUser, e.toUser)));
    const incoming = involved.filter((e) => e.toUser === userId && e.status === 'waved' && !blocked.has(e.fromUser) && !linked.has(e.fromUser));
    const pendingFrom = new Set(incoming.map((e) => e.fromUser));
    const myWaves = new Set(involved.filter((e) => e.fromUser === userId && e.status === 'waved').map((e) => e.toUser));
    const excluded = (id: string): boolean => id === userId || blocked.has(id) || linked.has(id) || declined.has(id) || pendingFrom.has(id);

    // Amis d'amis : les personnes liées à mes liens (hors archivés).
    const friends = myLinks.filter((l) => l.status !== 'archived').map((l) => otherOf(l.userA, l.userB));
    const mutualOf = new Map<string, string>();
    for (const l of await this.links.listForUsers(friends)) {
      if (l.status === 'archived') continue;
      for (const [friend, candidate] of [[l.userA, l.userB], [l.userB, l.userA]] as const) {
        if (friends.includes(friend) && !excluded(candidate) && !mutualOf.has(candidate)) mutualOf.set(candidate, friend);
      }
    }

    const candidateIds = [...new Set([...mutualOf.keys(), ...recent.map((p) => p.id)])].filter((id) => !excluded(id));
    const wanted = [...new Set([...candidateIds, ...pendingFrom, ...mutualOf.values()])];
    const [profiles, pets] = await Promise.all([this.profiles.findByIds(wanted), this.pets.findByOwners(wanted)]);
    const profileById = new Map([...recent, ...profiles].map((p) => [p.id, p]));
    const petByOwner = new Map(pets.map((p) => [p.ownerId, withDecay(p, today)]));

    const candidate = (id: string): { profile: Profile; pet: PetRecord; compatibility: number } | null => {
      const profile = profileById.get(id);
      const pet = petByOwner.get(id);
      return profile && pet ? { profile, pet, compatibility: compatibility(myPet.gauges, pet.gauges) } : null;
    };

    const incomingOut = incoming.flatMap((encounter): IncomingResult[] => {
      const c = candidate(encounter.fromUser);
      return c ? [{ ...c, encounter, intro: wavedAtYouLine(c.pet.name, seedOf('incoming', encounter.id)) }] : [];
    });

    const suggestions = candidateIds
      .flatMap((id): SuggestionResult[] => {
        const c = candidate(id);
        if (!c) return [];
        const mutualId = mutualOf.get(id);
        const via: EncounterVia = mutualId ? 'friend_of_friend' : sameCity(me.city, c.profile.city) ? 'nearby' : 'new';
        const mutualName = mutualId ? (profileById.get(mutualId)?.displayName ?? null) : null;
        const intro = encounterIntroLine({ other: c.pet.name, via, compatibility: c.compatibility, mutualName }, seedOf('intro', userId, id, today));
        return [{ ...c, via, mutualName, intro, waved: myWaves.has(id) }];
      })
      .sort((a, b) => VIA_RANK[a.via] - VIA_RANK[b.via] || b.compatibility - a.compatibility || a.profile.id.localeCompare(b.profile.id))
      .slice(0, MAX_SUGGESTIONS);

    return { incoming: incomingOut, suggestions };
  }
}
