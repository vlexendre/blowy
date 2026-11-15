/**
 * Racine de composition du chantier « plateforme » (globale) : cache, limites de débit, arrière-plan,
 * passerelle d'IA et compteur, push et notifieur, dépôts des minimoas du chat et des notifications, minuteur.
 * Pour plusieurs instances : remplacer CACHE et RATE_LIMIT_STORE par des adaptateurs partagés ici.
 */
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import type { Env } from '../../config/env';
import { chatMinimoasRepositories } from '../../modules/links/minimoas/providers';
import { NotificationJobs } from '../../modules/notifications/notification-jobs';
import { NotificationSettings } from '../../modules/notifications/notification-settings';
import { NotificationsController } from '../../modules/notifications/notifications.controller';
import { notificationsRepositories } from '../../modules/notifications/providers';
import { PushNotifier } from '../../modules/notifications/push-notifier';
import { TICK_RUNS, type TickRunsRepository } from '../../modules/tick/ports';
import { MemoryTickRunsRepository, SupabaseTickRunsRepository } from '../../modules/tick/tick-runs.repositories';
import { TickController } from '../../modules/tick/tick.controller';
import { TickService } from '../../modules/tick/tick.service';
import { repository } from '../../persistence/repository';
import { Background } from '../../shared/background';
import { CACHE, type Cache, MemoryCache } from '../../shared/cache';
import type { Clock } from '../../shared/clock';
import { CLOCK } from '../../shared/tokens';
import { MemoryRateLimitStore, RATE_LIMIT_STORE, UserRateLimitGuard } from '../../shared/user-rate-limit';
import { AI_GATEWAY } from '../ai/ai-gateway';
import { AiUsage } from '../ai/ai-usage.service';
import { AnthropicModel } from '../ai/anthropic-model';
import { MemoryAiUsageStore } from '../ai/memory-usage-store';
import { MemoryModel } from '../ai/memory-model';
import { MeteredAiGateway } from '../ai/metered-gateway';
import type { ModelClient } from '../ai/model-client';
import { SupabaseAiUsageStore } from '../ai/supabase-usage-store';
import { AI_USAGE_STORE, type AiUsageStore } from '../ai/usage-store';
import { ExpoPusher } from '../push/expo-pusher';
import { ApnsLiveActivities } from '../push/apns-live-activities';
import { LIVE_ACTIVITIES, type LiveActivityPusher, NoLiveActivities } from '../push/live-activity';
import { MemoryLiveActivities } from '../push/memory-live-activities';
import { LiveActivities } from '../../modules/notifications/live-activities';
import { MemoryPusher } from '../push/memory-pusher';
import { NOTIFIER } from '../push/notifier';
import { NoPusher, PUSHER } from '../push/pusher';

/** Activités en direct : APNs si la clé est là, mémoire en local, sinon rien (docs/WIDGETS.md). */
function liveActivityPusher(env: Env, clock: Clock): LiveActivityPusher {
  const la = env.plateforme.liveActivities;
  if (la.provider === 'apns' && la.apns) return new ApnsLiveActivities({ ...la.apns, bundleId: env.facturationAdmin.apple.bundleId }, () => clock.now());
  return la.provider === 'memory' ? new MemoryLiveActivities() : new NoLiveActivities();
}

/** Modèle d'IA branché (null : IA désactivée). Les tests y lisent le `MemoryModel`. */
export const AI_MODEL = Symbol('AI_MODEL');

@Module({})
export class PlateformeModule {
  static forRoot(env: Env): DynamicModule {
    const p = env.plateforme;
    const model: ModelClient | null = p.ai.provider === 'anthropic' && p.ai.apiKey ? new AnthropicModel(p.ai.apiKey) : p.ai.provider === 'memory' ? new MemoryModel() : null;
    const providers: Provider[] = [
      { provide: CACHE, useFactory: (clock: Clock) => new MemoryCache(clock), inject: [CLOCK] },
      { provide: RATE_LIMIT_STORE, useFactory: (clock: Clock) => new MemoryRateLimitStore(clock), inject: [CLOCK] },
      UserRateLimitGuard,
      Background,
      repository<AiUsageStore>(AI_USAGE_STORE, env.adapters, (db) => new MemoryAiUsageStore(db), (c) => new SupabaseAiUsageStore(c)),
      { provide: AI_MODEL, useValue: model },
      {
        provide: AI_GATEWAY,
        useFactory: (store: AiUsageStore, cache: Cache, clock: Clock) => new MeteredAiGateway(model, p.ai, store, cache, clock),
        inject: [AI_USAGE_STORE, CACHE, CLOCK],
      },
      AiUsage,
      { provide: PUSHER, useValue: p.push.provider === 'expo' ? new ExpoPusher(p.push.accessToken) : p.push.provider === 'memory' ? new MemoryPusher() : new NoPusher() },
      { provide: LIVE_ACTIVITIES, useFactory: (clock: Clock): LiveActivityPusher => liveActivityPusher(env, clock), inject: [CLOCK] },
      LiveActivities,
      ...notificationsRepositories(env.adapters),
      ...chatMinimoasRepositories(env.adapters),
      repository<TickRunsRepository>(TICK_RUNS, env.adapters, (db) => new MemoryTickRunsRepository(db), (c) => new SupabaseTickRunsRepository(c)),
      NotificationSettings,
      PushNotifier,
      { provide: NOTIFIER, useExisting: PushNotifier },
      NotificationJobs,
      TickService,
    ];
    const exported = providers.map((x) => (typeof x === 'function' ? x : x.provide));
    return { module: PlateformeModule, global: true, providers, controllers: [NotificationsController, TickController], exports: exported };
  }
}
