import { Inject, Injectable } from '@nestjs/common';
import type { AuthAdmin } from '../../../integrations/auth/ports';
import type { Storage } from '../../../integrations/storage/ports';
import { AUTH_ADMIN, DAILY_PHOTOS, LINKS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { DailyPhotosRepository, LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../ports';

/**
 * Suppression du compte (exigence App Store) : d'abord les médias, puis le compte d'authentification ;
 * la base supprime le reste en cascade. Ses liens disparaissent avec lui, photos des deux côtés comprises :
 * leurs fichiers sont effacés ici, sinon plus rien ne les référencerait.
 */
@Injectable()
export class DeleteMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(DAILY_PHOTOS) private readonly photos: DailyPhotosRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(AUTH_ADMIN) private readonly auth: AuthAdmin,
  ) {}

  async execute(userId: string): Promise<void> {
    const [profile, links] = await Promise.all([this.profiles.findById(userId), this.links.listForUsers([userId])]);
    const photos = (await Promise.all(links.map((l) => this.photos.listForLink(l.id)))).flat();
    const paths = photos.map((p) => p.mediaPath);
    if (profile?.avatarPath) paths.push(profile.avatarPath);
    await this.storage.remove(paths);
    await this.auth.deleteUser(userId);
  }
}
