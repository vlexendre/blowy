/**
 * Job `notifications.plan` (spec-v5 §7.8) : réserve les notifications dues, revérifie leur
 * pertinence, applique le rythme (pause, préférences, heures calmes, plafond du jour, priorités),
 * rend le texte (normal ou discret) et l'envoie par le port `PushSender` HORS transaction.
 *
 * Journalisation : uniquement des compteurs (jamais un titre, un corps, un prénom, un jeton).
 */
import type { NotificationCategoryV5 } from '@blowy/domain';
import type { LoggerPort as Logger } from '../../../shared/application/logger.port.js';
import { priorityRank } from '../domain/catalog.js';
import { countsTowardCap, decide, type RecipientState } from '../domain/policy.js';
import { renderPush } from '../domain/render.js';
import { localDay, safeTz } from '../domain/time.js';
import type { NotificationsTuning } from './planner.js';
import type { DeviceToken, NotificationFactsReader, NotificationRepository, PushMessage, PushSender, StoredNotification } from './ports.js';
import type { RelevanceResolver } from './relevance.js';

const LEASE_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

export interface DeliveryStats {
  sent: number;
  suppressed: number;
  deferred: number;
  failed: number;
}

export class NotificationDelivery {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly facts: NotificationFactsReader,
    private readonly relevance: RelevanceResolver,
    private readonly sender: PushSender,
    private readonly tuning: NotificationsTuning,
    private readonly logger: Logger,
  ) {}

  async run(now: Date, limit = 200): Promise<DeliveryStats> {
    const stats: DeliveryStats = { sent: 0, suppressed: 0, deferred: 0, failed: 0 };
    const due = await this.repo.claimDue(now, limit, LEASE_MS);
    const byUser = new Map<string, StoredNotification[]>();
    for (const n of due) byUser.set(n.userId, [...(byUser.get(n.userId) ?? []), n]);
    for (const [userId, list] of byUser) await this.forUser(userId, list, now, stats);
    if (due.length) this.logger.info({ ...stats, provider: this.sender.kind }, 'notifications_delivered');
    return stats;
  }

  private async state(userId: string, now: Date): Promise<{ state: RecipientState; tokens: DeviceToken[]; discreet: boolean; today: string }> {
    const tz = safeTz(await this.facts.timezone(userId));
    const today = localDay(now, tz);
    const [prefs, tokens, discreet, paused, sentToday, outingToday] = await Promise.all([
      this.repo.preferences(userId),
      this.repo.activeTokens(userId, now),
      this.repo.discreetMode(userId),
      this.facts.pauseActive(userId, now),
      this.repo.sentToday(userId, today),
      this.facts.hasOutingOnDay(userId, today, tz, now),
    ]);
    const disabled = new Set<NotificationCategoryV5>([...prefs].filter(([c, on]) => !on && c !== 'SAFETY').map(([c]) => c));
    return { state: { tz, paused, disabled, sentToday, outingToday, hasDevice: tokens.length > 0 }, tokens, discreet, today };
  }

  private async forUser(userId: string, list: StoredNotification[], now: Date, stats: DeliveryStats) {
    const { state, tokens, discreet, today } = await this.state(userId, now);
    const ordered = [...list].sort((a, b) => priorityRank(a.key, this.tuning.priority) - priorityRank(b.key, this.tuning.priority) || a.deliverAt.getTime() - b.deliverAt.getTime());
    for (const n of ordered) {
      const resolved = await this.relevance.resolve(n, now);
      const d = decide(n.key, { now, expiresAt: n.expiresAt, relevance: resolved.relevance, state, tuning: this.tuning });
      if (d.action === 'SUPPRESS') {
        await this.repo.markSuppressed(n.id, d.reason, now);
        stats.suppressed++;
        continue;
      }
      if (d.action === 'DEFER') {
        await this.repo.defer(n.id, d.until, localDay(d.until, state.tz));
        stats.deferred++;
        continue;
      }
      const push = renderPush(n.key, { notificationId: n.id, vars: resolved.vars, discreet, route: resolved.route });
      const ttl = Math.max(60, Math.floor(((n.expiresAt?.getTime() ?? now.getTime() + 86_400_000) - now.getTime()) / 1000));
      const messages: PushMessage[] = tokens.map((t) => ({ to: t.token, userId, push, ttlSeconds: ttl }));
      let tickets;
      try {
        tickets = await this.sender.send(messages);
      } catch {
        tickets = messages.map(() => ({ ok: false as const, permanent: false, deviceGone: false }));
      }
      for (const [i, t] of tickets.entries()) if (!t.ok && t.deviceGone) await this.repo.forgetToken(messages[i]!.to);
      if (tickets.some((t) => t.ok)) {
        await this.repo.markSent(n.id, now, today);
        if (countsTowardCap(n.key)) state.sentToday++;
        stats.sent++;
      } else if (tickets.every((t) => !t.ok && (t.permanent || t.deviceGone)) || n.attempts + 1 >= MAX_ATTEMPTS) {
        await this.repo.markFailed(n.id, now);
        stats.failed++;
      } else {
        await this.repo.defer(n.id, new Date(now.getTime() + 60_000 * 2 ** n.attempts), today, n.attempts + 1);
        stats.deferred++;
      }
    }
  }
}
