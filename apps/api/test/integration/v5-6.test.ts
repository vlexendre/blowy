/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5.6 (concept-v5.6 §A, spec révision 6 §11.4) — intégration (vraie base, vrai graphe Nest, horloge contrôlée) :
 *  - E24 : la fiabilité n'est servie qu'à soi — jamais dans les membres d'une sortie ;
 *  - E11 / §7.5 : vue sortie `activityChosenBy`, `oncall`, ambiance du lieu, trajet ; préférences « histoire »
 *    (`storyAgeBrackets`, `kidsHorizon` dont « j'en ai déjà »), « un week-end sur deux » ; GET des préférences
 *    de sortie sans rien d'enregistré → valeurs par défaut (plus de 400) ;
 *  - E18 : « je connais quelqu'un » (lien connu) → déplacé·e vers l'autre groupe du créneau, mêmes financement ;
 *  - E23 / E22 : au-delà d'1 déplacement par mois → sortie pour raison de sécurité (remboursée, sans pénalité,
 *    `SAFETY_REVIEW` examinée par un humain) ; le lieu est compensé 3 € HT ;
 *  - E12 : génération des créneaux limitée à l'astreinte ; un créneau qui perd sa couverture est retiré ;
 *  - E16 : liens de partage uniques, page publique, attribution de l'inscription ;
 *  - E15 / E19 : espace lieu sur ses tables (accès, contrat) et contre-signature Blowy.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import { NEIGHBORHOODS_REPOSITORY, type NeighborhoodsRepository } from '../../src/modules/neighborhoods/application/ports/neighborhoods.repository.js';
import { VENUE_PARTNER_STORE, type VenuePartnerStore } from '../../src/modules/admin/application/ports/ops.ports.js';
import { VENUE_CONTRACT_VERSION } from '../../src/modules/admin/domain/venue-partner.js';
import { VenuePartnerUseCases, type VenuePartnerContext } from '../../src/modules/admin/application/use-cases/venue-partner.use-cases.js';
import { UNIT_OF_WORK, type UnitOfWork } from '../../src/shared/application/unit-of-work.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  faces: new Date('2026-11-19T15:31:00Z'),
  week: '2026-W47',
};
let nbId = '';
let nb2 = '';
let venueId = '';

beforeAll(async () => {
  h = await startHarness(T.monday);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  nbId = (await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-v56-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } })).id;
  nb2 = (await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-v56-20', name: 'Paris 20e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } })).id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: nbId, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  venueId = (await h.db.venue.create({ data: { neighborhoodId: nbId, name: 'Café calme', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.86, lng: 2.37, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-v56', ambiance: 'CALM' } })).id;
  // Trajet typique 20e → 11e : 20 min (ops).
  await h.db.neighborhoodTravelTime.create({ data: { fromNeighborhoodId: nb2, toNeighborhoodId: nbId, minutes: 20, updatedAt: T.monday } });
});
afterAll(async () => h?.close());

const job = (name: string) => h.app.get<RecurringJob[]>(OUTINGS_JOBS).find((j) => j.name === name)!;
const run = async (name: string, at: Date) => {
  h.clock.set(at);
  await job(name).run(at);
  await h.drain();
};

async function person(key: string, gender: 'WOMAN' | 'MAN', home = nbId) {
  h.clock.set(T.monday);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: home })).status).toBe(200);
  const i = await c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] });
  expect(i.status, JSON.stringify(i.body)).toBe(200);
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.monday } });
  return c;
}

const journalOf = async (type: string) => (await h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type } })).map((e) => JSON.stringify(e.payload));

