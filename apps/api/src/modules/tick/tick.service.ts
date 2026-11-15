/**
 * Minuteur : appelle les travaux de `jobs.ts` dans l'ordre, chacun une fois par créneau d'une minute
 * (créneau réservé en base : un tick répété ou concurrent ne refait rien), dans un temps total borné.
 * Un travail qui échoue n'empêche pas les suivants ; ce qui n'a pas été fait passe au tick suivant.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { TickResult } from '@blowy/contract';
import type { Env } from '../../config/env';
import type { Clock } from '../../shared/clock';
import { CLOCK, ENV } from '../../shared/tokens';
import { TICK_JOBS } from './jobs';
import { TICK_RUNS, type TickRunsRepository } from './ports';
import type { TickJob } from './tick-job';

@Injectable()
export class TickService {
  private readonly logger = new Logger('Minuteur');

  constructor(
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
    @Inject(TICK_RUNS) private readonly runs: TickRunsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async run(): Promise<TickResult> {
    const now = this.clock.now();
    const slot = new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString();
    const deadline = Date.now() + this.env.plateforme.tick.budgetMs;
    const jobs: TickResult['jobs'] = [];
    let ran = false;
    for (const { name, job } of TICK_JOBS) {
      const started = Date.now();
      if (started >= deadline) {
        jobs.push({ name, done: 0, ms: 0, error: null, skipped: true });
        continue;
      }
      if (!(await this.runs.claim(name, slot, now.toISOString()))) {
        jobs.push({ name, done: 0, ms: 0, error: null, skipped: true });
        continue;
      }
      ran = true;
      try {
        const instance = this.moduleRef.get<TickJob>(job, { strict: false });
        const done = (await instance.runDue(now, deadline)) ?? 0;
        await this.runs.finish(name, slot, this.clock.now().toISOString(), done);
        jobs.push({ name, done, ms: Date.now() - started, error: null, skipped: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'erreur inconnue';
        this.logger.error(`travail « ${name} » : ${message}`);
        jobs.push({ name, done: 0, ms: Date.now() - started, error: message.slice(0, 200), skipped: false });
      }
    }
    return { at: now.toISOString(), ran, jobs };
  }
}
