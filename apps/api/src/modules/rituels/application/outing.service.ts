import { Inject, Injectable } from '@nestjs/common';
import { rituelsText, textOf } from '@blowy/content';
import type { OutingState } from '@blowy/contract';
import { type Day, OUTING_ANSWERS, type OutingAnswer, dayOf, outingVerdict } from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import { PetCharacter } from '../../pets/application/pet-character';
import { VISION_READER, VISION_SIGNALS, type VisionReader, type VisionSignals } from '../../vision/tokens';
import type { RitualStateRecord, RitualStatesRepository } from '../ports';
import { RITUAL_STATES } from '../tokens';
import { DailyService, type DoneResult } from './daily.service';
import { RitualsContext } from './rituals-context';
import { requestLocale } from '../../../shared/locale';

/** Ce que la sortie apprend à la vision : le quotidien voulu (axe Rythme), source « care » (façon de s'en occuper). */
const OUTING_RYTHME: Record<Exclude<OutingAnswer, 'not_yet'>, number> = { saw_people: 30, walk: 15 };

const outToday = (state: RitualStateRecord, today: Day): boolean =>
  state.outingOn === today && state.outingAnswer !== null && state.outingAnswer !== 'not_yet';

export const toOutingDto = (state: RitualStateRecord, today: Day): OutingState => {
  const answered = state.outingOn === today ? state.outingAnswer : null;
  return {
    question: rituelsText.in(requestLocale()).outing.question,
    answers: OUTING_ANSWERS.map((id) => ({ id, label: rituelsText.in(requestLocale()).outing.answers[id] })),
    canAnswer: !outToday(state, today),
    answer: answered,
    confirmed: state.outingOn === today && state.outingConfirmed,
  };
};

export interface OutingOutcome {
  state: RitualStateRecord;
  line: string;
  done: DoneResult | null;
}

/**
 * « Tu es sorti aujourd'hui ? » — une sortie comptée par jour. La réponse est déclarative et on la croit ;
 * une position hors de la zone du domicile aujourd'hui (signalée par l'app, ou dernier relevé de la vision) la confirme.
 * « Pas encore » laisse la question ouverte pour plus tard dans la journée.
 */
@Injectable()
export class OutingService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(DailyService) private readonly daily: DailyService,
    @Inject(VISION_READER) private readonly vision: VisionReader,
    @Inject(VISION_SIGNALS) private readonly signals: VisionSignals,
  ) {}

  async answer(userId: string, answer: OutingAnswer, awayFromHome?: boolean): Promise<OutingOutcome> {
    const today = this.ctx.today();
    const state = await this.ctx.state(userId);
    if (outToday(state, today)) throw new DomainError('already_done', textOf(rituelsText, (t) => t.errors.outingDone));
    const confirmed = awayFromHome === true || (await this.awayToday(userId, today));
    const verdict = outingVerdict(answer, confirmed ? true : null);
    const patch = { outingOn: today, outingAnswer: answer, outingConfirmed: verdict.confirmed };
    await this.states.upsert(userId, patch);
    const next = { ...state, ...patch };
    if (!verdict.out) return { state: next, line: rituelsText.in(requestLocale()).outing.reply[answer], done: null };

    await this.character.apply(userId, 'went_out', { maxPerDay: 1, sociability: verdict.gain });
    if (answer !== 'not_yet') {
      await this.signals.record(userId, [{ axis: 'rythme', value: OUTING_RYTHME[answer], source: 'care', at: this.ctx.now().toISOString() }]);
    }
    const done = await this.daily.onOuting(userId, today);
    const line = verdict.confirmed ? `${rituelsText.in(requestLocale()).outing.reply[answer]} ${rituelsText.in(requestLocale()).outing.confirmed}` : rituelsText.in(requestLocale()).outing.reply[answer];
    return { state: next, line, done };
  }

  /** Dernier relevé de position hors de la zone du domicile, aujourd'hui (lu par le service public de la vision). */
  private async awayToday(userId: string, today: Day): Promise<boolean> {
    const at = await this.vision.lastAwayAt(userId);
    return at !== null && dayOf(new Date(at)) === today;
  }
}
