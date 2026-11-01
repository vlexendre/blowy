/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/** WS Socket.IO : auth, join par appartenance, heartbeat, resync par curseur opaque, révocation au départ. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { attachRealtime } from '../../src/bootstrap.js';
import type { RealtimeGateway } from '../../src/realtime/realtime.gateway.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';
import { matchedPair } from './fixtures.js';

let h: Harness;
let rt: RealtimeGateway;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
  rt = attachRealtime(h.app, []);
});
afterAll(async () => {
  await rt?.close();
  await h?.close();
});

function connect(token: string | null): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = io(h.baseUrl, { path: '/v1/ws', auth: token ? { token } : {}, transports: ['websocket'], reconnection: false });
    s.on('authenticated', () => resolve(s));
    s.on('connect_error', (e) => reject(e));
  });
}
const emit = <T = any>(s: Socket, ev: string, payload: unknown) => new Promise<T>((r) => s.emit(ev, payload, (x: T) => r(x)));

describe('temps réel', () => {
  it('authentifie, filtre les rooms et resynchronise sans vote ni message masqué', async () => {
    await expect(connect(null)).rejects.toBeTruthy();
    const m = await matchedPair(h, 'ws');
    const eve = new TestClient(h);
    await onboard(eve, 'ws.eve', { gender: 'WOMAN', seeking: ['MAN'] });
    const sb = await connect(m.b.token);
    const se = await connect(eve.token);
    expect((await emit(sb, 'heartbeat', {})).serverTime).toBeTruthy();
    expect(await emit(sb, 'join', { room: `conversation:${m.convId}` })).toEqual({ ok: true });
    expect(await emit(se, 'join', { room: `conversation:${m.convId}` })).toEqual({ ok: false, code: 'NOT_FOUND' });

    await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'ws-msg-00001', body: 'Bonjour en direct' });
    await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'ws-msg-00002', body: 'caché [reject]' });
    await h.drain();
    const first = await emit(sb, 'resync', { room: `conversation:${m.convId}`, sinceCursor: null });
    expect(first.ok).toBe(true);
    const types = first.events.map((e: { type: string }) => e.type);
    expect(types).toContain('message.published');
    expect(JSON.stringify(first.events)).not.toContain('[reject]');
    // Curseur opaque : pas de trou après la dernière entrée vue.
    const cursor = first.events.at(-1).projectionCursor;
    const again = await emit(sb, 'resync', { room: `conversation:${m.convId}`, sinceCursor: cursor });
    expect(again.events).toHaveLength(0);

    // Départ : la room est révoquée (diffusion via le relais) et la lecture REST refusée.
    await m.a.call('POST', `/v1/relationships/${m.relId}/leave`, {});
    const revoked = new Promise((r) => sb.on('access.revoked', r));
    await rt.handleRt({ kind: 'revoke', recipients: [m.b.userId], rooms: [`conversation:${m.convId}`] });
    expect(await revoked).toEqual({ room: `conversation:${m.convId}` });
    expect(await emit(sb, 'join', { room: `conversation:${m.convId}` })).toEqual({ ok: false, code: 'NOT_FOUND' });
    expect((await m.b.call('GET', `/v1/conversations/${m.convId}/messages`)).status).toBe(404);
    sb.close();
    se.close();
  });
});
