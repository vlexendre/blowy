import { Inject, Injectable } from '@nestjs/common';
import { LinkSession } from './link-session';

/** Archiver = retirer le lien de sa liste ; il peut être restauré par une nouvelle rencontre ou invitation. */
@Injectable()
export class ArchiveLink {
  constructor(@Inject(LinkSession) private readonly session: LinkSession) {}

  async execute(linkId: string, userId: string): Promise<void> {
    const draft = await this.session.open(linkId, userId);
    draft.update({ status: 'archived' });
    await this.session.commit(draft);
  }
}