describe('V5.6 — préférences (E11) et GET sans rien d’enregistré', () => {
  it('GET /v1/preferences/outings sans préférences → 200, valeurs par défaut avec mon quartier', async () => {
    const p = await person('itv56pref', 'WOMAN');
    const g = await p.call('GET', '/v1/preferences/outings');
    expect(g.status, JSON.stringify(g.body)).toBe(200);
    expect(g.body).toMatchObject({ neighborhoodIds: [nbId], maxTravelMinutes: 30, ambiance: 'ANY', everyOtherWeekOffFrom: null, everyOtherWeekendOffFrom: null });
    // « Un week-end sur deux » (B.13).
    const put = await p.call('PUT', '/v1/preferences/outings', { groupAge: { min: 20, max: 40 }, availableSlotTemplateIds: [], weeksOff: [], activities: [], neighborhoodIds: [nbId], maxTravelMinutes: 30, everyOtherWeekendOffFrom: '2026-W47' });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    expect(put.body.everyOtherWeekendOffFrom).toBe('2026-W47');
  });

  it('« Âge pour une histoire » et horizon enfants (dont « j’en ai déjà ») ; réservés à « une histoire »', async () => {
    const p = await person('itv56story', 'WOMAN');
    await p.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] });
    const ok = await p.call('PUT', '/v1/preferences/intentions', { lookingFor: 'STORY', storySeriousness: 'SERIOUS', kidsSomeday: null, kidsHorizon: 'HAS_ALREADY', storyAgeBrackets: ['26_29', '30_34'], meetingMode: 'GROUP', meetGenders: [], romanceGenders: ['MAN'] });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body).toMatchObject({ kidsHorizon: 'HAS_ALREADY', storyAgeBrackets: ['26_29', '30_34'] });
    expect((await h.db.matchPreferences.findUniqueOrThrow({ where: { userId: p.userId } })).storyAgeBrackets).toEqual(['26_29', '30_34']);
    const bad = await p.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, storyAgeBrackets: ['26_29'], meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] });
    expect(bad.status).toBe(400);
  });
});

