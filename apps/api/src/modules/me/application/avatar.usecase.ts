import { Inject, Injectable } from '@nestjs/common';
import { refusedText } from '@blowy/content';
import type { Clock } from '../../../shared/clock';
import { EXTENSIONS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, IDS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { ProfilesRepository } from '../ports';
import { AvatarModeration } from '../../moderation/avatar-moderation';

const avatarPattern = (userId: string): RegExp => new RegExp(`^avatars/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|heic)$`);

/**
 * Photo de profil : ticket d'envoi sous avatars/<personne>/, puis confirmation (l'ancienne est supprimée). À la
 * confirmation, la photo passe au filtre (`AvatarModeration`) : rejetée, elle est effacée et la personne reçoit un refus
 * clair ; non vérifiable (IA indisponible), elle est publiée et sera vérifiée par le minuteur.
 */
@Injectable()
export class Avatar {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(AvatarModeration) private readonly moderation: AvatarModeration,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async ticket(userId: string, contentType: string): Promise<UploadTicket> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    const ext = EXTENSIONS[contentType];
    if (!ext) throw new DomainError('invalid', errorText('photoFormat'));
    return this.storage.createUploadTicket(`avatars/${userId}/${this.ids.uuid()}.${ext}`);
  }

  async confirm(userId: string, path: string): Promise<void> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    if (!avatarPattern(userId).test(path)) throw new DomainError('forbidden', errorText('photoNotYours'));
    if (!(await this.storage.exists(path))) throw new DomainError('invalid', errorText('photoNotArrived'));
    if (profile.avatarPath === path) return;
    const outcome = await this.moderation.review(profile, path);
    if (outcome === 'rejected') throw new DomainError('content_refused', (l) => refusedText(l, 'photo', null));
    await this.profiles.update(userId, { avatarPath: path, avatarCheckedAt: outcome === 'ok' ? this.clock.now().toISOString() : null });
    if (profile.avatarPath && profile.avatarPath !== path) await this.storage.remove([profile.avatarPath]);
  }
}
