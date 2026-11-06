/**
 * Adaptateurs du port `PushSender` (Strategy) :
 *  - `ExpoPushSender` : API Expo Push (`POST /--/api/v2/push/send`, lots de 100, jeton d'accès
 *    `EXPO_ACCESS_TOKEN` en Bearer). Sans jeton d'accès : jamais sélectionné ;
 *  - `LocalInboxPushSender` : boîte de réception lisible en dev (mémoire + fichier JSONL facultatif),
 *    refusée en production ;
 *  - `DisabledPushSender` : production sans clé — rien ne part, la file est marquée FAILED.
 * Aucun adaptateur ne journalise un titre, un corps ou un jeton.
 */
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { DevPushInboxEntry } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { Logger } from '../../../shared/infrastructure/logging/logger.js';
import type { PushMessage, PushSender, PushTicket } from '../application/ports.js';

export class DisabledPushSender implements PushSender {
  readonly kind = 'disabled' as const;
  async send(messages: PushMessage[]): Promise<PushTicket[]> {
    return messages.map(() => ({ ok: false, permanent: true, deviceGone: false }));
  }
}

export class LocalInboxPushSender implements PushSender {
  readonly kind = 'local' as const;
  private readonly memory: DevPushInboxEntry[] = [];
  constructor(
    private readonly clock: Clock,
    private readonly file: string | null,
    private readonly max = 500,
  ) {}

  async send(messages: PushMessage[]): Promise<PushTicket[]> {
    const entries = messages.map((m): DevPushInboxEntry => ({ at: this.clock.now().toISOString(), userId: m.userId, title: m.push.title, body: m.push.body, channelId: m.push.channelId, data: m.push.data }));
    this.memory.push(...entries);
    if (this.memory.length > this.max) this.memory.splice(0, this.memory.length - this.max);
    if (this.file && entries.length) {
      await mkdir(path.dirname(this.file), { recursive: true });
      await appendFile(this.file, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
    }
    return messages.map(() => ({ ok: true }));
  }

  /** Boîte d'une personne : le fichier (partagé API/worker en dev) s'il existe, sinon la mémoire. */
  async inbox(userId: string): Promise<DevPushInboxEntry[]> {
    let all = this.memory;
    if (this.file) {
      try {
        all = (await readFile(this.file, 'utf8'))
          .split('\n')
          .filter(Boolean)
          .map((l) => JSON.parse(l) as DevPushInboxEntry);
      } catch {
        all = this.memory;
      }
    }
    return all.filter((e) => e.userId === userId);
  }

  /** Tests : toute la boîte, puis vidage. */
  all(): DevPushInboxEntry[] {
    return [...this.memory];
  }
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export class ExpoPushSender implements PushSender {
  readonly kind = 'expo' as const;
  constructor(
    private readonly accessToken: string,
    private readonly logger: Logger,
    private readonly baseUrl = 'https://exp.host',
    private readonly timeoutMs = 10_000,
  ) {}

  async send(messages: PushMessage[]): Promise<PushTicket[]> {
    const out: PushTicket[] = [];
    for (let i = 0; i < messages.length; i += 100) out.push(...(await this.batch(messages.slice(i, i + 100))));
    return out;
  }

  private async batch(messages: PushMessage[]): Promise<PushTicket[]> {
    if (messages.length === 0) return [];
    const body = messages.map((m) => ({
      to: m.to,
      title: m.push.title,
      body: m.push.body,
      data: m.push.data,
      sound: 'default',
      channelId: m.push.channelId,
      priority: m.push.urgent ? 'high' : 'default',
      ttl: m.ttlSeconds,
    }));
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/--/api/v2/push/send`, {
        method: 'POST',
        headers: { accept: 'application/json', 'accept-encoding': 'gzip, deflate', 'content-type': 'application/json', authorization: `Bearer ${this.accessToken}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      this.logger.warn({ provider: 'expo', err: (err as Error).name, count: messages.length }, 'push_send_failed');
      return messages.map(() => ({ ok: false, permanent: false, deviceGone: false }));
    }
    if (!res.ok) {
      // 4xx (hors 429) : requête refusée (jeton d'accès invalide…) — permanent ; 5xx/429 : réessai.
      const permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
      this.logger.warn({ provider: 'expo', status: res.status, count: messages.length }, 'push_send_rejected');
      return messages.map(() => ({ ok: false, permanent, deviceGone: false }));
    }
    const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
    const tickets = Array.isArray(json?.data) ? json!.data : [];
    return messages.map((_, i) => {
      const t = tickets[i];
      if (t?.status === 'ok') return { ok: true };
      const code = t?.details?.error;
      return { ok: false, permanent: code === 'DeviceNotRegistered' || code === 'InvalidCredentials' || code === 'MessageTooBig', deviceGone: code === 'DeviceNotRegistered' };
    });
  }
}

export interface PushConfig {
  isProduction: boolean;
  expoAccessToken: string | null;
  expoBaseUrl: string;
  localInboxFile: string | null;
}

/** Variables : `EXPO_ACCESS_TOKEN`, `EXPO_PUSH_API_URL`, `NOTIFICATIONS_LOCAL_INBOX_FILE` (dev). */
export function readPushConfig(env: NodeJS.ProcessEnv, isProduction: boolean): PushConfig {
  const token = env.EXPO_ACCESS_TOKEN?.trim() || null;
  const base = env.EXPO_PUSH_API_URL?.trim() || 'https://exp.host';
  if (isProduction && !base.startsWith('https://')) throw new Error('EXPO_PUSH_API_URL doit être en https en production');
  return { isProduction, expoAccessToken: token, expoBaseUrl: base, localInboxFile: isProduction ? null : env.NOTIFICATIONS_LOCAL_INBOX_FILE?.trim() || null };
}

/** Sélection : Expo si jeton d'accès ; sinon boîte locale hors production ; sinon désactivé. */
export function selectPushSender(cfg: PushConfig, clock: Clock, logger: Logger): PushSender {
  if (cfg.expoAccessToken) return new ExpoPushSender(cfg.expoAccessToken, logger, cfg.expoBaseUrl);
  if (cfg.isProduction) {
    logger.warn({ provider: 'none', missing: 'EXPO_ACCESS_TOKEN' }, 'push_disabled');
    return new DisabledPushSender();
  }
  return new LocalInboxPushSender(clock, cfg.localInboxFile);
}
