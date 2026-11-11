import { Inject, Injectable } from '@nestjs/common';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, IDS, LINKS, MESSAGES, PETS } from '../../../shared/tokens';
import type { PetsRepository } from '../../pets/ports';
import type { LinkRecord, LinksRepository, MessageRecord, MessagesRepository } from '../ports';
import { LinkDraft } from './link-draft';

/**
 * Ouvre un lien pour une personne membre (rattrapage des jours compris) et écrit les changements.
 * Toute lecture ou écriture d'un lien passe par ici.
 */
@Injectable()
export class LinkSession {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  /** Lien d'un membre ; `not_found` pour les autres (on ne révèle pas son existence). */
  async open(linkId: string, userId: string): Promise<LinkDraft> {
    const link = await this.links.findById(linkId);
    if (!link || (link.userA !== userId && link.userB !== userId)) throw new DomainError('not_found', 'Ce lien n’existe pas.');
    const [draft] = await this.draftsFor([link]);
    if (!draft) throw new DomainError('not_found');
    return draft;
  }

  /** Brouillons rattrapés pour plusieurs liens (une seule lecture des pets). */
  async draftsFor(links: readonly LinkRecord[]): Promise<LinkDraft[]> {
    const owners = [...new Set(links.flatMap((l) => [l.userA, l.userB]))];
    const pets = await this.pets.findByOwners(owners);
    const names = new Map(pets.map((p) => [p.ownerId, p.name]));
    const today = todayOf(this.clock);
    return links.map((link) => {
      const draft = new LinkDraft(link, today, names);
      draft.tick();
      return draft;
    });
  }

  /**
   * Écrit les messages puis l'état du lien. Les messages passent d'abord : si l'écriture du lien échoue,
   * le contenu des personnes n'est pas perdu (une transaction Postgres regrouperait les deux plus tard).
   * Les horodatages sont strictement croissants dans un lien, pour une pagination sans ambiguïté.
   */
  async commit(draft: LinkDraft): Promise<MessageRecord[]> {
    if (!draft.changed) return [];
    let last = Math.max(this.clock.now().getTime(), new Date(draft.link.lastMessageAt).getTime() + 1);
    const records: MessageRecord[] = draft.pending.map((m, i) => {
      if (i > 0) last += 1;
      return { ...m, id: this.ids.uuid(), linkId: draft.link.id, createdAt: new Date(last).toISOString() };
    });
    const lastRecord = records.at(-1);
    if (lastRecord) {
      await this.messages.add(records);
      draft.update({ lastMessageAt: lastRecord.createdAt });
    }
    await this.links.save(draft.link);
    draft.pending.length = 0;
    return records;
  }
}
