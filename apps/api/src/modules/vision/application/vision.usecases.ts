import { Inject, Injectable } from '@nestjs/common';
import { textOf, visionText } from '@blowy/content';
import { type VisionAnswer, testAnswersState } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../../me/ports';
import type { VisionSnapshot } from '../ports';
import { VisionRecorder } from './vision-recorder';

/** Réponses au test : aucune (inscription sans test, la personne est envoyée au test ensuite) ou les 12 situations. */
export const checkAnswers = (answers: readonly VisionAnswer[], allowNone = false): void => {
  const state = testAnswersState(answers);
  if (state === 'unknown_question') throw new DomainError('invalid', textOf(visionText, (t) => t.errors.unknownQuestion));
  if (state === 'incomplete' || (state === 'none' && !allowNone)) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.incompleteTest));
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
