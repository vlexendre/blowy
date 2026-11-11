import { Inject, Injectable } from '@nestjs/common';
import type { LinkRecord } from '../ports';
import { LinkSession } from './link-session';

@Injectable()
export class GetLink {
  constructor(@Inject(LinkSession) private readonly session: LinkSession) {}

  async execute(linkId: string, userId: string): Promise<LinkRecord> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    return draft.link;
  }
}
