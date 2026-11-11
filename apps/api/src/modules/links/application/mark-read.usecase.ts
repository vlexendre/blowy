import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { CLOCK, LINK_READS } from '../../../shared/tokens';
import type { LinkReadsRepository } from '../ports';
import { LinkSession } from './link-session';

@Injectable()
export class MarkRead {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(LINK_READS) private readonly reads: LinkReadsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(linkId: string, userId: string): Promise<void> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    // Les horodatages d'un lien sont strictement croissants et peuvent devancer l'horloge de quelques
    // millisecondes : on marque lu jusqu'au dernier message connu.
    const now = this.clock.now().toISOString();
    const last = draft.link.lastMessageAt;
    await this.reads.markRead(linkId, userId, last > now ? last : now);
  }
}
