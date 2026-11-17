import { Inject, Injectable } from '@nestjs/common';
import { ENCOUNTERS, LINK_READS, LINKS, MESSAGES } from '../../../shared/tokens';
import type { EncountersRepository } from '../../encounters/ports';
import type { LinkReadsRepository, LinksRepository, MessagesRepository } from '../../links/ports';
import { Audience } from '../../safety/application/audience';

/** Au plus ce nombre de liens lus pour le résumé (le compte reste juste pour presque tout le monde). */
const MAX_LINKS = 50;

/**
 * Ce qui s'est passé pendant une absence, pour l'e-mail des 14 jours : messages pas encore lus dans ses liens, et
 * personnes qui lui ont fait signe (seulement celles qu'on peut encore lui montrer : `Audience`).
 */
@Injectable()
export class CatchUp {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(LINK_READS) private readonly reads: LinkReadsRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(Audience) private readonly audience: Audience,
  ) {}

  async of(userId: string): Promise<{ unread: number; waves: number }> {
    const links = (await this.links.pageForUser(userId, null, MAX_LINKS)).filter((l) => l.status === 'active');
    const others = links.map((l) => (l.userA === userId ? l.userB : l.userA));
    const reachable = await this.audience.visibleIds(userId, others, 'suggest');
    let unread = 0;
    for (const l of links) {
      if (!reachable.has(l.userA === userId ? l.userB : l.userA)) continue;
      unread += await this.messages.countUnread(l.id, userId, await this.reads.lastReadAt(l.id, userId));
    }
    const waving = (await this.encounters.listInvolving(userId)).filter((e) => e.toUser === userId && e.status === 'waved').map((e) => e.fromUser);
    const waves = (await this.audience.visibleIds(userId, waving, 'suggest')).size;
    return { unread, waves };
  }
}
