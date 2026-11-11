import { Inject, Injectable } from '@nestjs/common';
import type { Me } from '@blowy/contract';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import type { Clock } from '../../../shared/clock';
import { CLOCK, STORAGE } from '../../../shared/tokens';
import { toPetDto } from '../../pets/interface/pet.presenter';
import type { MeResult } from '../application/get-me.usecase';

@Injectable()
export class MePresenter {
  constructor(
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async present({ profile, pet }: MeResult): Promise<Me> {
    return {
      id: profile.id,
      displayName: profile.displayName,
      city: profile.city,
      avatarUrl: profile.avatarPath ? await this.storage.signedUrl(profile.avatarPath, MEDIA_URL_SECONDS) : null,
      inviteCode: profile.inviteCode,
      wordsCode: profile.wordsCode,
      plus: profile.plusUntil !== null && new Date(profile.plusUntil) > this.clock.now(),
      pet: toPetDto(pet),
    };
  }
}