describe('V5.6 — deux groupes au même créneau : fiabilité, vue, déplacement, sortie pour sécurité', () => {
  let ps: TestClient[] = [];
  let outings: { id: string; seats: { userId: string; id: string; funding: string | null }[] }[] = [];

  it('composition de deux groupes ; confirmation ; la vue ne sert jamais la fiabilité d’autrui (E24) ; §7.5', async () => {
    const genders: ('WOMAN' | 'MAN')[] = ['WOMAN', 'MAN', 'WOMAN', 'MAN', 'WOMAN', 'MAN', 'WOMAN', 'MAN', 'WOMAN', 'MAN'];
    ps = [];
    for (let i = 0; i < genders.length; i++) ps.push(await person(`itv56g${i}`, genders[i]!, i === 9 ? nb2 : nbId));
    // La personne du 20e accepte les lieux du 11e par le temps de trajet (20 min ≤ 30), sans quartier saisi.
    h.clock.set(T.monday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
    await run('outings.compose', T.composed);
    const rows = await h.db.outing.findMany({ where: { venueId }, include: { seats: true }, orderBy: { id: 'asc' } });
    expect(rows.length).toBe(2);
    for (const o of rows) for (const s of o.seats) {
      const p = ps.find((x) => x.userId === s.userId)!;
      expect((await p.call('POST', `/v1/outings/${o.id}/seat/accept`, { funding: 'AUTO' })).status).toBe(200);
    }
    await run('outings.lifecycle', T.locked);
    outings = (await h.db.outing.findMany({ where: { venueId }, include: { seats: true }, orderBy: { id: 'asc' } })).map((o) => ({ id: o.id, seats: o.seats.map((s) => ({ userId: s.userId, id: s.id, funding: s.funding })) }));
    expect((await h.db.outing.findMany({ where: { venueId } })).every((o) => o.status === 'CONFIRMED')).toBe(true);
    for (const o of outings) {
      for (const s of o.seats) {
        const v = (await ps.find((x) => x.userId === s.userId)!.call('GET', `/v1/outings/${o.id}`)).body;
        expect(v.members.length).toBeGreaterThan(0);
        expect(JSON.stringify(v.members)).not.toMatch(/reliability|NEWCOMER|attended/);
        expect(v.oncall).toEqual({ covered: true });
        expect(v.activityChosenBy).toBe('VENUE_AND_GROUP');
        expect(v.venue.ambiance).toBe('CALM');
        if (s.userId === ps[9]!.userId) expect(v.venue.travelMinutes).toBe(20);
        else expect(v.venue.travelMinutes).toBeUndefined();
      }
    }
    // La fiabilité reste lisible par soi.
    expect((await ps[0]!.call('GET', '/v1/me/reliability')).status).toBe(200);
  });

  it('V5.8 (§3) : un numéro écrit dans le chat est masqué pour le groupe jusqu’aux visages, puis servi', async () => {
    const o = outings[0]!;
    const [sa, sb] = [o.seats[0]!, o.seats[1]!];
    const a = ps.find((x) => x.userId === sa.userId)!;
    const b = ps.find((x) => x.userId === sb.userId)!;
    const conv = await h.db.conversation.findUniqueOrThrow({ where: { outingId: o.id } });
    h.clock.set(new Date(T.locked.getTime() + 60_000));
    const sent = await a.call('POST', `/v1/conversations/${conv.id}/messages`, { clientMessageId: 'v58-phone-0001', body: 'Mon numéro : 06 12 34 56 78, à jeudi !' });
    expect(sent.status, JSON.stringify(sent.body)).toBeLessThan(300);
    await h.drain();
    const mine = (await a.call('GET', `/v1/conversations/${conv.id}/messages`)).body.items.find((m: any) => m.clientMessageId === 'v58-phone-0001');
    expect(mine.body).toContain('06 12 34 56 78');
    // La modération signale déjà le numéro (message « averti », masqué par défaut) ; si la personne choisit de l'afficher,
    // le numéro reste masqué jusqu'aux visages.
    const warned = (await b.call('GET', `/v1/conversations/${conv.id}/messages`)).body.items.find((m: any) => m.id === mine.id);
    expect(warned).toMatchObject({ warned: true, body: null });
    const shown = await b.call('POST', `/v1/messages/${mine.id}/reveal`, {});
    expect(shown.body.body, JSON.stringify(shown.body)).toBe('Mon numéro : [numéro masqué jusqu’aux visages], à jeudi !');
    const before = (await b.call('GET', `/v1/conversations/${conv.id}/messages`)).body.items.find((m: any) => m.id === mine.id);
    expect(before.body).toBe('Mon numéro : [numéro masqué jusqu’aux visages], à jeudi !');
    h.clock.set(T.faces);
    const after = (await b.call('GET', `/v1/conversations/${conv.id}/messages`)).body.items.find((m: any) => m.id === mine.id);
    expect(after.body).toContain('06 12 34 56 78');
  });

  it('E18 : « je connais quelqu’un » (lien connu) → déplacé·e vers l’autre groupe du créneau, financement gardé, aucune pénalité', async () => {
    const [a, b] = outings as [(typeof outings)[number], (typeof outings)[number]];
    const genderOf = async (u: string) => (await h.db.profile.findUniqueOrThrow({ where: { userId: u } })).gender;
    const bGenders = await Promise.all(b.seats.map((s) => genderOf(s.userId)));
    // Une personne de A dont le genre compte ≤ 2 dans B (≤ 3 du même genre), et quelqu'un de A qu'elle connaît.
    let mover: { userId: string; id: string; funding: string | null } | null = null;
    for (const s of a.seats) {
      const g = await genderOf(s.userId);
      if (bGenders.filter((x) => x === g).length <= 2) {
        mover = s;
        break;
      }
    }
    expect(mover).not.toBeNull();
    const known = a.seats.find((s) => s.userId !== mover!.userId)!;
    const [lo, hi] = [mover!.userId, known.userId].sort();
    await h.db.avoidPair.create({ data: { userLowId: lo!, userHighId: hi!, createdAt: T.monday } });
    h.clock.set(T.faces);
    const p = ps.find((x) => x.userId === mover!.userId)!;
    const r = await p.call('POST', `/v1/outings/${a.id}/seat/knows-someone`, { userId: known.userId });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ status: 'MOVED', newOutingId: b.id });
    await h.drain();
    const moved = await h.db.outingSeat.findUniqueOrThrow({ where: { outingId_userId: { outingId: b.id, userId: mover!.userId } } });
    expect(moved).toMatchObject({ status: 'CONFIRMED', funding: mover!.funding });
    expect(await h.db.outingSeat.findUniqueOrThrow({ where: { id: mover!.id } })).toMatchObject({ status: 'CANCELLED', cancelKind: 'SAFETY_EXIT', refundState: 'NONE' });
    expect((await p.call('GET', `/v1/outings/${b.id}`)).status).toBe(200);
    expect((await p.call('GET', '/v1/me/reliability')).body.total).toBe(0);
    // Même lieu (autre table) : aucune compensation pour ce déplacement.
    expect((await journalOf('VENUE_COMPENSATION')).filter((x) => x.includes(mover!.id))).toHaveLength(0);
    // E23 : au-delà d'1 déplacement par mois → sortie pour raison de sécurité, remboursée, examinée (jamais une absence).
    const other = (await h.db.outingSeat.findMany({ where: { outingId: b.id, status: 'CONFIRMED', userId: { not: mover!.userId } } }))[0]!;
    const r2 = await p.call('POST', `/v1/outings/${b.id}/seat/knows-someone`, { userId: other.userId });
    expect(r2.body).toEqual({ status: 'SAFETY_REVIEW' });
    await h.drain();
    await h.drain();
    expect(await h.db.outingSeat.findUniqueOrThrow({ where: { id: moved.id } })).toMatchObject({ status: 'CANCELLED', cancelKind: 'SAFETY_EXIT' });
    expect((await h.db.outingSeat.findUniqueOrThrow({ where: { id: moved.id } })).refundState).not.toBe('NOT_ELIGIBLE');
    expect((await p.call('GET', '/v1/me/reliability')).body.total).toBe(0);
    expect(await h.db.knowsSomeoneRequest.findUniqueOrThrow({ where: { seatId: moved.id } })).toMatchObject({ status: 'SAFETY_REVIEW' });
    // E22 : 3 € HT versés par Blowy au lieu pour la sortie de sécurité (après la confirmation).
    const comp = (await journalOf('VENUE_COMPENSATION')).filter((x) => x.includes(moved.id));
    expect(comp).toHaveLength(1);
    expect(comp[0]).toMatch(/"cause":"SAFETY"/);
    expect(comp[0]).toMatch(/"taxBasis":"HT"/);
    // Rejouer la même demande ne crée rien de plus.
    expect((await p.call('POST', `/v1/outings/${b.id}/seat/knows-someone`, { userId: other.userId })).status).toBeGreaterThanOrEqual(200);
    expect(await h.db.knowsSomeoneRequest.count({ where: { userId: mover!.userId } })).toBe(2);
  });
});

