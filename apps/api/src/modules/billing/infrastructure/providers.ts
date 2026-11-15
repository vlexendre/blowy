import type { Provider } from '@nestjs/common';
import type { Env } from '../../../config/env';
import { type Adapters, repository } from '../../../persistence/repository';
import { ENV } from '../../../shared/tokens';
import type { Billing, StoreNotificationsRepository, SubscriptionsRepository } from '../ports';
import { APPLE_BILLING, GOOGLE_BILLING, STORE_NOTIFICATIONS, SUBSCRIPTIONS } from '../tokens';
import { AppleBilling } from './apple/app-store-verifier';
import { GooglePlayBilling } from './google-play-billing';
import { MemoryBilling } from './memory-billing';
import { MemoryStoreNotificationsRepository, MemorySubscriptionsRepository } from './memory-subscriptions.repository';
import { SupabaseStoreNotificationsRepository, SupabaseSubscriptionsRepository } from './supabase-subscriptions.repository';

/** Dépôts et adaptateurs de Blowy+ : Apple réel avec Supabase, mémoire sinon ; Google Play réservé. */
export const billingProviders = (adapters: Adapters): Provider[] => [
  repository<SubscriptionsRepository>(SUBSCRIPTIONS, adapters, (db) => new MemorySubscriptionsRepository(db), (c) => new SupabaseSubscriptionsRepository(c)),
  repository<StoreNotificationsRepository>(STORE_NOTIFICATIONS, adapters, (db) => new MemoryStoreNotificationsRepository(db), (c) => new SupabaseStoreNotificationsRepository(c)),
  {
    provide: APPLE_BILLING,
    useFactory: (env: Env): Billing => {
      const { apple } = env.facturationAdmin;
      return adapters === 'memory' ? new MemoryBilling(apple.bundleId) : new AppleBilling({ bundleId: apple.bundleId, appAppleId: apple.appAppleId, acceptSandbox: apple.acceptSandbox });
    },
    inject: [ENV],
  },
  { provide: GOOGLE_BILLING, useValue: new GooglePlayBilling() },
];
