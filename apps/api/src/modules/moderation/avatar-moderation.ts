/**
 * Photo de profil passée au filtre (`PhotoCheck`) : à l'envoi (refus clair si elle est rejetée) et, pour celles qui
 * n'ont pas pu être vérifiées (IA indisponible) ou qui datent d'avant le filtre, par le minuteur.
 * Une photo rejetée est retirée et effacée du stockage, sa vignette floue avec ; l'équipe reçoit un signalement automatique (urgent si la
 * personne semble mineure) sans la photo elle-même.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { AiModerationLabel } from '@blowy/domain';
import type { Storage } from '../../integrations/storage/ports';
import type { Clock } from '../../shared/clock';
import { CLOCK, PROFILES, STORAGE } from '../../shared/tokens';
import { AvatarBlurs } from '../me/application/avatar-blurs';
import type { Profile, ProfilesRepository } from '../me/ports';
import { PhotoCheck } from './photo-check';
import { ReportDesk } from './report-desk';

export type AvatarOutcome = 'ok' | 'rejected' | 'unchecked';

@Injectable()
export class AvatarModeration {
  constructor(
    @Inject(PhotoCheck) private readonly check: PhotoCheck,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AvatarBlurs) private readonly blurs: AvatarBlurs,
  ) {}

  /** Vérifie `path` pour `profile`. Une photo rejetée est effacée (et retirée du profil si c'était la sienne). */
  async review(profile: Profile, path: string): Promise<AvatarOutcome> {
    const verdict = await this.check.check(profile.id, path, profile.locale);
    const now = this.clock.now().toISOString();
    if (verdict.kind === 'unchecked') return 'unchecked';
    if (verdict.kind === 'ok' || verdict.kind === 'unreadable') {
      if (profile.avatarPath === path) await this.profiles.update(profile.id, { avatarCheckedAt: now });
      return 'ok';
    }
    await this.storage.remove([path]);
    await this.blurs.remove(path);
    if (profile.avatarPath === path) await this.profiles.update(profile.id, { avatarPath: null, avatarCheckedAt: now });
    await this.desk.file({
      reporter: null,
      targetUser: profile.id,
      reason: verdict.label === 'MINOR' ? 'mineur' : 'contenu_inapproprie',
      details: `Photo de profil refusée par le filtre (${labelFr(verdict.label)}). La photo a été effacée.`,
      source: 'filter',
      category: verdict.label === 'MINOR' ? 'minor_sexual' : verdict.label === 'THREAT' ? 'threat' : verdict.label === 'HATE' ? 'hate' : 'sexual',
      label: `photo_${verdict.label.toLowerCase()}`,
    });
    return 'rejected';
  }
}

const labelFr = (l: AiModerationLabel): string =>
  ({ OK: 'rien', INSULT: 'insulte', SEXUAL: 'nudité ou contenu sexuel', MINOR: 'personne qui semble mineure', THREAT: 'violence', HATE: 'haine', SPAM: 'publicité ou contact' })[l];
