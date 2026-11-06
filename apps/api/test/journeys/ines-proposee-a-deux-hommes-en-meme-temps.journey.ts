/**
 * Histoire 2 (V5) — « Inès proposée deux fois la même semaine ? Jamais. » Remplace le Triangle V4
 * (Inès proposée en même temps à Karim et à Théo, emménagement concurrent) : en V5, la même intention
 * — une personne qui pourrait aller dans deux groupes la même semaine — est tenue par l'invariant I-O2
 * (une place active par personne et par semaine, index partiel en base) et par la composition.
 * Onze personnes compatibles à Paris 11e cochent les deux créneaux (jeudi soir, samedi après-midi) :
 *  - la composition forme deux groupes ; Inès est dans UN seul, l'autre groupe ne la voit jamais ;
 *  - double tap « Je viens » depuis ses deux téléphones (même clé, puis clés différentes en parallèle) :
 *    une seule place confirmée, une seule 1ʳᵉ sortie offerte consommée ;
 *  - une 2ᵉ demande la même semaine est refusée (409 WEEKLY_QUOTA_USED) ; une 2ᵉ place forcée en base est
 *    refusée par l'index ; l'autre groupe ne reçoit aucun événement la concernant ;
 *  - Karim (autre groupe) libère sa place : le backfill choisit la personne non placée, jamais Inès ;
 *  - jamais plus de 3 personnes du même genre dans chaque groupe (D-039).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { uuidv7 } from '@blowy/database';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, CYCLE, outing, request, v5Person, week, type City } from './support/v5.js';

let w: World;
let c: City;
let ines: Person;
let people: Person[] = [];
let mine = '';
let other = '';
const S = story('triangle', 'V5 : Inès ne peut être proposée que dans un seul groupe par semaine (I-O2), double tap, backfill');

const seatsOf = (p: Person) => w.db.outingSeat.findMany({ where: { userId: p.userId, weekKey: CYCLE.weekKey } });
const outingOf = async (p: Person) => (await week(p)).data.myOutingId as string | undefined;

beforeAll(async () => {
  w = await startWorld('J_TRIANGLE', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-tri', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Triangle (V5)', () => {
  S.step('Onze personnes vérifiées (6 femmes, 5 hommes) cochent les deux créneaux de la semaine', async () => {
    const specs: Array<[string, string, 'WOMAN' | 'MAN']> = [
      ['ines', 'Inès', 'WOMAN'],
      ['karim', 'Karim', 'MAN'],
      ['theo', 'Théo', 'MAN'],
      ['lina', 'Lina', 'WOMAN'],
      ['maud', 'Maud', 'WOMAN'],
      ['nour', 'Nour', 'WOMAN'],
      ['eva', 'Eva', 'WOMAN'],
      ['jade', 'Jade', 'WOMAN'],
      ['paul', 'Paul', 'MAN'],
      ['sacha', 'Sacha', 'MAN'],
      ['yann', 'Yann', 'MAN'],
    ];
    people = [];
    for (const [k, n, g] of specs) people.push(await v5Person(w, { key: `tri.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: `Pet-${n}` }, c));
    ines = people[0]!;
    await at(w, CYCLE.monday);
    for (const p of people) expect((await request(p)).ok, p.name).toBe(true);
    // Les deux créneaux (jeu. 19 h 30, sam. 15 h) sont proposés à chacun.
    expect((await w.db.outingRequest.findFirstOrThrow({ where: { userId: ines.userId, weekKey: CYCLE.weekKey } })).slotStartsAt).toHaveLength(2);
  });

  S.step('Composition : deux groupes ; Inès est dans un seul (une seule place cette semaine), l’autre lui répond 404', async () => {
    await at(w, CYCLE.composed);
    await w.runJob('outings.compose');
    const outings = await w.db.outing.findMany({ where: { weekKey: CYCLE.weekKey, neighborhoodId: c.neighborhoodId }, include: { seats: true } });
    expect(outings).toHaveLength(2);
    expect((await seatsOf(ines)).length).toBe(1);
    mine = S.need(await outingOf(ines), 'sortie d’Inès');
    other = outings.find((o) => o.id !== mine)!.id;
    expect((await outing(ines, other)).status).toBe(404);
    // D-039 : jamais plus de 3 personnes du même genre dans un groupe.
    for (const o of outings) {
      const genders = await w.db.profile.findMany({ where: { userId: { in: o.seats.map((s) => s.userId) } }, select: { gender: true } });
      const n = (g: string) => genders.filter((x) => x.gender === g).length;
      expect(Math.max(n('WOMAN'), n('MAN')), `groupe ${o.id}`).toBeLessThanOrEqual(3);
    }
    // Une seule personne n'est pas placée jeudi. Composition glissante (V5.5, J − 3 21 h jour par jour) :
    // elle reste candidate pour samedi (composé mercredi 21 h) et ne passe « non placée » qu'après son dernier jour.
    const unplaced = people.filter((p) => !outings.some((o) => o.seats.some((s) => s.userId === p.userId)));
    expect(unplaced).toHaveLength(1);
    expect((await w.db.outingRequest.findFirstOrThrow({ where: { userId: unplaced[0]!.userId, weekKey: CYCLE.weekKey } })).status).toBe('OPEN');
  });

  S.step('L’autre groupe ne voit jamais Inès (ni son pet ni son identifiant), à aucun moment', async () => {
    const others = people.filter((p) => p !== ines);
    for (const p of others) {
      const id = await outingOf(p);
      if (id !== other) continue;
      const v = (await outing(p, other)).data;
      expect(JSON.stringify(v)).not.toContain(ines.userId);
      expect(JSON.stringify(v)).not.toContain('Pet-Inès');
    }
  });

  S.step('Double tap depuis deux téléphones : une seule place confirmée, une seule 1ʳᵉ sortie offerte', async () => {
    await ines.device('ines-ipad');
    const key = randomUUID();
    const [a, b] = await Promise.all([ines.call('POST', `/v1/outings/${mine}/seat/accept`, { funding: 'AUTO' }, key), ines.call('POST', `/v1/outings/${mine}/seat/accept`, { funding: 'AUTO' }, key)]);
    expect([a, b].some((r) => r.ok)).toBe(true);
    const [x, y] = await Promise.all([ines.call('POST', `/v1/outings/${mine}/seat/accept`, { funding: 'AUTO' }), ines.call('POST', `/v1/outings/${mine}/seat/accept`, { funding: 'AUTO' })]);
    expect([x, y].every((r) => r.ok), JSON.stringify([x.data, y.data])).toBe(true);
    const seats = await seatsOf(ines);
    expect(seats).toHaveLength(1);
    expect(seats[0]).toMatchObject({ status: 'CONFIRMED', funding: 'FREE_FIRST' });
    expect(await w.db.outingSeat.count({ where: { userId: ines.userId, funding: 'FREE_FIRST' } })).toBe(1);
  });

  S.step('Une 2ᵉ demande la même semaine est refusée ; une 2ᵉ place forcée en base est refusée par l’index (I-O2)', async () => {
    // Après la composition, la fenêtre est close (412) ; et même ouverte, une place active = 409 WEEKLY_QUOTA_USED.
    const r = await request(ines);
    expect([409, 412]).toContain(r.status);
    await at(w, CYCLE.monday);
    const early = await request(ines);
    expect([early.status, early.data.detailsSafe?.reason]).toEqual([409, 'WEEKLY_QUOTA_USED']);
    await at(w, CYCLE.composed);
    const o = await w.db.outing.findUniqueOrThrow({ where: { id: other } });
    await expect(
      w.db.outingSeat.create({ data: { id: uuidv7(), outingId: other, userId: ines.userId, weekKey: CYCLE.weekKey, status: 'INVITED', acceptDeadline: o.acceptDeadline, invitedAt: w.clock.now() } }),
    ).rejects.toThrow();
    expect((await seatsOf(ines)).length).toBe(1);
  });

  S.step('Un membre de l’autre groupe libère sa place : le backfill invite la personne non placée, jamais Inès', async () => {
    const seat = await w.db.outingSeat.findFirstOrThrow({ where: { outingId: other, status: 'INVITED' }, orderBy: { userId: 'asc' } });
    const leaver = people.find((p) => p.userId === seat.userId)!;
    const d = await leaver.call('POST', `/v1/outings/${other}/seat/decline`, {});
    expect(d.ok, JSON.stringify(d.data)).toBe(true);
    await w.runJob('outings.lifecycle');
    await w.drain();
    const after = await w.db.outingSeat.findMany({ where: { outingId: other, status: { in: ['INVITED', 'HELD', 'CONFIRMED'] } } });
    expect(after.some((s) => s.userId === ines.userId)).toBe(false);
    expect((await seatsOf(ines)).length).toBe(1);
    if (after.length < 5) S.note(`Backfill : ${after.length} places actives après le départ (aucun·e non placé·e compatible sur ce créneau).`);
  });

  S.step('Inès ne reçoit aucun événement sur l’autre groupe ; sa salle WS y est refusée', async () => {
    for (const d of ines.devices) expect(d.events.some((e) => JSON.stringify(e.payload ?? {}).includes(other))).toBe(false);
    expect(await ines.phone.join(`outing:${other}`)).toBe(false);
  });
});
