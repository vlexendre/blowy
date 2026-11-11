import { Inject, Injectable } from '@nestjs/common';
import { BLOCKS, LINKS } from '../../../shared/tokens';
import type { BlocksRepository } from '../../safety/ports';
import type { LinkRecord, LinksRepository } from '../ports';
import { LinkSession } from './link-session';

/** Liens visibles d'une personne : hors archivés et hors personnes bloquées, dernier message en tête. */
@Injectable()
export class ListLinks {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(LinkSession) private readonly session: LinkSession,
  ) {}

  async execute(userId: string): Promise<LinkRecord[]> {
    const [all, blocked] = await Promise.all([this.links.listForUsers([userId]), this.blocks.blockedEitherWay(userId)]);
    const visible = all.filter((l) => l.status !== 'archived' && !blocked.has(l.userA === userId ? l.userB : l.userA));
    const drafts = await this.session.draftsFor(visible);
    for (const d of drafts) await this.session.commit(d);
    return drafts.map((d) => d.link).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
}
