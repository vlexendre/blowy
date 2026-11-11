import { randomUUID } from 'node:crypto';
import { type ApiClient, createApiClient } from '@blowy/api-client';
import type { OnboardBody } from '@blowy/contract';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createApp } from '../src/app';
import { loadEnv } from '../src/config/env';
import type { ConsoleMailer } from '../src/integrations/mailer/mailer';
import type { Clock } from '../src/shared/clock';
import { MAILER } from '../src/shared/tokens';

/** Horloge de test : on avance le temps à la main. */
export class FakeClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current);
  }
  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * 86_400_000);
  }
  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export interface TestWorld {
  app: NestExpressApplication;
  baseUrl: string;
  clock: FakeClock;
  outbox: ConsoleMailer['outbox'];
  /** Client authentifié comme une nouvelle personne (ou une personne donnée). */
  client(userId?: string, email?: string): { id: string; api: ApiClient };
  anonymous: ApiClient;
  close(): Promise<void>;
}

/** 11 novembre 2026, 11 h à Paris. */
export const START = new Date('2026-11-11T10:00:00Z');

export async function startWorld(extraEnv: Record<string, string> = {}): Promise<TestWorld> {
  const clock = new FakeClock(START);
  const env = loadEnv({ BLOWY_ENV: 'local', BLOWY_ADAPTERS: 'memory', PORT: '0', CORS_ORIGINS: '', ...extraEnv });
  const app = await createApp(env, { clock, logger: false });
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  const outbox = app.get<ConsoleMailer>(MAILER).outbox;
  return {
    app,
    baseUrl,
    clock,
    outbox,
    client(userId = randomUUID(), email) {
      const token = email ? `test:${userId}:${email}` : `test:${userId}`;
      return { id: userId, api: createApiClient({ baseUrl, getToken: () => token }) };
    },
    anonymous: createApiClient({ baseUrl }),
    close: () => app.close(),
  };
}

export const onboardBody = (overrides: Partial<OnboardBody> = {}): OnboardBody => ({
  displayName: 'Camille',
  birthdate: '1997-05-04',
  city: 'Paris',
  pet: { name: 'Nino', species: 'nino' },
  quiz: { social: 10 },
  ...overrides,
});

/** Envoie un fichier avec un ticket d'envoi (comme le ferait l'app). */
export async function upload(uploadUrl: string, contentType = 'image/jpeg'): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': contentType }, body: new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]) });
  if (!res.ok) throw new Error(`envoi refusé : ${res.status}`);
}

/** Attend une erreur d'API et rend son code. */
export async function errorCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err) return String(err.code);
    throw err;
  }
  throw new Error('une erreur était attendue');
}