describe('V5.6 — astreinte (E12), partage (E16), espace lieu (E15/E19)', () => {
  it('E12 : créneaux générés seulement sous astreinte ; un créneau qui perd sa couverture est retiré', async () => {
    const repo = h.app.get<NeighborhoodsRepository>(NEIGHBORHOODS_REPOSITORY);
    const at = new Date('2026-11-23T08:00:00Z');
    const before = await h.db.venueSlot.count({ where: { venueId, startsAt: { gt: at } } });
    expect(await repo.generateSlots(at, 1, async () => false)).toBe(0);
    expect(await h.db.venueSlot.count({ where: { venueId, startsAt: { gt: at } } })).toBe(before);
    const created = await repo.generateSlots(at, 1, async () => true);
    expect(created).toBeGreaterThan(0);
    const w = await repo.watchCoverage(at, 14, async () => false);
    expect(w.removed).toBeGreaterThan(0);
    expect(await h.db.venueSlot.count({ where: { venueId, startsAt: { gt: at }, outings: { none: {} } } })).toBe(0);
    // Un créneau AVEC sorties qui perd sa couverture n'est jamais supprimé : escalade ops (dossier prioritaire, une fois).
    const lostAt = new Date('2026-11-18T00:00:00Z');
    const e1 = await repo.watchCoverage(lostAt, 14, async () => false);
    expect(e1.escalated).toBeGreaterThan(0);
    expect((await repo.watchCoverage(lostAt, 14, async () => false)).escalated).toBe(0);
    await h.drain();
    expect(await h.db.moderationCase.count({ where: { reasonCode: 'ONCALL_COVERAGE_LOST', priority: 1 } })).toBeGreaterThan(0);
  });

  it('E11 : sans valeur ops, trajet ESTIMÉ depuis les centres de quartier (jamais une position de personne)', async () => {
    const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
    const far = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-v56-sd', name: 'Saint-Denis', city: 'Saint-Denis', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE', centerLat: 48.9362, centerLng: 2.3574 } });
    await h.db.neighborhood.update({ where: { id: nbId }, data: { centerLat: 48.8532, centerLng: 2.3692 } });
    const { travelFrom } = await import('../../src/modules/outings/infrastructure/travel-times.js');
    const t = await travelFrom(h.db, far.id);
    expect(t.get(nbId)).toEqual({ minutes: 45, estimated: true });
    // La valeur ops prime (20e → 11e : 20 min saisis).
    expect((await travelFrom(h.db, nb2)).get(nbId)).toEqual({ minutes: 20, estimated: false });
  });

  it('E16 : un lien unique par carte ; page publique sans donnée personnelle ; inscription attribuée', async () => {
    const alex = await person('itv56alex', 'MAN');
    const a = await alex.call('POST', '/v1/share-links', { cardKind: 'INVITE' });
    expect(a.status, JSON.stringify(a.body)).toBe(200);
    const b = await alex.call('POST', '/v1/share-links', { cardKind: 'INVITE' });
    expect(b.body.slug).not.toBe(a.body.slug);
    expect(a.body.url).toMatch(new RegExp(`/s/${a.body.slug}$`));
    const pub = await new TestClient(h).call('GET', `/v1/public/s/${a.body.slug}`);
    expect(pub.status).toBe(200);
    expect(pub.body).toMatchObject({ valid: true, cardKind: 'INVITE' });
    expect(JSON.stringify(pub.body)).not.toMatch(/itv56|userId|firstName/);
    expect((await new TestClient(h).call('GET', '/v1/public/s/szzzzzzzzzzzzzzz')).body).toEqual({ valid: false, cardKind: null });
    const sarah = new TestClient(h);
    await sarah.signIn('itv56sarah');
    const claim = await sarah.call('POST', '/v1/referrals/claim', { ref: a.body.slug });
    expect(claim.status, JSON.stringify(claim.body)).toBe(200);
    const mine = (await alex.call('GET', '/v1/me/share-links')).body.items.find((l: any) => l.slug === a.body.slug);
    expect(mine).toMatchObject({ clickCount: 1, attributedSignups: 1, attributedFirstOutings: 0 });
  });

  it('E19 / E15 : l’espace lieu écrit ses tables (accès, contrat) ; contre-signature Blowy', async () => {
    const store = h.app.get<VenuePartnerStore>(VENUE_PARTNER_STORE);
    const uow = h.app.get<UnitOfWork>(UNIT_OF_WORK);
    const partner = await person('itv56venue', 'WOMAN');
    await uow.run(async (scope) => {
      await store.append(scope, venueId, { type: 'ACCESS_GRANTED', userId: partner.userId }, null);
      await store.append(scope, venueId, { type: 'CONTRACT_SIGNED', version: VENUE_CONTRACT_VERSION, signerName: 'Gérante IT', userId: partner.userId }, partner.userId);
      await store.append(scope, venueId, { type: 'DAY_SET', isoWeekday: 4, open: true, tables: 2, note: null }, partner.userId);
    });
    expect(await store.venuesOf(partner.userId)).toEqual([venueId]);
    expect(await h.db.venuePartnerEvent.count({ where: { venueId } })).toBe(3);
    expect(await h.db.venueWeekday.findUniqueOrThrow({ where: { venueId_isoWeekday: { venueId, isoWeekday: 4 } } })).toMatchObject({ open: true, tables: 2 });
    expect(await h.db.domainEvent.count({ where: { aggregateType: 'venue.partner' } })).toBe(0);
    const v = await h.db.venue.findUniqueOrThrow({ where: { id: venueId } });
    expect(v).toMatchObject({ contractVersion: VENUE_CONTRACT_VERSION, contractSignerName: 'Gérante IT', blowySignedAt: null });
    await uow.run(async (scope) => expect(await store.countersign(scope, venueId, 'Blowy Ops')).toMatchObject({ version: VENUE_CONTRACT_VERSION }));
    expect((await h.db.venue.findUniqueOrThrow({ where: { id: venueId } })).blowySignerName).toBe('Blowy Ops');
    await uow.run(async (scope) => {
      await store.append(scope, venueId, { type: 'ACCESS_REVOKED', userId: partner.userId }, null);
    });
    expect(await store.venuesOf(partner.userId)).toEqual([]);
  });
});

