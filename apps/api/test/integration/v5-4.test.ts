/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5.4 (concept-v5.4) — intégration (vraie base, vrai graphe Nest, horloge contrôlée) :
 *  - A.1 : aucune vue ne contient de signal de compatibilité (ni `storyMatch`, ni « entre amis »), à chaque phase,
 *    pour chaque personne, alors que la garantie « histoire possible » reste appliquée par la composition ;
 *  - A.5 : mode discret = choix explicite exigé à la fin de l'onboarding (aucun défaut) ;
 *  - A.6 : « éviter les personnes que je connais » — opt-in proposé avant la 1ʳᵉ composition, protocole OPRF
 *    de bout en bout, aucun numéro stocké, deux contacts jamais composés ensemble, retrait = effacement ;
 *  - B.8 : « imprévu » après la confirmation, 1 par trimestre : aucune absence, place non remboursée, lieu
 *    compensé comme une absence ; le 2ᵉ du trimestre = annulation tardive ;
 *  - B.9 : « une semaine sur deux » (garde alternée).
 */
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { OutingViewSchema } from '@blowy/api-contract';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { blind, blindingScalar, unblind } from '../../src/modules/users/domain/contact-avoidance.js';
import { onboard, startHarness, TestClient, VISION, type Harness } from './harness.js';

let h: Harness;
const W47 = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  faces: new Date('2026-11-19T15:31:00Z'),
  checkin: new Date('2026-11-19T18:05:00Z'),
  done: new Date('2026-11-19T20:01:00Z'),
  closed: new Date('2026-11-22T20:01:00Z'),
  week: '2026-W47',
};
const W48 = { monday: new Date('2026-11-23T09:30:00Z'), composed: new Date('2026-11-24T11:01:00Z'), locked: new Date('2026-11-25T17:01:00Z'), week: '2026-W48' };
/** Aucun signal de compatibilité, sous aucune forme (V5.4 A.1). */
const SIGNAL = /storyMatch|FRIENDS_ONLY|AT_LEAST_TWO|friendsOnly|storyCompatible|guarantee|garantie|compatib|entre amis/i;
let nbId = '';

beforeAll(async () => {
  h = await startHarness(W47.monday);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-v54-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  nbId = n.id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café V54', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-v54' } });
});
afterAll(async () => h?.close());

const job = (name: string) => h.app.get<RecurringJob[]>(OUTINGS_JOBS).find((j) => j.name === name)!;
const run = async (name: string, at: Date) => {
  h.clock.set(at);
  await job(name).run(at);
  await h.drain();
};

async function person(key: string, gender: 'WOMAN' | 'MAN', looking: 'FRIENDS' | 'BOTH' = 'BOTH', at = W47.monday) {
  h.clock.set(at);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nbId })).status).toBe(200);
  if (looking !== 'FRIENDS') await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] });
  const i = await c.call('PUT', '/v1/preferences/intentions', { lookingFor: looking, storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: looking === 'FRIENDS' ? [] : [gender === 'WOMAN' ? 'MAN' : 'WOMAN'] });
  expect(i.status, JSON.stringify(i.body)).toBe(200);
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: at } });
  return c;
}

const journal = (kind: string) => h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: kind } });

