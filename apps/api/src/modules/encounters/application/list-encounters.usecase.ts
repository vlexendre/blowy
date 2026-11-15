import { Inject, Injectable } from '@nestjs/common';
import { type VisionVia, visionIntroLine, wavedAtYouLine } from '@blowy/content';
import { ENCOUNTER_QUOTA, type LookingFor, type Shape, entitlements, mutualLookingFor, shapeOf } from '@blowy/domain';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { seedOf } from '../../../shared/seed';
import { BLOCKS, CLOCK, ENCOUNTERS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import type { BlocksRepository } from '../../safety/ports';
import { Matchmaker } from '../../vision/application/matchmaker';
import { type ExplanationInput, firstCommonLine } from '../../vision/interface/vision.presenter';
import { ENCOUNTER_PROPOSALS, type EncounterRecord, type EncountersRepository, type ProposalsRepository } from '../ports';

export interface Candidate {
  profile: Profile;
  pet: PetRecord;
  /** Compatibilité de vision (0 si elle ne peut pas être expliquée : `explanation` est alors null). */
  compatibility: number;
  explanation: ExplanationInput | null;
  intro: string;
  /** Ce que vous cherchez tous les deux (filtre réciproque) ; jamais « qui ». */
  lookingFor: LookingFor | null;
}

export interface IncomingResult extends Candidate {
  encounter: EncounterRecord;
}

export interface SuggestionResult extends Candidate {
  via: VisionVia;
  mutualName: string | null;
  waved: boolean;
  explanation: ExplanationInput;
}

export interface EncountersResult {
  incoming: IncomingResult[];
  suggestions: SuggestionResult[];
  petShape: Shape;
}

/** Amis d'amis examinés au plus (ils échappent au filtre de zone, pas aux autres). */
const FRIEND_OF_FRIEND_CAP = 100;

/**
 * Rencontres : les coucous reçus, puis les personnes que le minimoa présente. Seules passent les personnes
 * compatibles (filtres durs de la vision et seuil de 70) : amis d'amis d'abord (où qu'ils soient), puis
 * celles de la zone de recherche, les plus compatibles d'abord. Sans position : seulement les amis d'amis.
 * Le nombre de suggestions dépend de la forme du minimoa (`ENCOUNTER_QUOTA`, plus le bonus de Blowy+) :
 * un minimoa qui boude ne présente personne ; les coucous reçus restent toujours visibles.
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
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(ENCOUNTER_PROPOSALS) private readonly proposals: ProposalsRepository,
  ) {}

  /** Plus grand nombre de suggestions déjà noté par personne et par jour (dans cette instance) : une écriture quand il augmente. */
  private readonly recorded = new Map<string, number>();

  private async recordProposals(userId: string, day: string, shown: readonly SuggestionResult[], review = false): Promise<void> {
    // Monde d'exemple du compte de revue : hors statistiques.
    if (review) return;
    const key = `${day}:${userId}`;
    if (shown.length === 0 || (this.recorded.get(key) ?? 0) >= shown.length) return;
    if (this.recorded.size > 50_000) this.recorded.clear();
    this.recorded.set(key, shown.length);
    try {
      await this.proposals.record(day, userId, shown.length, shown.reduce((sum, s) => sum + s.compatibility, 0));
    } catch {
      this.recorded.delete(key); // statistique seulement : jamais d'erreur pour la personne
    }
  }

  async execute(userId: string): Promise<EncountersResult> {
    const me = await this.profiles.findById(userId);
    if (!me) throw new DomainError('not_onboarded');
    const now = this.clock.now();
    const today = todayOf(this.clock);
    const [myPet, blocked, involved, myLinks, seeker] = await Promise.all([
      this.character.load(userId),
      this.blocks.blockedEitherWay(userId),
      this.encounters.listInvolving(userId),
      this.links.listForUsers([userId]),
      this.matchmaker.seeker(me),
    ]);
    const otherOf = (a: string, b: string): string => (a === userId ? b : a);
    const petShape = shapeOf(myPet.needs);
    const quota = petShape === 'boude' ? 0 : ENCOUNTER_QUOTA[petShape] + entitlements(seeker.plus).encounterBonus;

    const linked = new Set(myLinks.map((l) => otherOf(l.userA, l.userB)));
    const declined = new Set(involved.filter((e) => e.status === 'declined').map((e) => otherOf(e.fromUser, e.toUser)));
    const incoming = involved.filter((e) => e.toUser === userId && e.status === 'waved' && !blocked.has(e.fromUser) && !linked.has(e.fromUser));
    const pendingFrom = new Set(incoming.map((e) => e.fromUser));
    const myWaves = new Set(involved.filter((e) => e.fromUser === userId && e.status === 'waved').map((e) => e.toUser));
    const excluded = (id: string): boolean => id === userId || blocked.has(id) || linked.has(id) || declined.has(id) || pendingFrom.has(id);

    // Amis d'amis : les personnes liées à mes liens (hors archivés).
    const friends = myLinks.filter((l) => l.status !== 'archived').map((l) => otherOf(l.userA, l.userB));
    const mutualOf = new Map<string, string>();
    if (quota > 0) {
      for (const l of await this.links.listForUsers(friends)) {
        if (l.status === 'archived') continue;
        for (const [friend, candidate] of [[l.userA, l.userB], [l.userB, l.userA]] as const) {
          if (friends.includes(friend) && !excluded(candidate) && !mutualOf.has(candidate) && mutualOf.size < FRIEND_OF_FRIEND_CAP) mutualOf.set(candidate, friend);
        }
      }
    }

    const nearby = quota > 0 ? (await this.matchmaker.nearby(seeker)).filter((m) => !excluded(m.userId) && !mutualOf.has(m.userId)) : [];
    const wanted = [...new Set([...mutualOf.keys(), ...mutualOf.values(), ...nearby.map((m) => m.userId), ...pendingFrom])];
    // Supprimés, suspendus et bloqués disparaissent ici (Audience) : ni suggestion, ni coucou reçu, ni ami commun.
    const [profiles, pets] = await Promise.all([this.audience.visible(userId, wanted, 'suggest'), this.pets.findByOwners(wanted)]);
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const petByOwner = new Map(pets.map((p) => [p.ownerId, livePet(p, now)]));

    const fofProfiles = [...mutualOf.keys()].flatMap((id) => profileById.get(id) ?? []);
    const incomingProfiles = [...pendingFrom].flatMap((id) => profileById.get(id) ?? []);
    const [fofMatches, incomingExplained] = await Promise.all([this.matchmaker.matchAmong(seeker, fofProfiles), this.matchmaker.explainFor(seeker, incomingProfiles)]);

    const incomingOut = incoming.flatMap((encounter): IncomingResult[] => {
      const profile = profileById.get(encounter.fromUser);
      const pet = petByOwner.get(encounter.fromUser);
      if (!profile || !pet) return [];
      const c = incomingExplained.get(encounter.fromUser) ?? null;
      return [
        {
          profile,
          pet,
          encounter,
          compatibility: c?.score ?? 0,
          explanation: c,
          intro: wavedAtYouLine(me.locale, pet.name, seedOf('incoming', encounter.id)),
          lookingFor: mutualLookingFor(me, profile),
        },
      ];
    });

    const suggestion = (id: string, via: VisionVia, score: number, explanation: ExplanationInput): SuggestionResult[] => {
      const profile = profileById.get(id);
      const pet = petByOwner.get(id);
      if (!profile || !pet) return [];
      const mutualId = mutualOf.get(id);
      const mutualName = mutualId ? (profileById.get(mutualId)?.displayName ?? null) : null;
      const intro = visionIntroLine(me.locale, { other: pet.name, via, mutualName, firstCommon: firstCommonLine(explanation, me.locale) }, seedOf('intro', userId, id, today));
      return [{ profile, pet, compatibility: score, explanation, via, mutualName, intro, waved: myWaves.has(id), lookingFor: mutualLookingFor(me, profile) }];
    };

    const fofOut = [...fofMatches.entries()]
      .flatMap(([id, c]) => suggestion(id, 'friend_of_friend', c.score, c))
      .sort((a, b) => b.compatibility - a.compatibility || a.profile.id.localeCompare(b.profile.id));
    const nearbyOut = nearby.flatMap((m) => suggestion(m.userId, 'nearby', m.score, m));

    const suggestions = [...fofOut, ...nearbyOut].slice(0, quota);
    await this.recordProposals(userId, today, suggestions, !!me.reviewWorld);
    return { incoming: incomingOut, suggestions, petShape };
  }
}
