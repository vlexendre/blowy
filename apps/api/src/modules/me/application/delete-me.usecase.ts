import { Inject, Injectable } from '@nestjs/common';
import type { AuthAdmin } from '../../../integrations/auth/ports';
import type { Storage } from '../../../integrations/storage/ports';
import { AUTH_ADMIN, DAILY_PHOTOS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { DailyPhotosRepository } from '../../links/ports';
import type { ProfilesRepository } from '../ports';

/**
 * Suppression du compte (exigence App Store) : d'abord les médias de la personne,
 * puis le compte d'authentification ; la base supprime le reste en cascade.
 */
@Injectable()
export class DeleteMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(DAILY_PHOTOS) private readonly photos: DailyPhotosRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(AUTH_ADMIN) private readonly auth: AuthAdmin,
  ) {}

  async execute(userId: string): Promise<void> {
    const [profile, photos] = await Promise.all([this.profiles.findById(userId), this.photos.listForUser(userId)]);
    const paths = photos.map((p) => p.mediaPath);
    if (profile?.avatarPath) paths.push(profile.avatarPath);
    await this.storage.remove(paths);
    await this.auth.deleteUser(userId);
  }
}
