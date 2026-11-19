import { Inject, Injectable } from '@nestjs/common';
import { cheminText, notificationTexts, visionText } from '@blowy/content';
import type { Profil } from '@blowy/contract';
import { type Locale, VISION_AXES, entitlements, knowsLevelOf, minimoaTypeOf } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../../pets/ports';
import { VisionRecorder } from '../../vision/application/vision-recorder';
import { toVisionProfile } from '../../vision/interface/vision.presenter';
import type { CheminProgressRepository } from '../ports';
import { CHEMIN_PROGRESS } from '../tokens';

/**
 * « Ce que Nino sait de toi » : type de minimoa (8 types, calculés des axes), « il te connaît : un peu / bien / très
 * bien », les 5 jauges (valeur et confiance), et le rapport détaillé avec Minimoa+. Vu par la personne seule.
 */
@Injectable()
export class ProfilService {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(VisionRecorder) private readonly vision: VisionRecorder,
    @Inject(CHEMIN_PROGRESS) private readonly progress: CheminProgressRepository,
  ) {}

  async get(userId: string, locale: Locale): Promise<Profil> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    const [snapshot, pet, progress] = await Promise.all([this.vision.current(userId), this.pets.findByOwner(userId), this.progress.find(userId)]);
    const t = cheminText.in(locale);
    const minimoa = pet?.name ?? notificationTexts.in(locale).yourMinimoa;
    const type = minimoaTypeOf(snapshot.profile);
    const knows = knowsLevelOf(snapshot.profile);
    const answers = progress?.answersCount ?? 0;
    const detailed = entitlements(hasPlus(profile, this.clock.now())).detailedProfile;
    return {
      title: t.profile.title(minimoa),
      type: type ? { id: type, name: t.types[type].name, line: t.types[type].line } : null,
      typeHint: type ? null : t.typeHint(minimoa),
      knows: { level: knows.level, label: t.knows[knows.level], percent: knows.percent },
      gauges: toVisionProfile(snapshot, locale).axes,
      answers,
      detail: detailed
        ? {
            title: t.profile.detailTitle,
            lines: [...VISION_AXES.map((a) => t.profile.sure(visionText.in(locale).axes[a].name, snapshot.profile[a].confidence)), t.profile.answers(answers)],
          }
        : null,
      detailLocked: !detailed,
    };
  }
}
