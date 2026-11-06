/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 6 — Concurrence. Jade utilise son iPhone et son iPad en même temps ; Omar lui écrit.
 * Double tap, renvoi hors ligne (même commandId), conflit d'idempotence, déplacements
 * simultanés, iPad hors ligne puis resynchronisation par curseur WS, révocation d'appareil.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { attempt, cast, Device, type Person } from './support/actor.js';
import { story } from './support/story.js';
import { MIN, startWorld, type World } from './support/world.js';

let w: World;
let jade: Person;
let omar: Person;
let iphone: Device;
let ipad: Device;
let relId = '';
let convId = '';
let ipadCursor: string | null = null;
const S = story('concurrence', 'Concurrence : deux téléphones, idempotence, hors ligne, resync WS');

beforeAll(async () => {
  w = await startWorld('J_CONCURRENCE');
});
afterAll(async () => w?.close());

const room = () => `conversation:${convId}`;

describe('Concurrence', () => {
  S.step('Jade est connectée sur iPhone et iPad (deux sessions listées) ; elle et Omar se rencontrent', async () => {
    [jade, omar] = await cast(w, [
      { key: 'jade', displayName: 'Jade', gender: 'WOMAN', seeking: ['MAN'] },
      { key: 'omar', displayName: 'Omar', gender: 'MAN', seeking: ['WOMAN'] },
    ]);
    iphone = await jade.device('iphone');
    ipad = await jade.device('ipad');
    await omar.device('omar-phone');
    const sessions = await jade.client.auth.sessions();
    expect(sessions.items.length).toBeGreaterThanOrEqual(2);
    const feed = await jade.client.matching.requestOnboardingBatch();
    const p = feed.items.find((i) => i.otherPet.id === omar.petId)!;
    // Double tap « accepter » sur deux appareils (deux commandes) : une seule acceptation.
    await Promise.all([jade.client.matching.accept(p.id), jade.client.matching.accept(p.id)]);
    const r = await omar.client.matching.accept(p.id);
    expect(r.status).toBe('MATCHED');
    relId = r.relationshipId!;
    convId = (await jade.client.relationships.get(relId)).conversationId!;
    expect(await w.db.relationshipContext.count({ where: { type: 'DATE', sides: { some: { userId: jade.userId } } } })).toBe(1);
    for (const d of [iphone, ipad]) expect(await d.join(room())).toBe(true);
    expect(await omar.phone.join(room())).toBe(true);
  });

  S.step('Omar écrit : les DEUX appareils de Jade reçoivent le message, une seule fois chacun', async () => {
    await omar.say(convId, 'Hello Jade', 'omar-0001');
    await w.drain();
    for (const d of [iphone, ipad]) {
      expect(await d.waitFor((e) => e.type === 'message.published')).toBeTruthy();
      expect(d.events.filter((e) => e.type === 'message.published')).toHaveLength(1);
    }
    const s = await ipad.emit<any>('resync', { room: room(), sinceCursor: null });
    ipadCursor = s.events.at(-1).projectionCursor;
  });

  S.step('Jade envoie le même message depuis ses deux appareils (même clientMessageId, renvoi hors ligne) : un seul message', async () => {
    const [a, b] = await Promise.all([jade.say(convId, 'Coucou Omar', 'jade-dup-0001'), jade.say(convId, 'Coucou Omar', 'jade-dup-0001')]);
    expect(a.ok || b.ok).toBe(true);
    const c = await jade.say(convId, 'Coucou Omar', 'jade-dup-0001');
    await w.drain();
    expect(await w.db.message.count({ where: { conversationId: convId, clientMessageId: 'jade-dup-0001' } })).toBe(1);
    if (c.ok) expect(c.data.id).toBe(a.ok ? a.data.id : b.data.id);
    const other = await jade.say(convId, 'Autre texte', 'jade-dup-0001');
    if (other.ok) S.note(`Même clientMessageId avec un AUTRE texte : 200 (renvoie ${other.data.body === 'Coucou Omar' ? 'l’ancien message' : 'un nouveau message'}) au lieu de 409 CLIENT_MESSAGE_ID_REUSED documenté — un brouillon modifié hors ligne est perdu silencieusement.`);
    expect(other.status).toBe(409);
    const theirs = ((await omar.client.conversations.messages(convId)) as any).items.filter((m: any) => m.body === 'Coucou Omar');
    expect(theirs).toHaveLength(1);
  });

  S.step('Rejeu d’une commande (même Idempotency-Key) : même résultat, aucun gain doublé ; payload différent → 409', async () => {
    const cid = randomUUID();
    const a = await jade.client.pets.act(jade.petId, { action: 'FEED' }, { commandId: cid });
    const b = await jade.client.pets.act(jade.petId, { action: 'FEED' }, { commandId: cid });
    expect(b.pet.version).toBe(a.pet.version);
    expect((await jade.client.pets.mine()).version).toBe(a.pet.version);
    const c = await attempt(() => jade.client.pets.act(jade.petId, { action: 'HEAL' }, { commandId: cid }));
    expect(c.status).toBe(409);
    expect(c.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  S.step('Déplacements simultanés depuis les deux appareils : un seul lieu officiel, aucun refus', async () => {
    const [a, b] = await Promise.all([
      attempt(() => jade.client.pets.move(jade.petId, { destination: 'DATE_SPOT', relationshipId: relId })),
      attempt(() => jade.client.pets.move(jade.petId, { destination: 'HOME' })),
    ]);
    expect(a.ok && b.ok, `${a.status} ${a.code} / ${b.status} ${b.code}`).toBe(true);
    const loc = (await jade.client.pets.mine()).location;
    const last = [a, b].map((x) => (x.data as any)?.location?.kind);
    expect(last).toContain(loc.kind); // le lieu officiel est l'un des deux, jamais un état mixte
    expect(await w.db.virtualLocation.count({ where: { petId: jade.petId } })).toBe(1);
  });

  S.step('L’iPad passe hors ligne ; Omar envoie 3 messages ; l’iPhone les reçoit en direct', async () => {
    ipad.disconnect();
    for (let i = 1; i <= 3; i++) {
      await omar.say(convId, `Message hors ligne ${i}`, `omar-off-${i}`);
      w.clock.advance(MIN);
    }
    await w.drain();
    expect(iphone.events.filter((e) => e.type === 'message.published' && /hors ligne/.test(JSON.stringify(e.payload)))).toHaveLength(3);
  });

  S.step('L’iPad revient : resync depuis son curseur → exactement les 3 messages manqués, dans l’ordre, sans doublon', async () => {
    const back = await new Device(w, 'ipad', ipad.token, ipad.sessionId).connect();
    expect(await back.join(room(), ipadCursor)).toBe(true);
    const missed = back.events.filter((e) => e.type === 'message.published');
    const bodies = missed.map((e) => (e.payload as any).message?.body);
    expect(bodies.filter((b) => /hors ligne/.test(b ?? ''))).toEqual(['Message hors ligne 1', 'Message hors ligne 2', 'Message hors ligne 3']);
    expect(new Set(missed.map((e) => e.eventId)).size).toBe(missed.length);
    const again = await back.emit<any>('resync', { room: room(), sinceCursor: back.sync!.cursorOf(room()) });
    expect(again.events).toHaveLength(0);
    ipad = back;
  });

  S.step('Messages écrits hors ligne par Jade (file d’envoi) : rien chez Omar avant la modération', async () => {
    const queued = ['Désolée j’étais dans le métro', 'On se parle ce soir ?'];
    for (const [i, b] of queued.entries()) await jade.say(convId, b, `jade-offline-${i}`);
    const pre = ((await omar.client.conversations.messages(convId)) as any).items.map((m: any) => m.body);
    expect(pre).not.toContain(queued[0]);
    await w.drain();
    const post = ((await omar.client.conversations.messages(convId)) as any).items.map((m: any) => m.body);
    expect(post).toEqual(expect.arrayContaining(queued));
  });

  S.step('Lecture sur l’iPhone : l’état « lu » est partagé avec l’iPad', async () => {
    const page = (await jade.client.conversations.messages(convId)) as any;
    const last = Math.max(...page.items.map((m: any) => m.seq ?? 0));
    await jade.client.conversations.markRead(convId, last);
    const conv = (await jade.client.conversations.list()).items.find((c) => c.id === convId)!;
    expect(conv.lastReadSeq).toBe(last);
  });

  S.step('Depuis l’iPhone, Jade déconnecte l’iPad : HTTP refusé ET socket WS fermée', async () => {
    const r = await jade.client.auth.revoke(ipad.sessionId).catch((e) => e);
    void r;
    const res = await jade.raw('GET', '/v1/me', undefined, {}, ipad.token);
    expect(res.status).toBe(401);
    await w.drain();
    await new Promise((x) => setTimeout(x, 200));
    if (!ipad.disconnected) S.note('Révocation d’une session : l’iPad ne peut plus appeler l’API mais sa socket WS reste connectée et continue de recevoir les messages (aucun `realtime.disconnect` à la révocation d’appareil).');
    await omar.say(convId, 'Tu es là ?', 'omar-after-revoke');
    await w.drain();
    const leaked = ipad.events.some((e) => JSON.stringify(e.payload).includes('Tu es là ?'));
    expect(leaked, 'la socket révoquée reçoit encore des messages').toBe(false);
  });
});
