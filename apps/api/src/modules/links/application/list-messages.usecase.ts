import { Inject, Injectable } from '@nestjs/common';
import { MESSAGES } from '../../../shared/tokens';
import type { LinkRecord, MessageRecord, MessagesRepository } from '../ports';
import { LinkSession } from './link-session';

export const MESSAGES_PAGE = 40;

export interface MessagesPageResult {
  link: LinkRecord;
  /** Du plus ancien au plus récent. */
  messages: MessageRecord[];
  nextBefore: string | null;
}

@Injectable()
export class ListMessages {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
  ) {}

  async execute(linkId: string, userId: string, before: string | null): Promise<MessagesPageResult> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    const page = await this.messages.page(linkId, before, MESSAGES_PAGE);
    const oldest = page.at(-1);
    return {
      link: draft.link,
      messages: [...page].reverse(),
      nextBefore: page.length === MESSAGES_PAGE && oldest ? oldest.createdAt : null,
    };
  }
}