describe('V5.4 — confidentialité, imprévus, garde alternée (intégration)', () => {
  let ps: TestClient[] = [];
  let outingId = '';

  it('A.5 : la fin de l’onboarding exige un choix « Discret » / « Normal » explicite (aucun défaut)', async () => {
    h.clock.set(W47.monday);
    const c = new TestClient(h);
    await c.signIn('itv54-onb');
    await c.call('PATCH', '/v1/me', { displayName: 'Camille', gender: 'WOMAN', birthDate: '1996-04-02', zoneCode: 'PARIS_11', timezone: 'Europe/Paris' });
    await c.call('PUT', '/v1/preferences/matching', { ageMin: 18, ageMax: 40, maxDistanceKm: 10, seekingGenders: [], intention: 'LET_IT_HAPPEN', widenConsented: false });
    await c.call('POST', '/v1/consents', { items: ['TERMS', 'PRIVACY', 'AI_MODERATION'].map((purpose) => ({ purpose, version: '2026-11', granted: true })) });
    await c.call('POST', '/v1/pets', { name: 'Pet-onb', species: 'NINO', vision: VISION });
    expect((await c.call('GET', '/v1/me')).body.privacy).toMatchObject({ discreetMode: false, discreetModeChosen: false });
    const missing = await c.call('POST', '/v1/me/onboarding/complete', {});
    expect([missing.status, missing.body.detailsSafe?.reason]).toEqual([412, 'ONBOARDING_INCOMPLETE']);
    expect(missing.body.detailsSafe.missing).toEqual(['discreetMode']);
    // « Discret » choisi : compte comme le choix, et l'onboarding se termine.
    expect((await c.call('PUT', '/v1/preferences/privacy', { discreetMode: true })).body.privacy).toMatchObject({ discreetMode: true, discreetModeChosen: true });
    expect((await c.call('POST', '/v1/me/onboarding/complete', {})).body.onboarded).toBe(true);
    // Un ancien corps V4 complet reste accepté (mapVisible ignoré).
    expect((await c.call('PUT', '/v1/preferences/privacy', { photoPreference: 'FROM_LEVEL_4_WITH_CONSENT', ageDisplay: 'RANGE', mapVisible: true })).status).toBe(200);
  });

  it('A.1 : aucune vue ne contient de signal de compatibilité, à aucune phase, pour personne — la garantie reste silencieuse', async () => {
    // 3 personnes cherchent une histoire dont 1 seule « compatible » pour chacune : la garantie (≥ 2) n'est pas tenue.
    ps = [await person('itv54a', 'WOMAN'), await person('itv54b', 'MAN'), await person('itv54c', 'WOMAN', 'FRIENDS'), await person('itv54d', 'MAN', 'FRIENDS'), await person('itv54e', 'WOMAN')];
    h.clock.set(W47.monday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${W47.week}`, {})).status).toBe(200);
    await run('outings.compose', W47.composed);
    outingId = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId;
    expect(outingId).toBeTruthy();
    const sweep = async (label: string) => {
      for (const p of ps) {
        for (const path of [`/v1/outings/${outingId}`, '/v1/outings/week', `/v1/outings/${outingId}/seat/cancel-preview`, `/v1/outings/${outingId}/votes`, '/v1/outings/history']) {
          const r = await p.call('GET', path);
          const json = JSON.stringify(r.body ?? '');
          expect(json, `${label} ${path}`).not.toMatch(SIGNAL);
        }
        const v = await p.call('GET', `/v1/outings/${outingId}`);
        if (v.status === 200) {
          OutingViewSchema.parse(v.body); // `.strict()` : un champ `storyMatch` ferait échouer le contrat
          expect(Object.keys(v.body)).not.toContain('storyMatch');
        }
      }
    };
    await sweep('invitation');
    for (const p of ps) expect((await p.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'AUTO' })).status).toBe(200);
    await h.drain();
    await sweep('formation');
    await run('outings.lifecycle', W47.locked);
    await sweep('confirmation');
    h.clock.set(W47.faces);
    await sweep('visages');
  });

  it('B.8/D-056 : « imprévu » après la confirmation — 1 par mois, aucune absence, place non remboursée, lieu compensé ; le 2ᵉ = absence', async () => {
    h.clock.set(W47.faces);
    const [a] = ps as [TestClient];
    // Aperçu « je ne peux pas venir » après la confirmation : il reste un imprévu ce trimestre (au lecteur seul).
    const pv = await a.call('GET', `/v1/outings/${outingId}/seat/cancel-preview`);
    expect(pv.body).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true, emergencyAvailable: true });
    expect((await a.call('GET', `/v1/outings/${outingId}/seat/cancel-preview?kind=EMERGENCY`)).body).toEqual({ cancelKind: 'EMERGENCY', refund: 'NONE', countsAsAbsence: false, emergencyAvailable: true });
    expect((await a.call('GET', `/v1/outings/${outingId}`)).body.mySeat.cancelPreview).toMatchObject({ emergencyAvailable: true });
    const r = await a.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'EMERGENCY' });
    expect(r.body).toEqual({ cancelKind: 'EMERGENCY', refund: 'NONE', countsAsAbsence: false, emergencyAvailable: true });
    await h.drain();
    const seat = await h.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: a.userId } });
    expect(seat).toMatchObject({ status: 'CANCELLED', cancelKind: 'EMERGENCY', refundState: 'NOT_ELIGIBLE' });
    // Aucune absence, aucun événement de fiabilité.
    expect((await a.call('GET', '/v1/me/reliability')).body).toMatchObject({ total: 0 });
    expect(await h.db.reliabilityEvent.count({ where: { userId: a.userId } })).toBe(0);
    // La 1ʳᵉ sortie (offerte) est consommée : pas « reste offerte ».
    expect((await a.call('GET', '/v1/outing-credits')).body.available).toEqual([]);
    // Lieu compensé comme pour une absence (place offerte → 3 €), une seule fois.
    const comp = (await journal('VENUE_COMPENSATION')).filter((e) => JSON.stringify(e.payload).includes(seat.id));
    expect(comp).toHaveLength(1);
    expect(JSON.stringify(comp[0]!.payload)).toMatch(/EMERGENCY/);
    // Le groupe voit seulement « ne pourra pas venir », jamais le motif.
    const other = (await ps[1]!.call('GET', `/v1/outings/${outingId}`)).body;
    expect(other.members.find((m: any) => m.userId === a.userId)).toMatchObject({ notComing: true });
    expect(JSON.stringify(other.members)).not.toMatch(/EMERGENCY|emergency|imprévu/);
  });

  it('D-056 : au-delà d’un imprévu par mois → 412 EMERGENCY_QUOTA ; l’annulation tardive reste une absence', async () => {
    const b = ps[1]!;
    const cur = await h.db.outing.findUniqueOrThrow({ where: { id: outingId } });
    // Fixture : b a déjà eu son imprévu ce trimestre (autre sortie, fin octobre).
    const prevSlot = await h.db.venueSlot.create({ data: { id: uuidv7(), venueId: cur.venueId, startsAt: new Date('2026-10-29T18:30:00Z'), activity: 'GAMES', capacityOutings: 1, reservedOutings: 1 } });
    const prev = await h.db.outing.create({
      data: {
        id: uuidv7(), neighborhoodId: nbId, weekKey: '2026-W44', venueSlotId: prevSlot.id, venueId: cur.venueId, activity: 'GAMES', status: 'DONE', capacity: 5,
        startsAt: new Date('2026-10-29T18:30:00Z'), endsAt: new Date('2026-10-29T20:30:00Z'), composedAt: new Date('2026-10-27T11:00:00Z'), acceptDeadline: new Date('2026-10-28T11:00:00Z'), lockAt: new Date('2026-10-28T17:00:00Z'),
        photoRevealAt: new Date('2026-10-29T15:30:00Z'), checkinOpensAt: new Date('2026-10-29T18:00:00Z'), checkinClosesAt: new Date('2026-10-29T20:00:00Z'), votesCloseAt: new Date('2026-11-01T20:00:00Z'), tuningVersion: 'it', algoVersion: 'it',
      },
    });
    await h.db.outingSeat.create({ data: { id: uuidv7(), outingId: prev.id, userId: b.userId, weekKey: '2026-W44', status: 'CANCELLED', cancelKind: 'EMERGENCY', funding: 'STAFF_COMP', acceptDeadline: prev.acceptDeadline, invitedAt: prev.composedAt, cancelledAt: new Date('2026-10-29T10:00:00Z') } });
    h.clock.set(W47.faces);
    expect((await b.call('GET', `/v1/outings/${outingId}/seat/cancel-preview?kind=EMERGENCY`)).body).toEqual({ cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true, emergencyAvailable: false });
    // V5.5 (spec §7.2) : un imprévu hors quota est REFUSÉ (412 EMERGENCY_QUOTA), jamais transformé en absence en silence.
    const r0 = await b.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'EMERGENCY' });
    expect([r0.status, r0.body.detailsSafe?.reason]).toEqual([412, 'EMERGENCY_QUOTA']);
    expect((await h.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: b.userId } })).status).toBe('CONFIRMED');
    const r = await b.call('POST', `/v1/outings/${outingId}/seat/cancel`, { kind: 'CANT_MAKE_IT' });
    expect(r.body).toMatchObject({ cancelKind: 'LATE', countsAsAbsence: true });
    expect((await b.call('GET', '/v1/me/reliability')).body).toMatchObject({ total: 1 });
    // V5.5 (D-056) : 1 imprévu par 30 jours GLISSANTS — un imprévu de plus de 30 jours ne compte plus.
    const c = ps[2]!;
    const cs = await h.db.outingSeat.create({ data: { id: uuidv7(), outingId: prev.id, userId: c.userId, weekKey: '2026-W44', status: 'CANCELLED', cancelKind: 'EMERGENCY', funding: 'STAFF_COMP', acceptDeadline: prev.acceptDeadline, invitedAt: prev.composedAt, cancelledAt: new Date('2026-10-21T09:00:00Z') } });
    expect((await c.call('GET', `/v1/outings/${outingId}/seat/cancel-preview?kind=EMERGENCY`)).body.emergencyAvailable).toBe(false);
    await h.db.outingSeat.update({ where: { id: cs.id }, data: { cancelledAt: new Date('2026-10-19T15:00:00Z') } });
    expect((await c.call('GET', `/v1/outings/${outingId}/seat/cancel-preview?kind=EMERGENCY`)).body.emergencyAvailable).toBe(true);
  });

});

describe('V5.4 A.6 — « éviter les personnes que je connais » (OPRF, opt-in avant la 1ʳᵉ composition)', () => {
  const NUM = { lea: '+33611111111', karim: '+33622222222' };
  const oprfTokens = async (c: TestClient, numbers: string[]) => {
    const r = blindingScalar(randomBytes(32));
    const ev = await c.call('POST', '/v1/me/contact-avoidance/evaluate', { blinded: numbers.map((n) => blind(n, r)) });
    expect(ev.status, JSON.stringify(ev.body)).toBe(200);
    return ev.body.evaluated.map((e: string) => unblind(e, r));
  };

  it('opt-in proposé avant la 1ʳᵉ composition, puis protocole de bout en bout : aucun numéro stocké, deux contacts jamais composés ensemble', async () => {
    const people = [await person('itca-lea', 'WOMAN', 'FRIENDS', W48.monday), await person('itca-karim', 'MAN', 'FRIENDS', W48.monday), await person('itca-3', 'WOMAN', 'FRIENDS', W48.monday), await person('itca-4', 'MAN', 'FRIENDS', W48.monday), await person('itca-5', 'WOMAN', 'FRIENDS', W48.monday), await person('itca-6', 'MAN', 'FRIENDS', W48.monday)];
    const [lea, karim] = people as [TestClient, TestClient];
    const st = (await lea.call('GET', '/v1/me/contact-avoidance')).body;
    expect(st).toEqual({ status: 'NOT_ASKED', askBeforeFirstOuting: true, protocol: { version: 'oprf-p256-v1', maxBatch: 2000 } });
    // Désactivé tant que la personne ne l'accepte pas.
    expect((await lea.call('POST', '/v1/me/contact-avoidance/evaluate', { blinded: [blind(NUM.karim, 5n)] })).body.code).toBe('CONSENT_REQUIRED');
    // Les deux activent avec leur numéro VÉRIFIÉ (démo locale = jeton du fournisseur d'auth).
    expect((await lea.call('POST', '/v1/me/contact-avoidance', { phoneVerificationToken: `local-phone:${NUM.lea}` })).body.status).toBe('ENABLED');
    expect((await karim.call('POST', '/v1/me/contact-avoidance', { phoneVerificationToken: `local-phone:${NUM.karim}` })).body.status).toBe('ENABLED');
    expect((await lea.call('POST', '/v1/me/contact-avoidance', { phoneVerificationToken: 'pas-un-jeton-valide' })).status).toBe(400);
    // Un numéro déjà associé à un autre compte : refusé.
    expect((await people[2]!.call('POST', '/v1/me/contact-avoidance', { phoneVerificationToken: `local-phone:${NUM.lea}` })).body.detailsSafe?.reason).toBe('PHONE_ALREADY_REGISTERED');
    // Léa envoie ses contacts (Karim + un inconnu) : réponse identique quel que soit le nombre de correspondances.
    const tokens = await oprfTokens(lea, [NUM.karim, '+33699999999']);
    expect((await lea.call('POST', '/v1/me/contact-avoidance/contacts', { tokens })).body).toEqual({ accepted: 2 });
    expect((await people[3]!.call('POST', '/v1/me/contact-avoidance', { phoneVerificationToken: 'local-phone:+33644444444' })).status).toBe(200);
    expect((await people[3]!.call('POST', '/v1/me/contact-avoidance/contacts', { tokens: await oprfTokens(people[3]!, ['+33688888888']) })).body).toEqual({ accepted: 1 });
    // Seule la paire Léa–Karim est gardée ; aucun numéro (ni chiffres) nulle part en base.
    expect(await h.db.avoidPair.count()).toBe(1);
    const dump = JSON.stringify([await h.db.phoneIdentity.findMany(), await h.db.avoidPair.findMany(), await h.db.commandRecord.findMany({ where: { operation: { startsWith: 'me.contacts_avoid' } } }), await h.db.outboxEvent.findMany()]);
    for (const n of [...Object.values(NUM), '+33699999999', '33611111111', '611111111', '622222222', '699999999']) expect(dump).not.toContain(n);
    // Composition : 6 personnes, un créneau → jamais Léa et Karim dans la même sortie.
    h.clock.set(W48.monday);
    for (const p of people) expect((await p.call('PUT', `/v1/outings/requests/${W48.week}`, {})).status).toBe(200);
    await run('outings.compose', W48.composed);
    const seats = await h.db.outingSeat.findMany({ where: { userId: { in: [lea.userId, karim.userId] }, weekKey: W48.week } });
    const outings = new Set(seats.map((s) => s.outingId));
    expect(seats.length).toBeGreaterThanOrEqual(1);
    expect(outings.size).toBe(seats.length);
    // Personne n'est informé·e : aucune vue ne mentionne l'évitement.
    for (const p of [lea, karim]) {
      const w = (await p.call('GET', '/v1/outings/week')).body;
      expect(JSON.stringify(w)).not.toMatch(/avoid|contact|KNOWN_CONTACT/i);
      if (w.myOutingId) expect(JSON.stringify((await p.call('GET', `/v1/outings/${w.myOutingId}`)).body)).not.toMatch(/avoid|contact|KNOWN_CONTACT/i);
    }
    // Une fois invité·e, la question n'est plus posée « avant la 1ʳᵉ sortie ».
    expect((await people[4]!.call('GET', '/v1/me/contact-avoidance')).body.askBeforeFirstOuting).toBe(false);
    // Retrait : numéro et paires effacés ; « non merci » enregistré.
    expect((await lea.call('DELETE', '/v1/me/contact-avoidance')).body.status).toBe('DECLINED');
    expect(await h.db.avoidPair.count()).toBe(0);
    expect(await h.db.phoneIdentity.count({ where: { userId: lea.userId } })).toBe(0);
  });
});

describe('V5.4 B.9 — garde alternée', () => {
  it('B.9 : « une semaine sur deux » à partir d’une semaine choisie (garde alternée)', async () => {
    const c = await person('itv54-alt', 'WOMAN', 'FRIENDS', W48.monday);
    const body = { groupAge: { min: 22, max: 34 }, availableSlotTemplateIds: [], weeksOff: [], activities: [], neighborhoodIds: [nbId], maxTravelMinutes: 30 };
    expect((await c.call('PUT', '/v1/preferences/outings', body)).body.everyOtherWeekOffFrom).toBeNull();
    const put = await c.call('PUT', '/v1/preferences/outings', { ...body, everyOtherWeekOffFrom: W48.week });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    expect(put.body.everyOtherWeekOffFrom).toBe(W48.week);
    h.clock.set(W48.monday);
    const r = await c.call('PUT', `/v1/outings/requests/${W48.week}`, {});
    expect([r.status, r.body.detailsSafe?.reason]).toEqual([412, 'WEEK_OFF']);
    // La semaine suivante (W49) est « on » : la demande passe dans sa fenêtre.
    h.clock.set(new Date('2026-11-30T09:30:00Z'));
    expect((await c.call('PUT', '/v1/outings/requests/2026-W49', {})).status).toBe(200);
    // W50 de nouveau off.
    h.clock.set(new Date('2026-12-07T09:30:00Z'));
    expect((await c.call('PUT', '/v1/outings/requests/2026-W50', {})).body.detailsSafe?.reason).toBe('WEEK_OFF');
  });
});
