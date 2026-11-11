/**
 * Racine de composition des dépendances partagées : configuration, horloge, identifiants,
 * intégrations externes (auth, stockage, e-mail) et dépôts, en version Supabase ou mémoire.
 */
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import type { Db } from './persistence/database.types';
import type { Env } from './config/env';
import { MemoryAuthAdmin, MemoryAuthVerifier, MemoryUserEmails } from './integrations/auth/memory-auth';
import { SupabaseAuthAdmin, SupabaseAuthVerifier, SupabaseUserEmails } from './integrations/auth/supabase-auth';
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
import { MemoryDb } from './persistence/memory-db';
import { createServiceClient } from './persistence/supabase';
import { type Clock, systemClock } from './shared/clock';
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
      { provide: CLOCK, useValue: overrides.clock ?? systemClock },
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
  ];
}
