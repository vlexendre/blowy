import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import { Public } from './auth.guard';
import { type Clock, canAdvance } from './clock';
import { DomainError } from './errors';
import { CLOCK } from './tokens';

const AdvanceZ = z.object({ hours: z.number().positive().max(24 * 60) });

/** Avance du temps en développement local (mémoire seulement) : usure des besoins, pet qui boude, lien fantôme. */
@Public()
@Controller('dev/clock')
export class DevClockController {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  @Get()
  now(): { now: string } {
    return { now: this.clock.now().toISOString() };
  }

  @Post('advance')
  advance(@Body() body: unknown): { now: string } {
    const parsed = AdvanceZ.safeParse(body);
    if (!parsed.success) throw new DomainError('invalid', 'Indique un nombre d’heures (1 à 1440).');
    if (!canAdvance(this.clock)) throw new DomainError('forbidden');
    this.clock.advanceHours(parsed.data.hours);
    return this.now();
  }
}
