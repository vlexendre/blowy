/**
 * Travaux planifiés des notifications (appelés par `POST /internal/tick`), par lots et dans le temps donné :
 * 1. reports des heures calmes dont l'heure est venue (8 h locales) ;
 * 2. défi du jour à l'heure choisie (`next_morning_at`), puis report au lendemain ;
 * 3. reçus Expo de plus de 15 min : jetons désinscrits désactivés ;
 * 4. ménage (journal > 8 jours, de quoi relire une semaine d'envois ; tickets > 1 jour, budgets IA par personne > 2 jours, créneaux du minuteur > 2 jours).
 * Idempotent : un report est clos avant l'envoi (une seule fois), le défi du matin n'est envoyé qu'une fois par jour
 * local (règle du notifieur) et son prochain envoi est recalculé tout de suite.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { addDays, dayOf } from '@blowy/domain';
import { AI_USAGE_STORE, type AiUsageStore } from '../../integrations/ai/usage-store';
import { PUSHER, type Pusher } from '../../integrations/push/pusher';
import type { TickJob } from '../tick/tick-job';
import { TICK_RUNS, type TickRunsRepository } from '../tick/ports';
import { LiveActivities } from './live-activities';
import { NotificationSettings } from './notification-settings';
import { PushNotifier } from './push-notifier';
import { DAILY_PUSH_SOURCE, type DailyPushSource, type DevicesRepository, NOTIFICATION_LOG, NOTIFICATION_SETTINGS, type NotificationLogRecord, type NotificationLogRepository, type NotificationSettingsRepository, PUSH_DEVICES, PUSH_RECEIPTS, type PushReceiptsRepository } from './ports';

const BATCH = 100;
const RECEIPT_DELAY_MS = 15 * 60_000;
/** Journal des envois gardé 8 jours : la décision en relit 4, le reste sert à relire une semaine (surcharge, rafales). */
const LOG_DAYS = 8;

@Injectable()
export class NotificationJobs implements TickJob {
  private readonly logger = new Logger('Push');

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
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
    @Inject(LiveActivities) private readonly live: LiveActivities,
  ) {}

  /** Contenu du défi du jour (module « rituels ») ; absent : envoi sans détail. */
  private dailySource(): DailyPushSource | null {
    try {
      return this.moduleRef.get<DailyPushSource>(DAILY_PUSH_SOURCE, { strict: false });
    } catch {
      return null;
    }
  }

  async runDue(now: Date, deadline: number = Date.now() + 20_000): Promise<number> {
    const at = now.toISOString();
    let done = 0;

    // 1. Reports : un seul push par personne pour tout ce qui arrive à son heure en même temps (le paquet du matin, à la
    // fin des heures calmes : messages, signes, nouveaux liens… ensemble plutôt qu'une rafale de pushs à 8 h).
    for (let i = 0; i < 20 && Date.now() < deadline; i++) {
      const due = await this.log.dueDeferred(at, BATCH);
      const byUser = new Map<string, NotificationLogRecord[]>();
      for (const entry of due) byUser.set(entry.userId, [...(byUser.get(entry.userId) ?? []), entry]);
      for (const entries of byUser.values()) {
        if (entries.length === 1 && entries[0]) {
          if (await this.notifier.flushDeferred(entries[0])) done += 1;
        } else if ((await this.notifier.flushDigest(entries)) > 0) done += 1;
      }
      if (due.length < BATCH) break;
    }

    // 2. Défi du jour, le matin, à l'heure choisie : seul chemin d'envoi de `daily_challenge`.
    const source = this.dailySource();
    for (let i = 0; i < 20 && Date.now() < deadline; i++) {
      const due = await this.settingsRepo.dueMorning(at, BATCH);
      for (const s of due) {
        // D'abord le prochain créneau : un tick concurrent ne reprend pas la même personne.
        await this.settings.scheduleNextMorning(s, now);
        let vars: Record<string, string> | null = {};
        try {
          vars = source ? await source.morning(s.userId, now) : {};
        } catch (err) {
          this.logger.warn(`défi du jour illisible : ${err instanceof Error ? err.message : 'erreur'}`);
        }
        if (vars === null) continue; // personne inactive ou défi déjà fait
        await this.notifier.notify(s.userId, 'daily_challenge', vars);
        done += 1;
      }
      if (due.length < BATCH) break;
    }

    // 2 bis. Activités en direct arrivées à leur fin (minuit local) : terminées, jetons oubliés.
    if (Date.now() < deadline) done += await this.live.endExpired(now, deadline);

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
      await this.log.purge(new Date(now.getTime() - LOG_DAYS * 86_400_000).toISOString());
      await this.receipts.purge(new Date(now.getTime() - 86_400_000).toISOString());
      await this.aiUsage.purgeUserCalls(addDays(today, -2));
      await this.tickRuns.purge(new Date(now.getTime() - 2 * 86_400_000).toISOString());
    }
    return done;
  }
}
