/**
 * Dans le monde d'exemple du compte de revue, la personne fictive répond quand le compte de revue lui écrit (réplique
 * tirée d'une courte liste, en arrière-plan) : l'examinateur voit une conversation vivante, la série du lien avancer et
 * les minimoas réagir. Rien pour un vrai lien. Au plus 30 réponses par jour et par compte de revue.
 */
import { Inject, Injectable } from '@nestjs/common';
import { auditText } from '@blowy/content';
import { dayOf } from '@blowy/domain';
import { Background } from '../shared/background';
import type { Clock } from '../shared/clock';
import { CLOCK, LINKS, PROFILES } from '../shared/tokens';
import { SendMessage } from '../modules/links/application/send-message.usecase';
import type { LinksRepository } from '../modules/links/ports';
import type { ProfilesRepository } from '../modules/me/ports';

export const REVIEW_REPLIES = Symbol('REVIEW_REPLIES');

export interface ReviewReplies {
  afterUserMessage(linkId: string, userId: string): void;
}

const PER_DAY = 30;

@Injectable()
export class ReviewAutoReplies implements ReviewReplies {
  private readonly count = new Map<string, number>();

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(SendMessage) private readonly send: SendMessage,
    @Inject(Background) private readonly background: Background,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  afterUserMessage(linkId: string, userId: string): void {
    this.background.run('réponse du monde de revue', async () => {
      const me = await this.profiles.findById(userId);
      if (!me || me.reviewWorld !== userId) return;
      const link = await this.links.findById(linkId);
      if (!link || link.status !== 'active') return;
      const otherId = link.userA === userId ? link.userB : link.userA;
      const other = await this.profiles.findById(otherId);
      if (other?.reviewWorld !== userId) return;
      const key = `${dayOf(this.clock.now())}:${userId}`;
      const n = this.count.get(key) ?? 0;
      if (n >= PER_DAY) return;
      if (this.count.size > 1000) this.count.clear();
      this.count.set(key, n + 1);
      const replies = auditText.in(me.locale).review.replies;
      await this.send.execute({ linkId, userId: otherId, body: replies[n % replies.length] ?? '🙂' });
    });
  }
}
