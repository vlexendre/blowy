import { Inject, Injectable } from '@nestjs/common';
import type { QuizResultDto, QuizSubmitBody } from '@blowy/contract';
import { type Locale, type QuizShareKind, isQuizCode, normalizeCode, quizResult, validQuizAnswers } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, IDS } from '../../../shared/tokens';
import { Growth } from '../../growth/application/growth';
import { QUIZ_RESULTS, type QuizRecord, type QuizResultsRepository } from '../ports';

const toDto = (r: QuizRecord): QuizResultDto => ({ code: r.code, species: r.species, trait: r.trait, second: r.second, gauges: r.gauges });

/**
 * « Quel minimoa es-tu ? » (site, sans compte ; docs/VIRALITE.md). Les règles du résultat sont dans le domaine ; ici le
 * code court, la garde du résultat (aucune donnée sur la personne) et les étapes de l'entonnoir (commencé, terminé,
 * partagé ; commencé depuis un défi pour le facteur K).
 */
@Injectable()
export class Quiz {
  constructor(
    @Inject(QUIZ_RESULTS) private readonly results: QuizResultsRepository,
    @Inject(Growth) private readonly growth: Growth,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  start(ref?: string): Promise<void> {
    return this.growth.web('quiz_start', ref ? 'ref' : '');
  }

  async submit(body: QuizSubmitBody, locale: Locale): Promise<QuizResultDto> {
    if (!validQuizAnswers(body.answers)) throw new DomainError('invalid', errorText('quizAnswers'));
    const r = quizResult(body.answers);
    const ref = body.ref && isQuizCode(body.ref) ? normalizeCode(body.ref) : null;
    for (let i = 0; i < 6; i++) {
      const record: QuizRecord = {
        code: `Q${this.ids.code().slice(0, 6)}`,
        species: r.species,
        trait: r.trait,
        second: r.second,
        gauges: r.gauges,
        ref,
        locale: body.locale ?? locale,
        createdAt: this.clock.now().toISOString(),
      };
      if (await this.results.create(record)) {
        await this.growth.web('quiz_done');
        return toDto(record);
      }
    }
    throw new DomainError('conflict');
  }

  async result(code: string): Promise<QuizResultDto> {
    const c = normalizeCode(code);
    const r = isQuizCode(c) ? await this.results.find(c) : null;
    if (!r) throw new DomainError('not_found', errorText('codeNotFound'));
    return toDto(r);
  }

  share(kind: QuizShareKind): Promise<void> {
    return this.growth.web('quiz_share', kind);
  }
}
