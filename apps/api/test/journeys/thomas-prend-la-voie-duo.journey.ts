/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T5 — voie Duo (spec-v5 §2.12 ; V5.1 F.17–F.18 ; V5.2 H.25 ; V5.3 A.3, E.20, F.24) :
 * Thomas et Camille se voient proposés l'un à l'autre (pet + initiale seulement), Thomas écrit
 * d'abord, Camille répond ; les visages se débloquent à 48 h (horloge) parce que les deux ont écrit ;
 * aucun RDV avant ; RDV au lieu partenaire, check-in, bulletins PLUS/PLUS → ensemble ; Inès et Malo :
 * un seul a écrit → fin neutre identique ; Hugo (autre orientation) et Zoé (« en petit groupe ») ne
 * sont jamais proposés ; aucune fuite (intentions, orientation, sous-choix, progression de l'autre,
 * bulletins) ; « partir proprement » ; « Ta rue ».
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, leaksIn, v5Person, type City, duoCodeOf } from './support/v5.js';

let w: World;
let paris: City;
let lille: City;
let thomas: Person, camille: Person, hugo: Person, zoe: Person, ines: Person, malo: Person;
let duoId = '';
let convId = '';
let duo2 = '';
let dateId = '';
const S = story('v5-thomas-voie-duo', 'V5 : Thomas prend la voie Duo — texte d’abord, visages à 48 h, rendez-vous, aucune fuite');

const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  lane: new Date('2026-11-16T20:05:00Z'), // lun. 21 h 05 Paris : lot quotidien
  wedBefore: new Date('2026-11-18T19:30:00Z'), // 47 h 25 après l'accord
  wedAfter: new Date('2026-11-18T20:20:00Z'), // > 48 h
  dateStarts: '2026-11-20T18:30:00.000Z', // V5.6 (E13) : ven. 19 h 30 Paris — un RDV (table de 2) se confirme au plus tard la veille 18 h
  checkin: new Date('2026-11-20T18:20:00Z'),
  dateDone: new Date('2026-11-20T20:05:00Z'),
  votesClosed: new Date('2026-11-23T20:10:00Z'),
};
/** Valeurs secrètes qui ne doivent jamais sortir vers autrui. */
const SECRET = ['SERIOUS', 'SEE_HOW_IT_GOES', 'STORY', '"BOTH"', '"GROUP"', '"WOMAN"', '"MAN"', 'romance', 'orientation', 'messagesHigh', 'messagesLow', 'myChoice":"PLUS', 'passedBy'];

const duo = (p: Person, id = duoId) => p.call('GET', `/v1/duos/${id}`);
const lane = (p: Person) => p.call('GET', '/v1/duo-lane');
const job = async (name: string, d: Date) => {
  await at(w, d);
  await w.runJob(name);
};

async function sweep(label: string, people: Person[]) {
  const problems: string[] = [];
  for (const p of people) {
    const views = [await lane(p), await p.call('GET', '/v1/duos'), await p.call('GET', '/v1/band/street')];
    for (const v of views) {
      const l = leaksIn(v.data, SECRET);
      if (l.length) problems.push(`${label} ${p.name} HTTP: ${l.join(',')}`);
    }
    for (const d of p.devices)
      for (const e of d.events) {
        const l = leaksIn(e.payload, SECRET);
        if (l.length) problems.push(`${label} ${p.name} WS ${e.type}: ${l.join(',')}`);
      }
  }
  return problems;
}

