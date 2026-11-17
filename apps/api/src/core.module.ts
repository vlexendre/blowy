/**
 * Racine de composition des dépendances partagées : configuration, horloge, identifiants,
 * intégrations externes (auth, stockage, e-mail) et dépôts, en version Supabase ou mémoire.
 */
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import type { Db } from './persistence/database.types';
import type { Env } from './config/env';
import { MemoryAuthAdmin, MemoryAuthVerifier, MemoryUserEmails } from './integrations/auth/memory-auth';
import { SupabaseAuthAdmin, SupabaseAuthVerifier, SupabaseUserEmails } from './integrations/auth/supabase-auth';
import {
  APPLE_TOKEN_CLIENT,
  APPLE_TOKEN_STORE,
  AppleIdTokenClient,
  AppleRevocation,
  DisabledAppleTokenClient,
  MemoryAppleTokenClient,
  MemoryAppleTokenStore,
  SupabaseAppleTokenStore,
} from './integrations/auth/apple-revocation';
import { ConsoleMailer, ResendMailer } from './integrations/mailer/mailer';
import { Notifier } from './integrations/mailer/notifier';
import { MemoryStorage } from './integrations/storage/memory-storage';
import type { PublicUrl } from './integrations/storage/ports';
import { SupabaseStorage } from './integrations/storage/supabase-storage';
import { encountersRepositories } from './modules/encounters/infrastructure/providers';
import { linksRepositories } from './modules/links/infrastructure/providers';
import { meRepositories } from './modules/me/infrastructure/providers';
import { petsRepositories } from './modules/pets/infrastructure/providers';
import { safetyRepositories } from './modules/safety/infrastructure/providers';
import { rituelsRepositories } from './modules/rituels/infrastructure/providers';
import { aiConsentsRepositories } from './modules/ai-consents/infrastructure/providers';
import { visionProviders } from './modules/vision/infrastructure/providers';
import { billingProviders } from './modules/billing/infrastructure/providers';
import { adminProviders } from './modules/admin/infrastructure/providers';
import { Audience } from './modules/safety/application/audience';
import { retentionProviders } from './modules/retention/infrastructure/providers';
import { groupsRepositories } from './modules/groups/infrastructure/providers';
import { fideliteProviders } from './modules/fidelite/infrastructure/providers';
import { growthProviders } from './modules/growth/infrastructure/providers';
import { MemoryDb } from './persistence/memory-db';
import { createServiceClient } from './persistence/supabase';
import { type Clock, ShiftedClock, systemClock } from './shared/clock';
import { cryptoIds } from './shared/ids';
import {
  AUTH_ADMIN,
  AUTH_VERIFIER,
  CLOCK,
  ENV,
  IDS,
  MAILER,
  MEMORY_DB,
  PUBLIC_URL,
  STORAGE,
  SUPABASE,
  USER_EMAILS,
} from './shared/tokens';

export interface CoreOverrides {
  clock?: Clock;
}

@Module({})
export class CoreModule {
  static forRoot(env: Env, overrides: CoreOverrides = {}): DynamicModule {
    const publicUrl: PublicUrl = { current: env.apiUrl };
    const providers: Provider[] = [
      { provide: ENV, useValue: env },
      { provide: CLOCK, useValue: overrides.clock ?? (devTools(env) ? new ShiftedClock() : systemClock) },
      { provide: IDS, useValue: cryptoIds },
      { provide: PUBLIC_URL, useValue: publicUrl },
      {
        provide: MAILER,
        useFactory: () => (env.resendApiKey ? new ResendMailer(env.resendApiKey, env.mailFrom) : new ConsoleMailer()),
      },
      Notifier,
      ...(env.adapters === 'memory' ? memoryAdapters() : supabaseAdapters(env)),
      ...meRepositories(env.adapters),
      ...petsRepositories(env.adapters),
      ...linksRepositories(env.adapters),
      ...encountersRepositories(env.adapters),
      ...safetyRepositories(env.adapters),
      ...rituelsRepositories(env.adapters),
      ...aiConsentsRepositories(env.adapters),
      ...visionProviders(env.adapters),
      ...billingProviders(env.adapters),
      ...adminProviders(env.adapters),
      ...retentionProviders(env.adapters),
      ...groupsRepositories(env.adapters),
      ...fideliteProviders(env.adapters),
      // Croissance : source d'arrivée, étapes de l'entonnoir, compteurs (docs/VIRALITE.md).
      ...growthProviders(env.adapters),
      // Qui est « utilisable » pour qui (supprimé, suspendu, bloqué, discret) : une seule règle, partout.
      Audience,
      // Sign in with Apple : jetons gardés à la connexion, révoqués à la suppression du compte.
      {
        provide: APPLE_TOKEN_CLIENT,
        useFactory: (clock: Clock) => {
          const cfg = env.appleSignIn;
          if (cfg.provider === 'apple' && cfg.apple) return new AppleIdTokenClient(cfg.apple, clock);
          return cfg.provider === 'memory' ? new MemoryAppleTokenClient(env.facturationAdmin.apple.bundleId) : new DisabledAppleTokenClient();
        },
        inject: [CLOCK],
      },
      AppleRevocation,
    ];
    const exported = providers.map((p) => (typeof p === 'function' ? p : p.provide));
    return { module: CoreModule, global: true, providers, exports: exported };
  }
}

function memoryAdapters(): Provider[] {
  return [
    { provide: MEMORY_DB, useValue: new MemoryDb() },
    { provide: AUTH_VERIFIER, useFactory: (db: MemoryDb) => new MemoryAuthVerifier(db), inject: [MEMORY_DB] },
    { provide: AUTH_ADMIN, useFactory: (db: MemoryDb) => new MemoryAuthAdmin(db), inject: [MEMORY_DB] },
    { provide: USER_EMAILS, useFactory: (db: MemoryDb) => new MemoryUserEmails(db), inject: [MEMORY_DB] },
    { provide: STORAGE, useFactory: (url: PublicUrl, clock: Clock) => new MemoryStorage(url, clock), inject: [PUBLIC_URL, CLOCK] },
    { provide: APPLE_TOKEN_STORE, useFactory: (db: MemoryDb) => new MemoryAppleTokenStore(db), inject: [MEMORY_DB] },
  ];
}

function supabaseAdapters(env: Env): Provider[] {
  const config = env.supabase;
  if (!config) throw new Error('configuration Supabase absente');
  return [
    { provide: SUPABASE, useValue: createServiceClient(config.url, config.serviceRoleKey) },
    { provide: AUTH_VERIFIER, useFactory: (c: Db, clock: Clock) => new SupabaseAuthVerifier(c, clock), inject: [SUPABASE, CLOCK] },
    { provide: AUTH_ADMIN, useFactory: (c: Db) => new SupabaseAuthAdmin(c), inject: [SUPABASE] },
    { provide: USER_EMAILS, useFactory: (c: Db) => new SupabaseUserEmails(c), inject: [SUPABASE] },
    { provide: STORAGE, useFactory: (c: Db) => new SupabaseStorage(c), inject: [SUPABASE] },
    { provide: APPLE_TOKEN_STORE, useFactory: (c: Db) => new SupabaseAppleTokenStore(c), inject: [SUPABASE] },
  ];
}

/** Outils de développement (médias imités, avance du temps) : seulement en local avec les adaptateurs mémoire. */
export const devTools = (env: Env): boolean => env.env === 'local' && env.adapters === 'memory';
