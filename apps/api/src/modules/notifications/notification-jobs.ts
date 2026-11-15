/**
 * Travaux planifiés des notifications (appelés par `POST /internal/tick`), par lots et dans le temps donné :
 * 1. reports des heures calmes dont l'heure est venue (8 h locales) ;
 * 2. défi du jour à l'heure choisie (`next_morning_at`), puis report au lendemain ;
 * 3. reçus Expo de plus de 15 min : jetons désinscrits désactivés ;
 * 4. ménage (journal > 3 jours, tickets > 1 jour, budgets IA par personne > 2 jours, créneaux du minuteur > 2 jours).
 * Idempotent : un report est clos avant l'envoi (une seule fois), le défi du matin n'est envoyé qu'une fois par jour
 * local (règle du notifieur) et son prochain envoi est recalculé tout de suite.
 */
import { Inject, Injectable } from '@nestjs/common';
import { addDays, dayOf } from '@blowy/domain';
import { AI_USAGE_STORE, type AiUsageStore } from '../../integrations/ai/usage-store';
import { PUSHER, type Pusher } from '../../integrations/push/pusher';
import type { TickJob } from '../tick/tick-job';
import { TICK_RUNS, type TickRunsRepository } from '../tick/ports';
import { NotificationSettings } from './notification-settings';
import { PushNotifier } from './push-notifier';
import { type DevicesRepository, NOTIFICATION_LOG, NOTIFICATION_SETTINGS, type NotificationLogRepository, type NotificationSettingsRepository, PUSH_DEVICES, PUSH_RECEIPTS, type PushReceiptsRepository } from './ports';

const BATCH = 100;
const RECEIPT_DELAY_MS = 15 * 60_000;

@Injectable()
export class NotificationJobs implements TickJob {
  constructor(
    @Inject(PushNotifier) private readonly notifier: PushNotifier,
    @Inject(NotificationSettings) private readonly settings: NotificationSettings,
    @Inject(NOTIFICATION_SETTINGS) private readonly settingsRepo: NotificationSettingsRepository,
    @Inject(NOTIFICATION_LOG) private readonly log: NotificationLogRepository,
    @Inject(PUSH_RECEIPTS) private readonly receipts: PushReceiptsRepository,
    @Inject(PUSH_DEVICES) private readonly devices: DevicesRepository,
    @Inject(PUSHER) private readonly pusher: Pusher,
    @Inject(AI_USAGE_STORE) private readonly aiUsage: AiUsageStore,
    @Inject(TICK_RUNS) private readonly tickRuns: TickRunsRepository,
  ) {}

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    const at = now.toISOString();
    let done = 0;

    // 1. Reports.
    for (let i = 0; i < 20 && Date.now() < deadline; i++) {
      const due = await this.log.dueDeferred(at, BATCH);
      for (const entry of due) if (await this.notifier.flushDeferred(entry)) done += 1;
      if (due.length < BATCH) break;
    }

    // 2. Défi du jour, le matin.
    for (let i = 0; i < 20 && Date.now() < deadline; i++) {
      const due = await this.settingsRepo.dueMorning(at, BATCH);
      for (const s of due) {
        // D'abord le prochain créneau : un tick concurrent ne reprend pas la même personne.
        await this.settings.scheduleNextMorning(s, now);
        await this.notifier.notify(s.userId, 'daily_challenge', {});
        done += 1;
      }
      if (due.length < BATCH) break;
    }

    // 3. Reçus.
    if (Date.now() < deadline) {
      const due = await this.receipts.due(new Date(now.getTime() - RECEIPT_DELAY_MS).toISOString(), 1000);
      if (due.length > 0) {
        const receipts = await this.pusher.receipts(due.map((d) => d.ticketId));
        const invalid = due.filter((d) => receipts.get(d.ticketId)?.invalidToken).map((d) => d.token);
        if (invalid.length > 0) await this.devices.disable(invalid, at);
        await this.receipts.remove(due.filter((d) => receipts.has(d.ticketId)).map((d) => d.ticketId));
      }
    }

    // 4. Ménage.
    if (Date.now() < deadline) {
      const today = dayOf(now);
      await this.log.purge(new Date(now.getTime() - 3 * 86_400_000).toISOString());
      await this.receipts.purge(new Date(now.getTime() - 86_400_000).toISOString());
      await this.aiUsage.purgeUserCalls(addDays(today, -2));
      await this.tickRuns.purge(new Date(now.getTime() - 2 * 86_400_000).toISOString());
    }
    return done;
  }
}
