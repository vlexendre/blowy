import { Inject, Injectable } from '@nestjs/common';
import { dayOf, weekStart } from '@blowy/domain';
import type { TickJob } from '../../tick/tick-job';
import { LEAGUE_STANDINGS, type LeagueStandingsRepository } from '../ports';
import { ProgressionService } from './progression.service';

const BATCH = 50;

/** Jour de la semaine (0 = dimanche) et heure, à Paris. */
function paris(now: Date): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  return { weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd), hour };
}

/**
 * Ligues (façon Duolingo), à chaque passage du minuteur (`modules/tick/jobs.ts`) :
 * - le lundi à partir de 9 h (Paris) : solde la semaine finie de chacun (montée, maintien, descente) et l'annonce ;
 * - le dimanche de 17 h à 20 h : « dernières heures », ton rang et ce qui manque pour monter.
 * Idempotent : une ligue soldée porte la nouvelle semaine ; une notification de ligue par jour au plus (notifieur).
 */
@Injectable()
export class LeagueJobs implements TickJob {
  constructor(
    @Inject(LEAGUE_STANDINGS) private readonly standings: LeagueStandingsRepository,
    @Inject(ProgressionService) private readonly progression: ProgressionService,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    const { weekday, hour } = paris(now);
    const monday = weekStart(dayOf(now));
    let done = 0;
    let after: string | null = null;
    if (weekday === 1 && hour >= 9) {
      while (Date.now() < deadline) {
        const page = await this.standings.listStale(monday, after, BATCH);
        if (page.length === 0) break;
        for (const s of page) {
          await this.progression.get(s.userId).catch(() => undefined);
          done++;
        }
        after = page[page.length - 1]?.userId ?? null;
      }
    }
    if (weekday === 0 && hour >= 17 && hour < 20) {
      while (Date.now() < deadline) {
        const page = await this.standings.listWeek(monday, after, BATCH);
        if (page.length === 0) break;
        for (const s of page) if (await this.progression.remindEnding(s.userId).catch(() => false)) done++;
        after = page[page.length - 1]?.userId ?? null;
      }
    }
    return done;
  }
}
