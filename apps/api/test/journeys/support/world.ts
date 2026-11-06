/**
 * « Monde » d'un parcours : l'API Blowy réelle (graphe Nest complet de `buildApp`, HTTP sur port
 * éphémère, gateway Socket.IO /v1/ws montée par `attachRealtime`), le worker exécuté en processus
 * (même graphe que `worker.ts` : relais outbox + effets + jobs), et une horloge contrôlable.
 *
 * Horloge : l'API accepte un `Clock` injecté (override `clock` de CoreModule) → le temps métier
 * (TTL, expirations, jours de récompense…) avance avec `world.advance()`. Limites constatées et
 * documentées dans le rapport : quelques chemins lisent encore `new Date()` (heartbeat WS,
 * jobs planifiés BullMQ de `worker.ts`, téléchargement d'export) — ici les jobs sont appelés
 * explicitement avec l'horloge du monde.
 *
 * Temps réel : en production le worker publie sur Redis et l'API relaie. Ici le même effet
 * outbox (`RealtimeRelayEffect`) appelle directement `gateway.handleRt` (transport en mémoire,
 * même message `RtMessage`).
 *
 * Isolation : chaque parcours a SA zone de matching (code unique) → les personnes d'une histoire
 * ne sont jamais proposées à celles d'une autre, sans TRUNCATE entre fichiers.
 */
import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { createDb, type Db } from '@blowy/database';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConfig } from '../../../src/config/env.js';
import { attachRealtime, buildApp } from '../../../src/bootstrap.js';
import { buildWorkerGraph, type WorkerGraph } from '../../../src/jobs/worker-runtime.js';
import { FixedClock } from '../../../src/shared/infrastructure/system-clock.js';
import { RealtimeRelayEffect } from '../../../src/realtime/redis-realtime.publisher.js';
import type { RealtimeGateway } from '../../../src/realtime/realtime.gateway.js';
import { JOURNEYS_DB_URL } from './global-setup.js';

export const WEBHOOK_AUTH = 'Bearer journeys-local-webhook-secret-0123456789';

export interface World {
  app: INestApplication;
  db: Db;
  clock: FixedClock;
  worker: WorkerGraph;
  rt: RealtimeGateway;
  baseUrl: string;
  zone: string;
  storageRoot: string;
  /** Vide l'outbox (modération, projections WS, consommateurs) à l'heure du monde. */
  drain(): Promise<number>;
  /** Avance l'horloge puis vide l'outbox. */
  advance(ms: number): Promise<void>;
  /** Exécute un job planifié nommé (ex. `matching.daily`) à l'heure du monde. */
  runJob(name: string): Promise<unknown>;
  close(): Promise<void>;
}

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

/**
 * Démarre le monde. `zone` : code de zone propre au parcours. L'horloge part de l'heure RÉELLE :
 * certains chemins (ex. capacité dans `accept-proposal`, ACL de session d'upload) lisent encore
 * `new Date()` au lieu du Clock injecté ; partir d'une heure fictive fausserait ces contrôles.
 */
export async function startWorld(zone: string, start = new Date(Math.floor(Date.now() / MIN) * MIN)): Promise<World> {
  const storageRoot = mkdtempSync(path.join(tmpdir(), 'blowy-journeys-'));
  // Configuration économie lue dans process.env (agent G) : démo locale étiquetée + webhook local.
  process.env.BLOWY_ENV ??= 'test';
  process.env.BILLING_PROVIDER = 'local_demo';
  process.env.REVENUECAT_WEBHOOK_AUTH = WEBHOOK_AUTH;
  const config = loadConfig({
    BLOWY_ENV: 'test',
    DATABASE_URL: JOURNEYS_DB_URL,
    LOG_LEVEL: 'silent',
    AUTH_PROVIDER: 'local',
    RATE_LIMIT_PER_MINUTE: '100000',
    BILLING_PROVIDER: 'local_demo',
    REVENUECAT_WEBHOOK_AUTH: WEBHOOK_AUTH,
    STORAGE_DRIVER: 'fs',
    STORAGE_FS_ROOT: storageRoot,
    PUBLIC_API_URL: 'http://127.0.0.1',
  } as NodeJS.ProcessEnv);
  const db = createDb({ connectionString: JOURNEYS_DB_URL, max: 20 });
  const clock = new FixedClock(start);
  const app = await buildApp({ config, redis: null, overrides: { clock, db } });
  await app.listen(0, '127.0.0.1');
  const rt = attachRealtime(app, []);
  const relay = new RealtimeRelayEffect(async (m) => rt.handleRt(m));
  const worker = buildWorkerGraph(app, [relay]);
  const addr = app.getHttpServer().address() as { port: number };
  await seedReferenceData(db, zone);
  const w: World = {
    app,
    db,
    clock,
    worker,
    rt,
    baseUrl: `http://127.0.0.1:${addr.port}`,
    zone,
    storageRoot,
    async drain() {
      let total = 0;
      // Plusieurs passes : un effet peut émettre de nouveaux événements (ex. modération → deliver).
      for (let i = 0; i < 6; i++) {
        const n = await worker.dispatcher.drainAll(clock.now());
        total += n;
        if (n === 0) break;
      }
      // Laisse aux sockets le temps de recevoir `sync` puis de resynchroniser.
      await new Promise((r) => setTimeout(r, 60));
      return total;
    },
    async advance(ms: number) {
      clock.advance(ms);
      await w.drain();
    },
    async runJob(name: string) {
      const job = worker.jobs.find((j) => j.name === name);
      if (!job) throw new Error(`job inconnu : ${name} (connus : ${worker.jobs.map((j) => j.name).join(', ')})`);
      const r = await job.run(clock.now());
      await w.drain();
      return r;
    },
    async close() {
      await rt.close().catch(() => undefined);
      await app.close();
      await db.$disconnect();
    },
  };
  return w;
}

/**
 * Référentiels nécessaires (identiques au seed §20) : zone propre au parcours, catalogue,
 * produits store. Aucun utilisateur n'est créé ici : toutes les personnes passent par l'API.
 */
async function seedReferenceData(db: Db, zone: string) {
  await db.zone.upsert({ where: { code: zone }, create: { code: zone, name: `Zone parcours ${zone}`, timezone: 'Europe/Paris' }, update: { active: true } });
  await db.catalogItem.createMany({
    data: [
      { id: 'streak_freeze', kind: 'STREAK_FREEZE', priceCoins: 200 },
      { id: 'visibility_boost', kind: 'VISIBILITY_BOOST', priceCoins: 300 },
      { id: 'scarf_red', kind: 'ACCESSORY', priceCoins: 120 },
    ],
    skipDuplicates: true,
  });
  await db.storeProduct.createMany({
    data: [
      { id: 'blowy_plus_annual', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'blowy_plus_weekly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'coins_500', kind: 'CONSUMABLE_COINS', coinsAmount: 500 },
    ],
    skipDuplicates: true,
  });
}
