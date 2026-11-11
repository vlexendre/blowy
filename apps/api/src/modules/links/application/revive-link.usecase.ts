import { Inject, Injectable } from '@nestjs/common';
import { revivedLine, systemText } from '@blowy/content';
import { reviveLink } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import type { LinkActionResult } from './link-action';
import { LinkSession } from './link-session';

/** Ranimer un lien fantôme : une seule fois dans sa vie. Les deux pets fêtent ça. */
@Injectable()
export class ReviveLink {
  constructor(@Inject(LinkSession) private readonly session: LinkSession) {}

  async execute(linkId: string, userId: string): Promise<LinkActionResult> {
    const draft = await this.session.open(linkId, userId);
    const revived = reviveLink(draft.link, draft.today);
    if (!revived) {
      await this.session.commit(draft);
      throw new DomainError('cannot_revive', draft.link.revived ? 'Ce lien a déjà été ranimé une fois.' : 'Ce lien n’est pas fantôme.');
    }
    draft.update(revived);
    draft.system(systemText.revived);
    for (const owner of [userId, draft.otherOf(userId)]) draft.pet(owner, revivedLine(draft.pair(owner), draft.seed('revived', owner)));
    const messages = await this.session.commit(draft);
    return { link: draft.link, messages };
  }
}
