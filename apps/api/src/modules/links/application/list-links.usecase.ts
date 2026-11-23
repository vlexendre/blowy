import { Inject, Injectable } from '@nestjs/common';
import { LINKS } from '../../../shared/tokens';
import { Audience } from '../../safety/application/audience';
import type { LinkRecord, LinksRepository } from '../ports';
import { LinkSession } from './link-session';

/** Liens visibles d'une personne : hors archivés et hors personnes bloquées (`Audience`), dernier message en tête. */
@Injectable()
export class ListLinks {
  constructor(
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(LinkSession) private readonly session: LinkSession,
  ) {}

  async execute(userId: string): Promise<LinkRecord[]> {
    const [all, blocked] = await Promise.all([this.links.listForUsers([userId]), this.audience.blockedPartners(userId)]);
    const visible = all.filter((l) => l.status !== 'archived' && !blocked.has(l.userA === userId ? l.userB : l.userA));
    const drafts = await this.session.draftsFor(visible);
    for (const d of drafts) await this.session.commit(d);
    return drafts.map((d) => d.link).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
}
