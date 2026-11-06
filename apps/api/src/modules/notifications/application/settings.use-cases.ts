/**
 * Commandes de la personne : préférences par catégorie, mode discret, jeton de l'appareil.
 * Idempotentes (CommandBus) ; le jeton n'entre jamais dans un résultat mémorisé ni dans un log.
 */
import { NOTIFICATION_CATEGORIES_V5, type NotificationCategoryV5 } from '@blowy/domain';
import type { NotificationSettingsView, RegisterPushTokenRequest, UpdateNotificationSettingsRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock } from '../../../shared/application/clock.js';
import type { NotificationsTuning } from './planner.js';
import type { NotificationFactsReader, NotificationRepository } from './ports.js';

export const ALWAYS_ON: readonly NotificationCategoryV5[] = ['SAFETY'];

export class NotificationSettingsUseCases {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly facts: NotificationFactsReader,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly tuning: NotificationsTuning,
  ) {}

  async view(userId: string, sessionId: string): Promise<NotificationSettingsView> {
    const now = this.clock.now();
    const [prefs, discreet, paused, registered] = await Promise.all([this.repo.preferences(userId), this.repo.discreetMode(userId), this.facts.pauseActive(userId, now), this.repo.sessionHasToken(sessionId)]);
    const categories = Object.fromEntries(NOTIFICATION_CATEGORIES_V5.map((c) => [c, ALWAYS_ON.includes(c) ? true : (prefs.get(c) ?? true)])) as NotificationSettingsView['categories'];
    return {
      discreetMode: discreet,
      categories,
      alwaysOn: [...ALWAYS_ON],
      quietHours: { startHour: this.tuning.quietStartHour, endHour: this.tuning.quietEndHour },
      maxPerDay: this.tuning.maxPerDay,
      maxPerOutingDay: this.tuning.outingDayMax,
      maxOutingProposalsPerWeek: this.tuning.maxOutingProposalsPerWeek,
      paused,
      pushRegistered: registered,
    };
  }

  async update(userId: string, commandId: string, req: UpdateNotificationSettingsRequest): Promise<void> {
    await this.bus.execute({
      actorId: userId,
      operation: 'notifications.update_settings',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        if (req.categories) {
          const toggles = Object.fromEntries(Object.entries(req.categories).filter(([c, v]) => v !== undefined && !ALWAYS_ON.includes(c as NotificationCategoryV5))) as Partial<Record<NotificationCategoryV5, boolean>>;
          await this.repo.setPreferences(scope, userId, toggles);
        }
        if (req.discreetMode !== undefined) await this.repo.setDiscreetMode(scope, userId, req.discreetMode);
        return { ok: true };
      },
    });
  }

  async registerToken(userId: string, sessionId: string, commandId: string, req: RegisterPushTokenRequest): Promise<void> {
    await this.bus.execute({
      actorId: userId,
      operation: 'notifications.register_push_token',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await this.repo.setToken(scope, { sessionId, userId, token: req.token, platform: req.platform });
        return { registered: true };
      },
    });
  }

  async unregisterToken(userId: string, sessionId: string, commandId: string): Promise<void> {
    await this.bus.execute({
      actorId: userId,
      operation: 'notifications.unregister_push_token',
      commandId,
      payload: { sessionId },
      handle: async (scope) => {
        await this.repo.clearSessionToken(scope, sessionId, userId);
        return { ok: true };
      },
    });
  }
}
