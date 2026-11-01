/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/**
 * Harnais d'intégration : vraie base Postgres (blowy_test), vrai graphe Nest (HTTP réel sur port
 * éphémère), horloge contrôlable, worker exécuté en processus (même code que worker.ts).
 */
import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { createDb, truncateAll, type Db } from '@blowy/database';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../../src/config/env.js';
import { buildApp } from '../../src/bootstrap.js';
import { buildWorkerGraph, type WorkerGraph } from '../../src/jobs/worker-runtime.js';
import { FixedClock } from '../../src/shared/infrastructure/system-clock.js';

export const TEST_DB_URL = process.env.DATABASE_URL_TEST ?? 'postgresql://blowy:blowy@localhost:5432/blowy_test';

export interface Harness {
  app: INestApplication;
  db: Db;
  clock: FixedClock;
  worker: WorkerGraph;
  baseUrl: string;
  close(): Promise<void>;
  reset(): Promise<void>;
  drain(): Promise<number>;
}

export async function startHarness(start = new Date('2026-11-02T10:00:00Z')): Promise<Harness> {
  const config = loadConfig({ BLOWY_ENV: 'test', DATABASE_URL: TEST_DB_URL, LOG_LEVEL: 'silent', AUTH_PROVIDER: 'local', RATE_LIMIT_PER_MINUTE: '100000', BILLING_PROVIDER: 'local_demo' } as NodeJS.ProcessEnv);
  process.env.BILLING_PROVIDER ??= 'local_demo';
  process.env.BLOWY_ENV ??= 'test';
  const db = createDb({ connectionString: TEST_DB_URL, max: 20 });
  const clock = new FixedClock(start);
  const app = await buildApp({ config, redis: null, overrides: { clock, db } });
  await app.listen(0, '127.0.0.1');
  const addr = app.getHttpServer().address() as { port: number };
  const worker = buildWorkerGraph(app);
  return {
    app,
    db,
    clock,
    worker,
    baseUrl: `http://127.0.0.1:${addr.port}`,
    async close() {
      await app.close();
      await db.$disconnect();
    },
    async reset() {
      await truncateAll(db, 'test');
      await db.zone.upsert({ where: { code: 'PARIS_11' }, create: { code: 'PARIS_11', name: 'Paris 11e (test)', timezone: 'Europe/Paris' }, update: { active: true } });
    },
    drain: () => worker.dispatcher.drainAll(clock.now()),
  };
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

/** Client HTTP minimal de test (le client typé est testé séparément dans api-client). */
export class TestClient {
  token: string | null = null;
  userId = '';
  constructor(private readonly h: Harness) {}

  async call<T = any>(method: string, path: string, body?: unknown, opts: { commandId?: string } = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    if (method !== 'GET') headers['idempotency-key'] = opts.commandId ?? randomUUID();
    const res = await fetch(`${this.h.baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  async signIn(key: string) {
    const r = await this.call('POST', '/v1/auth/sessions', { provider: 'local', credential: key, device: { platform: 'ios', label: 'test' } });
    if (r.status !== 201) throw new Error(`signIn ${key}: ${JSON.stringify(r.body)}`);
    this.token = r.body.accessToken;
    this.userId = r.body.userId;
    return r.body;
  }
}

export const VISION = {
  axes: { kindMischief: 0.2, sportyContemplative: -0.1, scienceArt: 0.3, homeAdventure: 0.4 },
  school: 'AUTODIDACTE',
  sunday: 'BRUNCH',
  passions: ['MUSIQUE', 'CUISINE'],
  limit: 'MENTIR',
} as const;

/** Onboarding complet via l'API : profil 18+, préférences, consentements, pet, vérif démo. */
export async function onboard(c: TestClient, key: string, o: { gender: 'WOMAN' | 'MAN'; seeking: ('WOMAN' | 'MAN')[]; birthDate?: string; species?: 'NINO' | 'GASTON' }) {
  await c.signIn(key);
  const ok = (r: ApiResponse, what: string) => {
    if (r.status >= 300) throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body)}`);
    return r.body;
  };
  ok(await c.call('PATCH', '/v1/me', { displayName: key, gender: o.gender, birthDate: o.birthDate ?? '1998-05-10', zoneCode: 'PARIS_11', timezone: 'Europe/Paris' }), 'profile');
  ok(await c.call('PUT', '/v1/preferences/matching', { ageMin: 18, ageMax: 40, maxDistanceKm: 10, seekingGenders: o.seeking, intention: 'LET_IT_HAPPEN', widenConsented: false }), 'prefs');
  ok(await c.call('POST', '/v1/consents', { items: ['TERMS', 'PRIVACY', 'AI_MODERATION'].map((purpose) => ({ purpose, version: '2026-11', granted: true })) }), 'consents');
  const pet = ok(await c.call('POST', '/v1/pets', { name: `Pet-${key}`, species: o.species ?? 'NINO', vision: VISION }), 'pet');
  ok(await c.call('POST', '/v1/verifications', { kind: 'SELFIE_QUALITY' }), 'verify');
  ok(await c.call('POST', '/v1/me/onboarding/complete', {}), 'complete');
  return { petId: pet.id as string };
}
