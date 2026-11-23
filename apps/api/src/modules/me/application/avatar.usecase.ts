import { Inject, Injectable, Logger } from '@nestjs/common';
import { refusedText } from '@blowy/content';
import type { Clock } from '../../../shared/clock';
import { EXTENSIONS, type Storage, type UploadTicket } from '../../../integrations/storage/ports';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, IDS, PROFILES, STORAGE } from '../../../shared/tokens';
import type { ProfilesRepository } from '../ports';
import { AvatarModeration } from '../../moderation/avatar-moderation';
import { AvatarBlurs, avatarFoldersOf, blurPathOf } from './avatar-blurs';

const avatarPattern = (userId: string): RegExp => new RegExp(`^avatars/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|heic)$`);

/**
 * Photo de profil : ticket d'envoi sous avatars/<personne>/, puis confirmation. À la confirmation, la photo passe au
 * filtre (`AvatarModeration`) : rejetée, elle est effacée et la personne reçoit un refus clair ; non vérifiable (IA
 * indisponible), elle est publiée et sera vérifiée par le minuteur. Publiée : le profil d'abord, puis sa vignette très
 * floue (`AvatarBlurs`, seule image montrée avant le lien ; une panne n'empêche pas la photo d'être à jour, le minuteur
 * rattrape), puis le ménage : tout ce qui reste dans `avatars/<personne>/` et `blurred/<personne>/` hors la nouvelle
 * photo et sa vignette (anciennes photos, envois jamais confirmés, vignettes d'une course perdue) part en un seul appel.
 */
@Injectable()
export class Avatar {
  private readonly logger = new Logger('Avatar');

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(AvatarModeration) private readonly moderation: AvatarModeration,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AvatarBlurs) private readonly blurs: AvatarBlurs,
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
    // Le profil d'abord : la vignette se relit contre lui (`AvatarBlurs.make`). D'ici qu'elle existe, les personnes sans
    // lien voient le minimoa (`hidden`), jamais l'original.
    await this.profiles.update(userId, { avatarPath: path, avatarCheckedAt: outcome === 'ok' ? this.clock.now().toISOString() : null });
    await this.blurs.makeQuietly(path);
    await this.sweep(userId, path);
  }

  /**
   * Efface tout ce que la personne a dans ses deux dossiers, sauf `keep` et sa vignette. Une panne du stockage ne fait
   * pas échouer la confirmation (la photo est déjà à jour) : le prochain changement ou la suppression du compte reprend
   * le ménage.
   */
  private async sweep(userId: string, keep: string): Promise<void> {
    try {
      const kept = new Set([keep, blurPathOf(keep)]);
      const found = (await Promise.all(avatarFoldersOf(userId).map((f) => this.storage.list(f)))).flat();
      const stale = found.filter((p) => !kept.has(p));
      if (stale.length > 0) await this.storage.remove(stale);
    } catch (err) {
      this.logger.warn(`anciennes photos de profil non effacées : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}