beforeAll(async () => {
  w = await startWorld('J_V5_DUO', T.monday);
  paris = await city(w, { slug: 'j-paris-duo', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
  lille = await city(w, { slug: 'j-lille-duo', name: 'Lille Centre', city: 'Lille', status: 'WAITLIST', zoneCode: 'J_V5_DUO_LILLE' });
});
afterAll(async () => w?.close());

describe('Voie Duo', () => {
  S.step('Six personnes : Thomas et Camille (histoire sérieuse, réciproque), Hugo (cherche des hommes), Zoé (« en petit groupe »), Inès et Malo (Lille)', async () => {
    thomas = await v5Person(w, { key: 'v5d.thomas', displayName: 'Thomas', gender: 'MAN', seeking: [], looking: 'STORY', romance: ['WOMAN'], seriousness: 'SERIOUS', petName: 'Fusain' }, paris);
    camille = await v5Person(w, { key: 'v5d.camille', displayName: 'Camille', gender: 'WOMAN', seeking: [], looking: 'BOTH', romance: ['MAN'], seriousness: 'SERIOUS', petName: 'Luciole' }, paris);
    hugo = await v5Person(w, { key: 'v5d.hugo', displayName: 'Hugo', gender: 'MAN', seeking: [], looking: 'STORY', romance: ['MAN'], petName: 'Grizzli' }, paris);
    zoe = await v5Person(w, { key: 'v5d.zoe', displayName: 'Zoé', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Nuage' }, paris);
    expect((await zoe.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] })).ok).toBe(true);
    ines = await v5Person(w, { key: 'v5d.ines', displayName: 'Inès', gender: 'WOMAN', seeking: [], looking: 'STORY', romance: ['MAN'], petName: 'Brindille' }, lille);
    malo = await v5Person(w, { key: 'v5d.malo', displayName: 'Malo', gender: 'MAN', seeking: [], looking: 'STORY', romance: ['WOMAN'], petName: 'Zinzin' }, lille);
    expect((await lane(zoe)).data.emptyReason).toBe('LANE_DISABLED');
    expect((await lane(thomas)).data).toMatchObject({ items: [], emptyReason: 'WAITING_NEXT_BATCH' });
  });

  S.step('Lot de 21 h : Thomas ↔ Camille seulement, pet + initiale ; Hugo et Zoé jamais proposés', async () => {
    await job('duos.lane', T.lane);
    const t = (await lane(thomas)).data;
    const c = (await lane(camille)).data;
    expect(t.items).toHaveLength(1);
    expect(c.items.map((i: any) => i.proposalId)).toEqual([t.items[0].proposalId]);
    expect(t.items[0]).toMatchObject({ species: expect.any(String), otherInitial: 'C', acceptedByMe: false });
    expect(JSON.stringify(t.items[0])).not.toMatch(/Camille|Luciole/); // V5.5 D-068 : jamais le nom du pet
    expect(c.items[0]).toMatchObject({ species: expect.any(String), otherInitial: 'T' });
    expect((await lane(hugo)).data.items).toEqual([]);
    expect((await lane(zoe)).data.items).toEqual([]);
    expect((await lane(ines)).data.items).toHaveLength(1);
    // Rejouer le lot le même jour ne crée rien (un lot par zone et par jour local).
    await w.runJob('duos.lane');
    expect((await lane(thomas)).data.items).toHaveLength(1);
  });

  S.step('Thomas dit oui (Camille n’en sait rien), puis Camille : duo en échange, texte seul, sans visage', async () => {
    const pid = (await lane(thomas)).data.items[0].proposalId;
    const before = camille.phone.events.length;
    expect((await thomas.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {})).data).toEqual({ status: 'WAITING_OTHER', duoId: null });
    await w.drain();
    expect(camille.phone.events.length).toBe(before);
    expect((await lane(camille)).data.items[0].acceptedByMe).toBe(false);
    const r = await camille.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {});
    expect(r.data.status).toBe('MATCHED');
    duoId = r.data.duoId;
    await w.drain();
    const v = (await duo(thomas)).data;
    expect(v).toMatchObject({ status: 'EXCHANGE', origin: 'LANE', other: { firstName: 'Camille', pet: { name: 'Luciole' }, reliability: 'NEWCOMER' }, exchange: { mineCount: 0, unlockProgress: 0 } });
    expect(v.other.photo).toBeUndefined();
    convId = v.conversationId;
    expect(await thomas.phone.join(`duo:${duoId}`)).toBe(true);
    expect(await camille.phone.join(`duo:${duoId}`)).toBe(true);
    // V5.4 (C.11) : Duo gratuit pour tous, jusqu'à 3 duos actifs — un duo en cours ne bloque plus la voie.
    const tl = (await lane(thomas)).data;
    expect(tl.emptyReason).not.toBe('LIMIT_REACHED');
    expect(tl.quota).toMatchObject({ maxActive: 3, freeMaxActive: 3, unlimited: false });
    // À Lille, Inès et Malo disent oui aussi.
    const p2 = (await lane(ines)).data.items[0].proposalId;
    await ines.call('POST', `/v1/duo-lane/proposals/${p2}/accept`, {});
    duo2 = (await malo.call('POST', `/v1/duo-lane/proposals/${p2}/accept`, {})).data.duoId;
    expect(duo2).toBeTruthy();
  });

  S.step('Aucun rendez-vous avant le déblocage des visages ; aucun lieu proposé', async () => {
    const r = await thomas.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: T.dateStarts });
    expect([r.status, r.data.detailsSafe?.reason]).toEqual([412, 'DUO_NOT_UNLOCKED']);
    expect((await thomas.call('GET', `/v1/duos/${duoId}/venues`)).data.items).toEqual([]);
  });

  S.step('Thomas écrit d’abord : sa progression avance, celle de Camille reste la sienne (0)', async () => {
    expect((await thomas.say(convId, 'Salut ! Fusain adore les jeux de société.')).ok).toBe(true);
    expect((await thomas.say(convId, 'Tu as un bar préféré dans le 11e ?')).ok).toBe(true);
    await w.drain();
    expect((await duo(thomas)).data.exchange).toMatchObject({ mineCount: 2, unlockProgress: 1 });
    expect((await duo(camille)).data.exchange).toMatchObject({ mineCount: 0, unlockProgress: 0 });
    expect(((await camille.messages(convId)).data as any).items.filter((m: any) => m.kind === 'TEXT')).toHaveLength(2);
    // Lille : seule Inès écrit.
    const conv2 = (await duo(ines, duo2)).data.conversationId;
    await ines.say(conv2, 'Coucou Malo !');
    await ines.say(conv2, 'Brindille dit bonjour.');
    await w.drain();
  });

  S.step('Camille répond le lendemain ; à 47 h rien ne change encore', async () => {
    await at(w, new Date('2026-11-17T12:00:00Z'));
    await camille.say(convId, 'Oui ! Le Café Paris 11e.');
    await camille.say(convId, 'Luciole aussi aime les jeux.');
    await w.drain();
    await job('duos.lifecycle', T.wedBefore);
    const v = (await duo(camille)).data;
    expect(v.status).toBe('EXCHANGE');
    expect(v.other.photo).toBeUndefined();
  });

  S.step('À 48 h (horloge) : visages débloqués pour les deux en même temps ; indice « projet compatible » (booléen)', async () => {
    await job('duos.lifecycle', T.wedAfter);
    const t = (await duo(thomas)).data;
    const c = (await duo(camille)).data;
    expect([t.status, c.status]).toEqual(['UNLOCKED', 'UNLOCKED']);
    expect(t.other.photo?.url).toBeTruthy();
    expect(c.other.photo?.url).toBeTruthy();
    expect(t.projectCompatible).toBe(true);
    expect(t.exchange).toBeUndefined();
    expect(await thomas.phone.waitFor((e) => e.type === 'duo.updated' && (e.payload as any).changed === 'UNLOCKED')).toBeTruthy();
    expect(await camille.phone.waitFor((e) => e.type === 'duo.updated' && (e.payload as any).changed === 'UNLOCKED')).toBeTruthy();
  });

  S.step('Inès a écrit, Malo non : à 48 h le duo s’arrête, même message neutre des deux côtés', async () => {
    const conv2 = (await duo(ines, duo2)).data.conversationId;
    await job('duos.lifecycle', new Date('2026-11-18T20:30:00Z'));
    const a = (await duo(ines, duo2)).data;
    const b = (await duo(malo, duo2)).data;
    expect([a.status, b.status]).toEqual(['EXPIRED', 'EXPIRED']);
    const last = (p: Person) => p.messages(conv2).then((r: any) => r.data.items.filter((m: any) => m.kind === 'SYSTEM').map((m: any) => m.systemTemplate));
    expect(await last(ines)).toEqual(await last(malo));
    expect(JSON.stringify([a, b])).not.toMatch(/mineCount|messages/);
    expect((await malo.say(conv2, 'Trop tard ?')).ok).toBe(false);
  });

  S.step('Rendez-vous au lieu partenaire : Thomas propose, Camille accepte', async () => {
    const venues = (await thomas.call('GET', `/v1/duos/${duoId}/venues`)).data.items;
    expect(venues.map((v: any) => v.id)).toContain(paris.venueId);
    const late = await thomas.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: '2026-11-19T23:30:00.000Z' });
    expect(late.data.detailsSafe?.reason).toBe('DATE_OUT_OF_RANGE');
    const p = await thomas.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: T.dateStarts });
    expect(p.data).toMatchObject({ status: 'PROPOSED', proposedByMe: true, venue: { name: 'Café Paris 11e' } });
    dateId = p.data.id;
    expect((await thomas.call('POST', `/v1/duos/${duoId}/dates/${dateId}/respond`, { decision: 'ACCEPT' })).data.detailsSafe?.reason).toBe('OWN_PROPOSAL');
    const r = await camille.call('POST', `/v1/duos/${duoId}/dates/${dateId}/respond`, { decision: 'ACCEPT' });
    expect(r.data).toMatchObject({ status: 'CONFIRMED', proposedByMe: false, myCheckedIn: false });
    expect((await duo(thomas)).data.status).toBe('DATE_CONFIRMED');
  });

  S.step('Check-in au lieu par le code du chevalet (V5.5 D-062) : aucune position acceptée', async () => {
    await at(w, T.checkin);
    const geo = await thomas.call('POST', `/v1/duos/${duoId}/dates/${dateId}/check-in`, { method: 'GEO', lat: 48.9, lng: 2.4, accuracyM: 20 });
    expect(geo.status).toBe(400);
    expect(JSON.stringify(geo.data)).not.toMatch(/distance|meters/);
    const code = await duoCodeOf(w, dateId);
    for (const p of [thomas, camille]) expect((await p.call('POST', `/v1/duos/${duoId}/dates/${dateId}/check-in`, { code })).data).toEqual({ result: 'ACCEPTED' });
  });

  S.step('Après le RDV : bulletins secrets (aucun événement à la saisie), PLUS/PLUS → ensemble à la clôture', async () => {
    await job('duos.lifecycle', T.dateDone);
    const cur = (await duo(camille)).data;
    expect(cur.status).toBe('AFTER_VOTE');
    expect(cur.currentDate).toMatchObject({ status: 'DONE', myCheckedIn: true, myVote: 'NO' });
    expect(cur.currentDate.voteOptions).toEqual(['FRIEND', 'PLUS', 'NO']);
    const n = thomas.phone.events.length;
    expect((await camille.call('PUT', `/v1/duos/${duoId}/dates/${dateId}/vote`, { choice: 'PLUS' })).data).toEqual({ myChoice: 'PLUS' });
    expect((await thomas.call('PUT', `/v1/duos/${duoId}/dates/${dateId}/vote`, { choice: 'PLUS' })).data).toEqual({ myChoice: 'PLUS' });
    await w.drain();
    expect(thomas.phone.events.slice(n).filter((e) => e.type !== 'pet.updated')).toEqual([]);
    await job('duos.lifecycle', T.votesClosed);
    expect((await duo(thomas)).data.status).toBe('TOGETHER');
    const rev = await camille.phone.waitFor((e) => e.type === 'connection.revealed');
    expect(rev?.payload).toMatchObject({ kind: 'PLUS', source: 'DUO', duoId, other: { firstName: 'Thomas' } });
  });

  S.step('Fuite impossible : Hugo ne voit rien (404 identique, salle refusée) ; aucune intention ni orientation nulle part', async () => {
    const r = await duo(hugo);
    const unknown = await duo(hugo, '00000000-0000-7000-8000-000000000000');
    expect([r.status, unknown.status]).toEqual([404, 404]);
    expect(r.data.code).toBe(unknown.data.code);
    expect(await hugo.phone.join(`duo:${duoId}`)).toBe(false);
    expect((await hugo.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: T.dateStarts })).status).toBe(404);
    expect(await sweep('FIN', [thomas, camille, hugo, zoe, ines, malo])).toEqual([]);
  });

  S.step('Ta rue : calme, sans jauge ; souvenir du RDV en décor ; ranger ses souvenirs', async () => {
    const s = (await thomas.call('GET', '/v1/band/street')).data;
    expect(s.myPet?.name).toBe('Fusain');
    expect(s.decor.map((d: any) => d.kind)).toContain('DUO_DATE_LIVED');
    expect(JSON.stringify(s)).not.toMatch(/gauge|hunger|energy|streak|notification/i);
    const ids = s.decor.map((d: any) => d.id).reverse();
    const r = await thomas.call('PUT', '/v1/band/street/arrangement', { memoryIds: ids });
    expect(r.data.decor.map((d: any) => d.id)).toEqual(ids);
  });

  S.step('Partir proprement : Camille quitte le duo — fin neutre, accès révoqué, aucune pénalité', async () => {
    const r = await camille.call('POST', `/v1/duos/${duoId}/leave`, {});
    expect(r.data).toEqual({ duoId, status: 'LEFT' });
    await w.drain();
    expect((await duo(thomas)).status).toBe(404);
    expect((await thomas.say(convId, 'Encore là ?')).ok).toBe(false);
    expect(await thomas.phone.waitFor((e) => e.type === 'duo.updated' && (e.payload as any).status === 'LEFT')).toBeTruthy();
    expect((await camille.call('POST', `/v1/duos/${duoId}/leave`, {})).data.detailsSafe?.reason).toBe('ALREADY_CLOSED');
    expect((await camille.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 1, total: 1 });
    // Libre à nouveau : de nouveau éligible à la voie Duo.
    expect((await lane(thomas)).data.emptyReason).not.toBe('LIMIT_REACHED');
  });
});

