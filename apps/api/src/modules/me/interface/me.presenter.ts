import { Inject, Injectable } from '@nestjs/common';
import type { Me } from '@blowy/contract';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import type { Clock } from '../../../shared/clock';
import { CLOCK, STORAGE } from '../../../shared/tokens';
import { toPetDto } from '../../pets/interface/pet.presenter';
import type { MeResult } from '../application/get-me.usecase';
import { hasPlus } from '../application/plus';
import { toIdentity } from '../../vision/interface/vision.presenter';

@Injectable()
export class MePresenter {
  constructor(
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async present({ profile, pet, place }: MeResult): Promise<Me> {
    const plus = hasPlus(profile, this.clock.now());
    return {
      id: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarPath ? await this.storage.signedUrl(profile.avatarPath, MEDIA_URL_SECONDS) : null,
      inviteCode: profile.inviteCode,
      identity: toIdentity(profile, place, plus),
      wordsCode: profile.wordsCode,
      plus,
      pet: toPetDto(pet),
    };
  }
}
