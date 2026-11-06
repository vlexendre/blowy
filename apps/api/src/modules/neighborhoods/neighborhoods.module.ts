/** Composition root du module `neighborhoods` (quartiers, liste d'attente, créneaux des lieux). */
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock } from '../../shared/application/clock.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB } from '../../shared/shared.tokens.js';
import type { AppConfig } from '../../config/env.js';
import { ONCALL_MARGIN_BEFORE_MS } from '../../shared/application/ports/oncall-coverage.port.js';
import { selectOnCallCoverage } from '../../shared/infrastructure/oncall/prisma-oncall-coverage.js';
import type { RecurringJob } from '../../jobs/scheduler.js';
import { NeighborhoodsUseCases } from './application/neighborhoods.use-cases.js';
import { NEIGHBORHOODS_REPOSITORY, type NeighborhoodsRepository } from './application/ports/neighborhoods.repository.js';
import { PrismaNeighborhoodsRepository } from './infrastructure/prisma-neighborhoods.repository.js';
import { NeighborhoodsController } from './interface/neighborhoods.controller.js';

export const NEIGHBORHOODS_JOBS = Symbol('NeighborhoodsJobs');
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

@Global()
@Module({
  controllers: [NeighborhoodsController],
  providers: [
    { provide: NEIGHBORHOODS_REPOSITORY, useFactory: (db: Db) => new PrismaNeighborhoodsRepository(db), inject: [DB] },
    { provide: NeighborhoodsUseCases, useFactory: (r: NeighborhoodsRepository, b: CommandBus, c: Clock) => new NeighborhoodsUseCases(r, b, c, DEFAULT_TUNING), inject: [NEIGHBORHOODS_REPOSITORY, COMMAND_BUS, CLOCK] },
    {
      provide: NEIGHBORHOODS_JOBS,
      useFactory: (r: NeighborhoodsRepository, db: Db, cfg: AppConfig): RecurringJob[] => {
        // V5.6 (E12) : un créneau n'existe que si l'astreinte le couvre, du check-in à la fin prévue.
        const coverage = selectOnCallCoverage(db, cfg);
        const durationMs = DEFAULT_TUNING.outings.durationMinutes * 60_000;
        const covered = (tz: string, startsAt: Date) => coverage.covered(tz, new Date(startsAt.getTime() - ONCALL_MARGIN_BEFORE_MS), new Date(startsAt.getTime() + durationMs));
        return [
          { name: 'neighborhoods.generate_slots', everyMs: 24 * 3_600_000, windowKey: dayKey, run: (now) => r.generateSlots(now, 1, covered) },
          { name: 'neighborhoods.oncall_watch', everyMs: 3_600_000, windowKey: (d: Date) => d.toISOString().slice(0, 13), run: (now) => r.watchCoverage(now, 14, covered) },
        ];
      },
      inject: [NEIGHBORHOODS_REPOSITORY, DB, APP_CONFIG],
    },
  ],
  exports: [NEIGHBORHOODS_JOBS, NeighborhoodsUseCases],
})
export class NeighborhoodsModule {}
