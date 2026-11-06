/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — annulation (V5.1 E.16, V5.2 C.8 amendé par V5.3 B.6) : annuler avant la confirmation (veille
 * 18 h) = recrédit, sans effet de fiabilité ; annuler après = ABSENCE (fiabilité « 0 sur 1 »), aucun remboursement ; le groupe voit seulement « X ne
 * pourra pas venir », jamais le motif ; la personne perd l'accès au chat et à la salle outing:.
 * Le motif sécurité reste remboursé ; une absence se conteste une seule fois.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, CYCLE, formOuting, leaksIn, outing, v5Person, type City } from './support/v5.js';

let w: World;
let c: City;
const people: Person[] = [];
let [ana, ben, cleo, dan, eva]: Person[] = [];
let outingId = '';
const S = story('v5-annulation', 'V5 : annulation après verrou / après visages = absence');

beforeAll(async () => {
  w = await startWorld('J_V5_ANNUL', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-annul', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

const cancel = (p: Person, kind = 'CANT_MAKE_IT') => p.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind });
const preview = (p: Person) => p.call('GET', `/v1/outings/${outingId}/seat/cancel-preview`);

describe('Annulation', () => {
  S.step('Cinq personnes forment une sortie confirmée (lieu révélé la veille)', async () => {
    const specs = [
      ['ana', 'Ana', 'WOMAN', 'Luna'],
      ['ben', 'Ben', 'MAN', 'Moka'],
      ['cleo', 'Cléo', 'WOMAN', 'Praline'],
      ['dan', 'Dan', 'MAN', 'Réglisse'],
      ['eva', 'Eva', 'WOMAN', 'Myrtille'],
    ] as const;
    for (const [k, n, g, pet] of specs) people.push(await v5Person(w, { key: `v5a.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: pet }, c));
    [ana, ben, cleo, dan, eva] = people;
    outingId = await formOuting(w, people);
    expect((await outing(ana!, outingId)).data.status).toBe('FORMING');
  });

  // V5.3 B.6 : annulation gratuite jusqu'à la confirmation (veille 18 h) ; après, annuler = absence.
  S.step('Avant la confirmation (veille 18 h) : Ben annule → recrédité, aucune absence', async () => {
    expect((await preview(ben!)).data).toEqual({ cancelKind: 'EARLY', refund: 'CREDIT', countsAsAbsence: false });
    const r = await cancel(ben!);
    expect(r.data).toEqual({ cancelKind: 'EARLY', refund: 'CREDIT', countsAsAbsence: false });
    expect((await ben!.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 0, total: 0, newcomer: true });
    const bv = (await outing(ben!, outingId)).data;
    expect(bv.members).toEqual([]);
    expect(bv.venue).toBeUndefined();
    expect(bv.conversationId).toBeUndefined();
    expect(await ben!.phone.join(`outing:${outingId}`)).toBe(false);
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    expect((await outing(ana!, outingId)).data.status).toBe('CONFIRMED');
  });

  S.step('Après la confirmation, avant les visages : l’aperçu dit déjà « absence » (V5.3 B.6)', async () => {
    expect((await preview(dan!)).data).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true });
  });

  S.step('Après la révélation des visages : Cléo annule → ABSENCE, aucun remboursement (« 0 sortie sur 1 »)', async () => {
    await at(w, CYCLE.faces);
    expect((await preview(cleo!)).data).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true });
    const r = await cancel(cleo!);
    expect(r.data.countsAsAbsence).toBe(true);
    await w.drain();
    expect((await cleo!.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 0, total: 1, newcomer: false });
    const seat = await w.db.outingSeat.findFirst({ where: { outingId, userId: cleo!.userId } });
    expect(seat).toMatchObject({ status: 'CANCELLED', cancelKind: 'LATE', refundState: 'NOT_ELIGIBLE' });
  });

  S.step('Le groupe voit « Cléo ne pourra pas venir », sans motif ; la sortie tient à 3', async () => {
    const v = (await outing(ana!, outingId)).data;
    expect(v.status).toBe('CONFIRMED');
    expect(v.members.find((m: any) => m.firstName === 'Cléo')).toMatchObject({ notComing: true });
    expect(v.members.find((m: any) => m.firstName === 'Cléo').photo).toBeUndefined();
    // Mon propre aperçu d'annulation est à moi ; rien sur le motif des autres.
    expect(JSON.stringify(v.members)).not.toMatch(/LATE|EARLY|absence|NOT_ELIGIBLE|SAFETY/);
    expect(leaksIn(v.members)).toEqual([]);
    expect(v.confirmedCount).toBe(3);
  });

  S.step('Le motif sécurité reste remboursé et sans effet, même après les visages', async () => {
    expect((await preview(dan!)).data.cancelKind).toBe('LATE');
    const r = await cancel(dan!, 'SAFETY');
    expect(r.data).toEqual({ cancelKind: 'SAFETY_EXIT', refund: 'CREDIT', countsAsAbsence: false });
    expect((await dan!.call('GET', '/v1/me/reliability')).data.total).toBe(0);
  });

  S.step('Eva ne fait pas le check-in : absence à la clôture ; elle ne voit plus personne du groupe', async () => {
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    expect((await ana!.call('POST', `/v1/outings/${outingId}/check-in`, { method: 'GEO', lat: 48.8649, lng: 2.3707, accuracyM: 30 })).ok).toBe(true);
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    expect((await eva!.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 0, total: 1 });
    expect((await outing(eva!, outingId)).data.members).toEqual([]);
    const st = await w.db.reliabilityStat.findUnique({ where: { userId: cleo!.userId } });
    expect(st?.episodeAbsences).toBe(1); // 1ʳᵉ absence de l'épisode : pas encore de pause
  });

  S.step('Une absence contestée est enregistrée une seule fois (409 DISPUTE_EXISTS au 2ᵉ essai)', async () => {
    const d1 = await eva!.call('POST', `/v1/outings/${outingId}/attendance/dispute`, { note: 'J’étais là mais le GPS ne marchait pas' });
    expect(d1.status).toBe(200);
    const d2 = await eva!.call('POST', `/v1/outings/${outingId}/attendance/dispute`, { note: 'encore' });
    expect(d2.status).toBe(409);
    expect(d2.data.detailsSafe.reason).toBe('DISPUTE_EXISTS');
    expect((await ana!.call('POST', `/v1/outings/${outingId}/attendance/dispute`, { note: 'x' })).data.detailsSafe.reason).toBe('NOT_NO_SHOW');
  });
});