describe('V5.7 — accueil du lieu (E30), effectif (E29), relevé civil (E28), badge calme (E32)', () => {
  const ctx = (userId: string): VenuePartnerContext => ({ userId, sessionId: 'it', displayName: 'Gérante', venueIds: [venueId], sessionExpiresAt: new Date('2027-01-01T00:00:00Z'), requestId: null });

  it('message d’accueil : modèle, refus d’un lien ou d’un numéro, visible des seules places confirmées après la confirmation', async () => {
    const venue = h.app.get(VenuePartnerUseCases);
    const partner = (await h.db.user.findFirstOrThrow({ select: { id: true } })).id;
    const w0 = await venue.welcome(ctx(partner));
    expect(w0).toMatchObject({ text: null, maxChars: 280, visibleFrom: 'CONFIRMATION' });
    expect(w0.template).toMatch(/Bienvenue chez/);
    await expect(venue.setWelcome(ctx(partner), venueId, { text: 'Bienvenue ! Réservez sur www.exemple.fr' }, randomUUID())).rejects.toMatchObject({ detailsSafe: { reason: 'WELCOME_MESSAGE_REJECTED', issue: 'CONTAINS_LINK' } });
    await expect(venue.setWelcome(ctx(partner), venueId, { text: 'Appelez le 06 12 34 56 78' }, randomUUID())).rejects.toMatchObject({ detailsSafe: { reason: 'WELCOME_MESSAGE_REJECTED', issue: 'CONTAINS_PHONE' } });
    const text = 'Bienvenue au Café calme ! Votre table Blowy vous attend au fond à gauche. Demandez Marie si besoin.';
    await venue.setWelcome(ctx(partner), venueId, { text }, randomUUID());
    expect((await venue.welcome(ctx(partner))).text).toBe(text);
  });

  it('effectif sur la semaine en cours + suivante (jours sans table compris) ; relevé sur le mois civil du lieu', async () => {
    const venue = h.app.get(VenuePartnerUseCases);
    const partner = (await h.db.user.findFirstOrThrow({ select: { id: true } })).id;
    h.clock.set(new Date('2026-11-17T09:00:00Z'));
    const r = await venue.roster(ctx(partner));
    expect(r.days!.length).toBe(2); // jeudis 19 et 26 novembre (créneau type du jeudi)
    expect(r.days![0]).toMatchObject({ date: '2026-11-19', isoWeekday: 4 });
    expect(r.days![0]!.tables).toBeGreaterThan(0);
    expect(r.days![1]).toMatchObject({ date: '2026-11-26', tables: 0 });
    // 30 nov. 23 h 30 à Paris = 1ᵉʳ déc. en heure de Paris → relevé de décembre (jamais le mois UTC).
    h.clock.set(new Date('2026-11-30T23:30:00Z'));
    expect((await venue.statement(ctx(partner), venueId, undefined)).period).toBe('2026-12');
  });

  it('badge « je préfère le calme » : opt-in, visible du groupe sur le pet (fiche) ; absent par défaut', async () => {
    const seats = await h.db.outingSeat.findMany({ where: { outing: { venueId }, status: 'CONFIRMED' }, orderBy: { id: 'asc' } });
    const o = seats[0]!.outingId;
    const same = seats.filter((s) => s.outingId === o);
    const [a, b] = [same[0]!, same[1]!];
    const ca = new TestClient(h);
    await ca.signIn((await h.db.authIdentity.findFirstOrThrow({ where: { userId: a.userId } })).subject);
    const cb = new TestClient(h);
    await cb.signIn((await h.db.authIdentity.findFirstOrThrow({ where: { userId: b.userId } })).subject);
    h.clock.set(T.faces);
    const before = (await cb.call('GET', `/v1/outings/${o}`)).body;
    expect(before.members.find((m: any) => m.userId === a.userId).calm).toBeUndefined();
    const prefs = (await ca.call('GET', '/v1/preferences/outings')).body;
    expect(prefs.showCalmBadge).toBe(false);
    const put = await ca.call('PUT', '/v1/preferences/outings', { ...prefs, neighborhoodIds: prefs.neighborhoodIds.length ? prefs.neighborhoodIds : [nbId], showCalmBadge: true });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    const after = (await cb.call('GET', `/v1/outings/${o}`)).body;
    expect(after.members.find((m: any) => m.userId === a.userId).calm).toBe(true);
    // L'accueil du lieu figure sur la fiche des places confirmées.
    expect(after.venue.welcomeMessage).toMatch(/Bienvenue au Café calme/);
  });
});

