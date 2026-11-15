import { Inject, Injectable } from '@nestjs/common';
import { type EncounterOutcome, encounterOutcome } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { BLOCKS, CLOCK, ENCOUNTERS, LINKS, PETS, PROFILES, REPORTS } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import type { BlocksRepository, ReportsRepository } from '../../safety/ports';
import type { EncounterRecord, EncountersRepository } from '../ports';

export const HISTORY_PAGE = 20;

export interface HistoryEntry {
  encounter: EncounterRecord;
  profile: Profile;
  pet: PetRecord;
  direction: 'received' | 'sent';
  outcome: EncounterOutcome;
  linkId: string | null;
}

export interface HistoryPage {
  entries: HistoryEntry[];
  nextBefore: string | null;
}

/**
 * Historique des rencontres : coucous reçus auxquels la personne a répondu et coucous qu'elle a envoyés,
 * du plus récent au plus ancien, par pages de HISTORY_PAGE. Personnes bloquées (dans un sens ou l'autre),
 * signalées par elle ou disparues (compte supprimé) : absentes. Deux coucous croisés ne font qu'une ligne.
 */
@Injectable()
export class ListEncounterHistory {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, before: string | null): Promise<HistoryPage> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    const raw = await this.encounters.listHistory(userId, before, HISTORY_PAGE);
    const oldest = raw.at(-1);
    // Le curseur suit les lignes lues, pas les lignes montrées : un filtre ne fait jamais sauter de page.
    const nextBefore = raw.length === HISTORY_PAGE && oldest ? oldest.statusAt : null;

    const otherOf = (e: EncounterRecord): string => (e.fromUser === userId ? e.toUser : e.fromUser);
    const others = [...new Set(raw.map(otherOf))];
    const [blocked, reported, myLinks, profiles, pets] = await Promise.all([
      this.blocks.blockedEitherWay(userId),
      this.reports.reportedBy(userId),
      this.links.listForUsers([userId]),
      this.profiles.findByIds(others),
      this.pets.findByOwners(others),
    ]);
    const now = this.clock.now();
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const petByOwner = new Map(pets.map((p) => [p.ownerId, livePet(p, now)]));
    const openLinkWith = new Map(
      myLinks.filter((l) => l.status !== 'archived').map((l) => [l.userA === userId ? l.userB : l.userA, l.id]),
    );

    // Coucous croisés (même instant) : on garde celui de la personne qui regarde.
    const ordered = [...raw].sort((a, b) => b.statusAt.localeCompare(a.statusAt) || Number(b.fromUser === userId) - Number(a.fromUser === userId));
    const seen = new Set<string>();
    const entries = ordered.flatMap((encounter): HistoryEntry[] => {
      const other = otherOf(encounter);
      if (blocked.has(other) || reported.has(other)) return [];
      const profile = profileById.get(other);
      const pet = petByOwner.get(other);
      if (!profile || !pet) return [];
      const sent = encounter.fromUser === userId;
      const linkId = openLinkWith.get(other) ?? null;
      const outcome = encounterOutcome({ status: encounter.status, sent, linkOpen: linkId !== null });
      if (!outcome) return [];
      const key = `${other}:${outcome}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ encounter, profile, pet, direction: sent ? 'sent' : 'received', outcome, linkId: outcome === 'linked' ? linkId : null }];
    });
    return { entries, nextBefore };
  }
}
