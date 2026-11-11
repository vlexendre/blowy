import { Inject, Injectable } from '@nestjs/common';
import { type Day, addDays, dayOf, daysBetween } from '@blowy/domain';
import { DAILY_PHOTOS, MESSAGES } from '../../../shared/tokens';
import type { DailyPhotosRepository, MessagesRepository } from '../ports';
import { LinkSession } from './link-session';

export interface MemoryDayResult {
  day: Day;
  myPath: string | null;
  /** Seulement si les deux ont envoyé leur photo ce jour-là. */
  theirPath: string | null;
}

export interface MemoriesResult {
  days: MemoryDayResult[];
  stats: { messages: number; photos: number; daysTogether: number; bestStreak: number };
}

/** Plus longue suite de jours consécutifs (triés du plus récent au plus ancien). */
function longestRun(daysDesc: readonly Day[]): number {
  let best = 0;
  let run = 0;
  let prev: Day | null = null;
  for (const d of daysDesc) {
    run = prev !== null && addDays(d, 1) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Souvenirs : les jours où tu as envoyé ta photo ; celle de l'autre n'apparaît que si vous l'avez faite à deux. */
@Injectable()
export class GetMemories {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(DAILY_PHOTOS) private readonly photos: DailyPhotosRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
  ) {}

  async execute(linkId: string, userId: string): Promise<MemoriesResult> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    const [photos, messageCount] = await Promise.all([this.photos.listForLink(linkId), this.messages.countUserMessages(linkId)]);

    const byDay = new Map<Day, { mine?: string; theirs?: string }>();
    for (const p of photos) {
      const entry = byDay.get(p.day) ?? {};
      if (p.userId === userId) entry.mine = p.mediaPath;
      else entry.theirs = p.mediaPath;
      byDay.set(p.day, entry);
    }
    const days: MemoryDayResult[] = [...byDay.entries()]
      .filter(([, e]) => e.mine !== undefined)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, e]) => ({ day, myPath: e.mine ?? null, theirPath: e.mine && e.theirs ? e.theirs : null }));
    const duoDays = days.filter((d) => d.theirPath !== null).map((d) => d.day);

    return {
      days,
      stats: {
        messages: messageCount,
        photos: photos.length,
        daysTogether: daysBetween(dayOf(new Date(draft.link.createdAt)), draft.today) + 1,
        bestStreak: Math.max(longestRun(duoDays), draft.link.streak),
      },
    };
  }
}