describe('V5.8 (§2) — groupe incomplet à la confirmation = « Blowy annule »', () => {
  it('remboursement des places confirmées et 3 € HT par place réservée au lieu', async () => {
    const people = [await person('itv58u1', 'WOMAN'), await person('itv58u2', 'MAN'), await person('itv58u3', 'WOMAN')];
    const startsAt = new Date('2026-12-03T18:30:00Z');
    const lockAt = new Date('2026-12-02T17:00:00Z');
    const slot = await h.db.venueSlot.create({ data: { venueId, startsAt, activity: 'GAMES', capacityOutings: 3, reservedOutings: 1 } });
    const o = await h.db.outing.create({
      data: {
        neighborhoodId: nbId, weekKey: '2026-W49', venueSlotId: slot.id, venueId, activity: 'GAMES', startsAt, endsAt: new Date(startsAt.getTime() + 2 * 3_600_000), status: 'FORMING', capacity: 5,
        composedAt: new Date('2026-11-30T20:00:00Z'), acceptDeadline: new Date('2026-12-01T20:00:00Z'), lockAt, photoRevealAt: new Date(startsAt.getTime() - 3 * 3_600_000),
        checkinOpensAt: new Date(startsAt.getTime() - 30 * 60_000), checkinClosesAt: new Date(startsAt.getTime() + 90 * 60_000), votesCloseAt: new Date(startsAt.getTime() + 74 * 3_600_000), tuningVersion: 'it', algoVersion: 'it',
      },
    });
    for (const p of people) await h.db.outingSeat.create({ data: { outingId: o.id, userId: p.userId, weekKey: '2026-W49', status: 'CONFIRMED', funding: 'PLUS_INCLUDED', acceptDeadline: o.acceptDeadline, invitedAt: o.composedAt, confirmedAt: o.composedAt } });
    await run('outings.lifecycle', new Date(lockAt.getTime() + 60_000));
    await h.drain();
    expect(await h.db.outing.findUniqueOrThrow({ where: { id: o.id } })).toMatchObject({ status: 'CANCELLED', cancelReason: 'UNDERSIZED' });
    const comp = (await journalOf('VENUE_COMPENSATION')).filter((x) => x.includes(o.id));
    expect(comp).toHaveLength(3);
    for (const c of comp) expect(c).toMatch(/"cause":"BLOWY_CANCELLED"/);
  });
});
