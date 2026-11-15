import { Inject, Injectable } from '@nestjs/common';
import { visionErrorText } from '@blowy/content';
import { VISION_TEST_IDS, type VisionAnswer } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { VisionSnapshot } from '../ports';
import { VisionRecorder } from './vision-recorder';

export const checkAnswers = (answers: readonly VisionAnswer[]): void => {
  if (answers.some((a) => !VISION_TEST_IDS.includes(a.questionId))) throw new DomainError('invalid', visionErrorText.unknownQuestion);
};

/** Ta vision (pour toi seul) et le test repassé. */
@Injectable()
export class MyVision {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(VisionRecorder) private readonly recorder: VisionRecorder,
  ) {}

  async get(userId: string): Promise<VisionSnapshot> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    return this.recorder.current(userId);
  }

  async retakeTest(userId: string, answers: readonly VisionAnswer[]): Promise<VisionSnapshot> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    checkAnswers(answers);
    return this.recorder.answerTest(userId, answers);
  }
}
