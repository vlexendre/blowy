import { Inject, Injectable, Optional } from '@nestjs/common';
import { FIXTURE_ACCOUNTS, type FixtureAccounts } from '../../../review/review-auth';
import { AppleRevocation } from '../../../integrations/auth/apple-revocation';
import type { AuthAdmin } from '../../../integrations/auth/ports';
import type { Storage } from '../../../integrations/storage/ports';
import { AUTH_ADMIN, LINKS, PAST_PHOTOS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { LinksRepository, PastPhotosRepository } from '../../links/ports';
import type { RitualPhotosRepository } from '../../rituels/ports';
import { RITUAL_PHOTOS } from '../../rituels/tokens';
import type { ProfilesRepository } from '../ports';
import { blurPathOf } from './avatar-blurs';

/**
 * Suppression du compte (exigence App Store) : d'abord les médias (photo de profil et sa vignette floue comprises), puis le compte d'authentification ;
 * la base supprime le reste en cascade. Ses liens disparaissent avec lui, anciennes photos du jour des deux côtés comprises :
 * leurs fichiers sont effacés ici, sinon plus rien ne les référencerait. Juste avant de supprimer le compte, le jeton
 * de Sign in with Apple est révoqué (exigence d'Apple) ; un échec d'Apple est journalisé et ne bloque rien.
 * Même chemin pour « Supprimer mon compte », la modération et la conservation des données.
 */
@Injectable()
export class DeleteMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PAST_PHOTOS) private readonly photos: PastPhotosRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(AUTH_ADMIN) private readonly auth: AuthAdmin,
    @Inject(RITUAL_PHOTOS) private readonly ritualPhotos: RitualPhotosRepository,
    @Inject(AppleRevocation) private readonly apple: AppleRevocation,
    @Optional() @Inject(FIXTURE_ACCOUNTS) private readonly fixtures: FixtureAccounts | null = null,
  ) {}

  async execute(userId: string): Promise<void> {
    const [profile, links] = await Promise.all([this.profiles.findById(userId), this.links.listForUsers([userId])]);
    const photos = (await Promise.all(links.map((l) => this.photos.listForLink(l.id)))).flat();
    const paths = photos.map((p) => p.mediaPath);
    if (profile?.avatarPath) paths.push(profile.avatarPath, blurPathOf(profile.avatarPath));
    // Photos privées des rituels (preuves, défis photo) encore dans le stockage, gardées ou pas.
    paths.push(...(await this.ritualPhotos.listLive(userId)).map((p) => p.path));
    await this.storage.remove(paths);
    // Compte de revue d'Apple : ses personnes fictives partent avec lui, comptes d'authentification compris.
    if (profile?.reviewWorld === userId) {
      for (const f of await this.profiles.listFixtures(userId)) await this.fixtures?.remove(f.id).catch(() => undefined);
      await this.profiles.deleteFixtures(userId);
    }
    await this.apple.revokeFor(userId);
    await this.auth.deleteUser(userId);
  }
}
