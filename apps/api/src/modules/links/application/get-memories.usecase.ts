import { Inject, Injectable } from '@nestjs/common';
import { type Day, type LinkMilestoneKind, dayOf, daysBetween } from '@blowy/domain';
import { MESSAGES, PAST_PHOTOS } from '../../../shared/tokens';
import type { MessagesRepository, PastPhotosRepository } from '../ports';
import { LinkSession } from './link-session';

export interface MemoryMilestone {
  kind: LinkMilestoneKind | 'met';
  value: number;
  on: Day | null;
}

export interface MemoryDayResult {
  day: Day;
  myPath: string | null;
  /** Seulement si les deux avaient envoyé leur photo ce jour-là. */
  theirPath: string | null;
}

export interface MemoriesResult {
  milestones: MemoryMilestone[];
  photos: MemoryDayResult[];
  stats: { messages: number; daysTogether: number; duoDays: number; bestStreak: number };
  /** Anciennes photos des deux, comptées (réponse des apps d'avant). */
  photoCount: number;
}

/** Plus récent d'abord ; une étape sans date (d'avant la migration) passe après les étapes datées, la rencontre en dernier. */
const byRecency = (x: MemoryMilestone, y: MemoryMilestone): number => {
  if (x.kind === 'met' || y.kind === 'met') return x.kind === 'met' ? 1 : -1;
  if (x.on && y.on && x.on !== y.on) return y.on.localeCompare(x.on);
  if (!x.on !== !y.on) return x.on ? -1 : 1;
  if (x.kind !== y.kind) return x.kind === 'streak' ? -1 : 1;
  return y.value - x.value;
};

/**
 * Souvenirs d'un lien (spéc §24) : ses étapes (la rencontre, les niveaux passés, les paliers de série), quelques chiffres,
 * et les anciennes photos du jour s'il y en a (la tienne ; celle de l'autre seulement si vous aviez posté tous les deux).
 */
@Injectable()
export class GetMemories {
  constructor(
    @Inject(LinkSession) private readonly session: LinkSession,
    @Inject(PAST_PHOTOS) private readonly photos: PastPhotosRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
  ) {}

  async execute(linkId: string, userId: string): Promise<MemoriesResult> {
    const draft = await this.session.open(linkId, userId);
    await this.session.commit(draft);
    const link = draft.link;
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

    const createdOn = dayOf(new Date(link.createdAt));
    const milestones: MemoryMilestone[] = [...link.milestones.map((m) => ({ ...m })), { kind: 'met' as const, value: 0, on: createdOn }].sort(byRecency);
    return {
      milestones,
      photos: days,
      stats: {
        messages: messageCount,
        daysTogether: daysBetween(createdOn, draft.today) + 1,
        duoDays: link.duoDays,
        bestStreak: Math.max(link.bestStreak, link.streak),
      },
      photoCount: photos.length,
    };
  }
}
