/**
 * Intégration réelle WS : le RealtimeClient mobile (Socket.IO /v1/ws) rejoint la conversation
 * d'alex ; L. envoie un message ; après modération (worker), alex reçoit les événements par
 * `sync` → `resync` avec curseur (dédupliqués).
 */
import type { WsEnvelope } from '@blowy/api-contract';
import { afterAll, describe, expect, it } from 'vitest';
import { createApi } from '../core/api/client';
import { RealtimeClient, type RealtimeStatus } from '../core/realtime/socket';
import { createAccountRepository } from '../features/account/api/account.repository';
import { createConversationsRepository } from '../features/conversations/api/conversations.repository';
import { createRelationshipsRepository } from '../features/relationships/api/relationships.repository';

const randomUUID = (): string => globalThis.crypto.randomUUID();

const BASE = process.env.BLOWY_API_URL ?? 'http://localhost:3999';
const session = async (credential: string) => {
  let token: string | null = null;
  const api = createApi({ baseUrl: BASE, getToken: () => token, newCommandId: randomUUID });
  token = (await createAccountRepository(api, 'ios').signIn({ provider: 'local', credential }, 'integration')).accessToken;
  return { api, token };
};

describe('temps réel mobile ↔ API locale', () => {
  let client: RealtimeClient | null = null;
  afterAll(() => client?.stop());

  it('alex reçoit le message publié de L. via resync', async () => {
    const alex = await session('alex');
    const l = await session('l');
    const rel = (await createRelationshipsRepository(alex.api).list()).items.find((r) => r.otherPet.name === 'Suzie')!;
    const room = `conversation:${rel.conversationId}`;
    const received: WsEnvelope[] = [];
    const statuses: RealtimeStatus[] = [];
    client = new RealtimeClient({ url: BASE, getToken: async () => alex.token, onEvents: (_r, e) => received.push(...e), onRevoked: () => undefined, onStatus: (s) => statuses.push(s) });
    client.join(room);
    await client.start();
    for (let i = 0; i < 20 && !statuses.includes('online'); i++) await new Promise((r) => setTimeout(r, 200));
    expect(statuses).toContain('online');
    const before = received.length;
    const cid = randomUUID();
    await createConversationsRepository(l.api).send(cid, rel.conversationId!, cid, `Ping temps réel ${cid.slice(0, 6)}`);
    for (let i = 0; i < 50 && received.length === before; i++) await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBeGreaterThan(before);
    const ids = received.map((e) => e.eventId);
    expect(new Set(ids).size).toBe(ids.length);
  }, 30_000);
});
