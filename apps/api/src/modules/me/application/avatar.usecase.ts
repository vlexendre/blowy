import { Inject, Injectable } from '@nestjs/common';
import { EXTENSIONS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { IDS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { ProfilesRepository } from '../ports';

const avatarPattern = (userId: string): RegExp => new RegExp(`^avatars/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|heic)$`);

/** Photo de profil : ticket d'envoi sous avatars/<personne>/, puis confirmation (l'ancienne est supprimée). */
@Injectable()
export class Avatar {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async ticket(userId: string, contentType: string): Promise<UploadTicket> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    const ext = EXTENSIONS[contentType];
    if (!ext) throw new DomainError('invalid', 'Ce format de photo n’est pas accepté.');
    return this.storage.createUploadTicket(`avatars/${userId}/${this.ids.uuid()}.${ext}`);
  }

  async confirm(userId: string, path: string): Promise<void> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    if (!avatarPattern(userId).test(path)) throw new DomainError('forbidden', 'Cette photo ne t’appartient pas.');
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', 'La photo n’est pas encore arrivée. Réessaie.');
    await this.profiles.update(userId, { avatarPath: path });
    if (profile.avatarPath && profile.avatarPath !== path) await this.storage.remove([profile.avatarPath]);
  }
}
