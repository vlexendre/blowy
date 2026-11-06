/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — J2 « cinq inconnus un jeudi » (spec-v5 §11.3, V5.1, V5.2) : 5 personnes de Paris 11e
 * demandent une sortie → composition → aperçu anonyme → « Je viens » → chat de groupe → lieu la
 * veille 18 h → visages 3 h avant → check-in → votes groupés secrets → dépouillement à date fixe :
 * PLUS/PLUS → duo, PLUS/FRIEND → bande, FRIEND/FRIEND → bande, PLUS incompatible → ami·e en silence,
 * PLUS/NO → rien des deux côtés. Aucun événement à la saisie d'un vote ; jamais de compteur.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { Observers } from './support/observers.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { accept, at, checkIn, city, CYCLE, leaksIn, outing, vote, votes, v5Person, type City, venueCodeOf } from './support/v5.js';

let w: World;
let c: City;
let lea: Person, malo: Person, sarah: Person, hugo: Person, ines: Person;
let all: Person[] = [];
let outingId = '';
let obs: Observers;
const S = story('v5-cinq-inconnus', 'V5 : cinq inconnus un jeudi (composition → verrou → check-in → votes → bande)');

beforeAll(async () => {
  w = await startWorld('J_V5_JEUDI', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-11', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Cinq inconnus un jeudi', () => {
  S.step('Cinq personnes vérifiées, avec photo et intentions secrètes, demandent la sortie de la semaine', async () => {
    lea = await v5Person(w, { key: 'v5.lea', displayName: 'Léa', petName: 'Suzie', gender: 'WOMAN', seeking: [], looking: 'BOTH', romance: ['MAN'] }, c);
    malo = await v5Person(w, { key: 'v5.malo', displayName: 'Malo', petName: 'Gaston', gender: 'MAN', seeking: [], looking: 'FRIENDS' }, c);
    sarah = await v5Person(w, { key: 'v5.sarah', displayName: 'Sarah', petName: 'Pia', gender: 'WOMAN', seeking: [], looking: 'BOTH', romance: ['MAN'] }, c);
    hugo = await v5Person(w, { key: 'v5.hugo', displayName: 'Hugo', petName: 'Biscuit', gender: 'MAN', seeking: [], looking: 'BOTH', romance: ['WOMAN'] }, c);
    ines = await v5Person(w, { key: 'v5.ines', displayName: 'Inès', petName: 'Pompon', gender: 'WOMAN', seeking: [], looking: 'FRIENDS' }, c);
    all = [lea, malo, sarah, hugo, ines];
    obs = new Observers(all);
    for (const p of all) expect((await p.call('GET', '/v1/outings/week')).data.phase).toBe('REQUEST_OPEN');
  });

  S.step('Composition du mardi : un seul groupe de 5 ; chacun reçoit son invitation (WS user:) ; aperçu anonyme sans prénom, photo ni lieu', async () => {
    obs.mark();
    await at(w, CYCLE.monday);
    for (const p of all) expect((await p.call('PUT', `/v1/outings/requests/${CYCLE.weekKey}`, {})).ok).toBe(true);
    await at(w, CYCLE.composed);
    await w.runJob('outings.compose');
    expect(await obs.waitAll('outing.invited', all)).toEqual([]);
    outingId = (await lea.call('GET', '/v1/outings/week')).data.myOutingId;
    expect(outingId).toBeTruthy();
    const v = (await outing(lea, outingId)).data;
    expect(v.status).toBe('PROPOSED');
    expect(v.preview).toMatchObject({ size: 5, genders: { WOMAN: 3, MAN: 2 }, teams: 0 });
    expect(v.preview.ageMin % 1).toBe(0);
    expect(v.members).toHaveLength(4);
    expect(v.members.some((m: any) => m.firstName || m.photo || m.ageRange)).toBe(false);
    expect(v.venue).toBeUndefined();
    // V5.4 A.1 : un seul homme cherchant une histoire compatible (Hugo) — la garantie n'est pas tenue pour Léa,
    // mais AUCUNE vue ne le dit plus (ni « sortie entre amis pour toi », ni `storyMatch`) : rien qui désigne quelqu'un.
    expect(Object.keys(v)).not.toContain('storyMatch');
    expect(JSON.stringify(v)).not.toMatch(/storyMatch|FRIENDS_ONLY|entre amis|compatib/i);
    expect(Object.keys((await outing(malo, outingId)).data)).not.toContain('storyMatch');
    expect(leaksIn(v, ['Malo', 'Sarah', 'Hugo', 'Inès'])).toEqual([]);
  });

  S.step('« Je viens » : double tap idempotent ; à 4 confirmé·es le chat de groupe s’ouvre ; un·e invité·e ne peut pas rejoindre la salle outing:', async () => {
    const key = crypto.randomUUID();
    const a1 = await accept(lea, outingId, key);
    const a2 = await accept(lea, outingId, key);
    expect(a1.ok && a2.ok).toBe(true);
    expect(a2.data).toEqual(a1.data);
    expect(a1.data.seat.funding).toBe('FREE_FIRST');
    for (const p of [malo, sarah, hugo]) expect((await accept(p, outingId)).ok).toBe(true);
    await w.drain();
    const v = (await outing(lea, outingId)).data;
    expect(v.status).toBe('FORMING');
    expect(v.conversationId).toBeTruthy();
    expect(await lea.phone.join(`outing:${outingId}`)).toBe(true);
    expect(await ines.phone.join(`outing:${outingId}`)).toBe(false);
    expect((await outing(ines, outingId)).data.conversationId).toBeUndefined();
    expect((await accept(ines, outingId)).ok).toBe(true);
    await w.drain();
    for (const p of all) expect(await p.phone.join(`outing:${outingId}`)).toBe(true);
    // V5.3 B.7 : avant la confirmation, chacun·e n'est vu·e que par son pet (ni prénom, ni tranche, ni fiabilité).
    const hv = (await outing(hugo, outingId)).data;
    expect(hv.members).toHaveLength(4);
    expect(hv.members.some((m: any) => m.firstName || m.ageRange || m.reliability || m.photo)).toBe(false);
  });

  S.step('Chat de groupe : réponse « 3 mots » modérée et publiée ; plus de 3 mots refusé', async () => {
    const conv = (await outing(lea, outingId)).data.conversationId;
    const okMsg = await lea.call('POST', `/v1/conversations/${conv}/messages`, { clientMessageId: 'lea-3m-1', body: 'brunch vélo soleil', promptId: 'icebreaker.prompt.sunday' });
    expect(okMsg.ok, JSON.stringify(okMsg.data)).toBe(true);
    const bad = await malo.call('POST', `/v1/conversations/${conv}/messages`, { clientMessageId: 'malo-3m-1', body: 'un deux trois quatre', promptId: 'icebreaker.prompt.sunday' });
    expect(bad.status).toBe(400);
    await w.drain();
    const msgs = await malo.messages(conv);
    expect(JSON.stringify(msgs.data)).toContain('brunch vélo soleil');
    // §2.8 / V5.3 B.7 : avant la confirmation, le message est signé par le PET de Léa, jamais par son prénom.
    const m = (msgs.data as any).items.find((x: any) => x.body === 'brunch vélo soleil');
    expect(m.author).toEqual({ pet: { name: 'Suzie', species: expect.any(String) } });
    const ev = await malo.phone.waitFor((e) => e.type === 'message.published' && (e.payload as any)?.message?.body === 'brunch vélo soleil', 500);
    if (ev) expect((ev.payload as any).message.author).toEqual({ pet: { name: 'Suzie', species: expect.any(String) } });
  });

  S.step('Veille 18 h : lieu, prénoms, tranches et fiabilité révélés aux confirmé·es ; visages pas avant J − 3 h, puis à tous en même temps', async () => {
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    const v = (await outing(sarah, outingId)).data;
    expect(v.status).toBe('CONFIRMED');
    expect(v.venue).toMatchObject({ name: 'Café Paris 11e', bookingName: 'Blowy' });
    expect(v.members.find((m: any) => m.firstName === 'Léa')).toMatchObject({ ageRange: expect.any(String), reliability: 'NEWCOMER' });
    expect(v.members.some((m: any) => m.photo)).toBe(false);
    // À la confirmation, le chat signe aussi par le prénom.
    const conv = v.conversationId;
    const signed = ((await sarah.messages(conv)).data as any).items.find((x: any) => x.body === 'brunch vélo soleil');
    expect(signed.author).toMatchObject({ pet: { name: 'Suzie' }, firstName: 'Léa' });
    await at(w, CYCLE.faces);
    for (const p of all) {
      const pv = (await outing(p, outingId)).data;
      expect(pv.members.filter((m: any) => m.photo)).toHaveLength(4);
      expect(pv.knowsSomeoneAvailable).toBe(true);
    }
  });

  S.step('Check-in par le code du chevalet UNIQUEMENT (V5.5 D-062) : position refusée, mauvais code refusé ; « arrivé·e » visible au groupe', async () => {
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    const geo = await malo.call('POST', `/v1/outings/${outingId}/check-in`, { method: 'GEO', lat: 48.9, lng: 2.4, accuracyM: 20 });
    expect(geo.status).toBe(400);
    const good = await venueCodeOf(w, outingId);
    const bad = await checkIn(malo, outingId, good === '0000' ? '0001' : '0000');
    expect([bad.status, bad.data.detailsSafe?.reason]).toEqual([412, 'CHECKIN_CODE_INVALID']);
    obs.mark();
    for (const p of all) expect((await checkIn(p, outingId)).data).toEqual({ result: 'ACCEPTED' });
    await w.drain();
    expect(await obs.waitAll('outing.checkin_updated', [lea])).toEqual([]);
    const rows = await w.db.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM information_schema.columns WHERE table_name IN ('OutingCheckIn','OutingCheckInAttempt') AND column_name IN ('lat','lng','latitude','longitude')`;
    expect(Number(rows[0]!.n)).toBe(0);
  });

  S.step('Fin de la sortie : tous présent·es, votes ouverts aux présent·es, fiabilité 1/1, souvenir du pet', async () => {
    obs.mark();
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    expect(await obs.waitAll('outing.votes_opened', all)).toEqual([]);
    expect(await obs.waitAll('reliability.updated', all)).toEqual([]);
    expect((await lea.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 1, total: 1, newcomer: false });
    const lv = (await votes(lea, outingId)).data;
    expect(lv.targets).toHaveLength(4);
    expect(lv.targets.every((t: any) => t.myChoice === 'NO' && t.mutual === undefined)).toBe(true);
    expect(lv.closed).toBe(false);
  });

  S.step('Votes groupés secrets : un seul écran, « non » par défaut ; AUCUN événement émis à la saisie', async () => {
    const id = (p: Person) => p.userId;
    obs.mark();
    expect((await vote(lea, outingId, { [id(hugo)]: 'PLUS', [id(sarah)]: 'PLUS', [id(malo)]: 'PLUS' })).ok).toBe(true);
    expect((await vote(hugo, outingId, { [id(lea)]: 'PLUS', [id(sarah)]: 'PLUS' })).ok).toBe(true);
    expect((await vote(sarah, outingId, { [id(hugo)]: 'FRIEND', [id(lea)]: 'PLUS' })).ok).toBe(true);
    expect((await vote(malo, outingId, { [id(ines)]: 'FRIEND', [id(lea)]: 'NO' })).ok).toBe(true);
    expect((await vote(ines, outingId, { [id(malo)]: 'FRIEND' })).ok).toBe(true);
    const r = await vote(lea, outingId, { [id(lea)]: 'PLUS' });
    expect(r.status).toBe(412);
    await w.drain();
    expect(Object.values(obs.snapshot()).flat()).toEqual([]);
    const mv = (await votes(malo, outingId)).data;
    expect(mv.targets.find((t: any) => t.userId === id(lea)).myChoice).toBe('NO');
    expect(JSON.stringify(mv)).not.toMatch(/PLUS/);
  });

  S.step('Dépouillement à date fixe : accords mutuels seulement, chacun ne voit que les siens', async () => {
    obs.mark();
    await at(w, CYCLE.votesClosed);
    await w.runJob('outings.lifecycle');
    expect(await obs.waitAll('outing.votes_closed', all)).toEqual([]);
    const revealedTo = (p: Person) => obs.since(p.phone).filter((e) => e.type === 'connection.revealed').map((e: any) => `${e.payload.kind}:${e.payload.other.firstName}`).sort();
    expect(revealedTo(lea)).toEqual(['FRIEND:Sarah', 'PLUS:Hugo']); // Sarah→Léa « plus » incompatible → ami·e en silence
    expect(revealedTo(hugo)).toEqual(['FRIEND:Sarah', 'PLUS:Léa']);
    expect(revealedTo(sarah)).toEqual(['FRIEND:Hugo', 'FRIEND:Léa']);
    expect(revealedTo(malo)).toEqual(['FRIEND:Inès']); // « plus » de Léa vers Malo : rien, des deux côtés
    expect(revealedTo(ines)).toEqual(['FRIEND:Malo']);
    const closed = obs.since(lea.phone).find((e) => e.type === 'outing.votes_closed') as any;
    expect(closed.payload).toEqual({ outingId, newBandCount: 1, newDuoCount: 1 });
    const mv = (await votes(malo, outingId)).data;
    expect(mv.closed).toBe(true);
    expect(mv.targets.filter((t: any) => t.mutual).map((t: any) => t.firstName)).toEqual(['Inès']);
  });

  S.step('Bande : Malo voit Inès (jamais la bande d’autrui) ; le duo Léa–Hugo n’est pas dans la bande', async () => {
    const mb = (await malo.call('GET', '/v1/band')).data;
    expect(mb.items.map((i: any) => i.user.firstName)).toEqual(['Inès']);
    const lb = (await lea.call('GET', '/v1/band')).data;
    expect(lb.items.map((i: any) => i.user.firstName)).toEqual(['Sarah']);
    expect(leaksIn(mb)).toEqual([]);
    const after = (await outing(malo, outingId)).data;
    expect(after.members.map((m: any) => m.firstName)).toEqual(['Inès']);
    const hist = (await lea.call('GET', '/v1/outings/history')).data;
    expect(hist.items[0]).toMatchObject({ id: outingId, attended: true, memoryId: expect.any(String) });
  });
});
