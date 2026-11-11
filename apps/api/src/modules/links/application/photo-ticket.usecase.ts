import { Inject, Injectable } from '@nestjs/common';
import { EXTENSIONS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { IDS, STORAGE } from '../../../shared/tokens';
import { LinkSession } from './link-session';

/** Chemin d'une photo du jour : links/<lien>/<personne>/<jour>-<uuid>.<ext> */
export const photoPathPattern = (linkId: string, userId: string, day: string): RegExp =>
  new RegExp(`^links/${linkId}/${userId}/${day}-[0-9a-f-]{36}\\.(jpg|png|webp|heic)$`);

@Injectable()
export class PhotoTicket {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async execute(linkId: string, userId: string, contentType: string): Promise<UploadTicket> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    if (draft.link.status !== 'active') throw new DomainError('link_not_active');
    const ext = EXTENSIONS[contentType];
    if (!ext) throw new DomainError('invalid', 'Ce format de photo n’est pas accepté.');
    return this.storage.createUploadTicket(`links/${linkId}/${userId}/${draft.today}-${this.ids.uuid()}.${ext}`);
  }
}
