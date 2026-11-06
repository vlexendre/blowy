/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/**
 * Intégration V5 T6 (vraie base, vrai graphe Nest, horloge contrôlée) :
 *  - ops : lecture des sorties sans montant ; annulation avec remboursement → step-up exigé, AuditLog
 *    dans la même transaction, rejeu idempotent ; support refusé ;
 *  - contestation acceptée → no-show corrigé, fiabilité rétablie ; levée de pause ;
 *  - espace lieu : accès accordé par ops (step-up), auth distincte (MFA, CSRF), sessions staff/mobile
 *    refusées, effectif = prénoms seulement dès la confirmation ; jour fermé (au-delà du préavis) et
 *    fermeture exceptionnelle → sortie annulée VENUE_UNAVAILABLE.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { startHarness, TestClient, type Harness } from '../../../../test/integration/harness.js';
import { deriveTotpSecret, stepOf, totpAt } from '../domain/totp.js';
import { loadAdminConfig } from '../infrastructure/admin-config.js';
import { PrismaVenuePartnerStore } from '../infrastructure/prisma-ops.repositories.js';
import { venueTotpSubject } from '../application/use-cases/venue-partner.use-cases.js';
import { StaffClient } from './staff-client.js';

let h: Harness;
const T0 = new Date('2026-11-02T10:00:00Z'); // lundi
const START = new Date('2026-11-05T18:30:00Z'); // jeudi 19 h 30 (Paris)
const LOCK = new Date('2026-11-04T17:00:00Z'); // mercredi 18 h
const AFTER_LOCK = new Date('2026-11-04T18:00:00Z');
const NAMES = ['Alex Martin', 'Tom', 'Léa', 'Malo', 'Sarah'];
let nbId = '';
let venueId = '';
const users: string[] = [];
/** V5.4 (C.12) : sortie confirmée annulée par Blowy (ops) — compensée 3 € par place réservée. */
let blowyCancelledId = '';

async function person(key: string, displayName: string) {
  const c = new TestClient(h);
  await c.signIn(key);
  await h.db.profile.upsert({ where: { userId: c.userId }, create: { userId: c.userId, displayName }, update: { displayName } });
  return c;
}

async function outing(o: { status: 'FORMING' | 'CONFIRMED' | 'DONE'; startsAt: Date; lockAt: Date; seatStatus: 'CONFIRMED' | 'ATTENDED' }) {
  const id = uuidv7();
  const slotId = uuidv7();
  await h.db.venueSlot.create({ data: { id: slotId, venueId, startsAt: o.startsAt, activity: 'GAMES', capacityOutings: 2, reservedOutings: 1 } });
  const H = 3_600_000;
  await h.db.outing.create({
    data: {
      id, neighborhoodId: nbId, weekKey: '2026-W45', venueSlotId: slotId, venueId, activity: 'GAMES', status: o.status, capacity: 5,
      startsAt: o.startsAt, endsAt: new Date(o.startsAt.getTime() + 2 * H), composedAt: T0, acceptDeadline: new Date(Math.min(T0.getTime() + 24 * H, o.lockAt.getTime())), lockAt: o.lockAt,
      photoRevealAt: new Date(o.startsAt.getTime() - 3 * H), checkinOpensAt: new Date(o.startsAt.getTime() - 30 * 60_000), checkinClosesAt: new Date(o.startsAt.getTime() + 90 * 60_000),
      votesCloseAt: new Date(o.startsAt.getTime() + 74 * H), tuningVersion: 'it', algoVersion: 'it',
    },
  });
  const seats: string[] = [];
  for (const u of users) {
    const sid = uuidv7();
    seats.push(sid);
    await h.db.outingSeat.create({ data: { id: sid, outingId: id, userId: u, weekKey: `it-${id.slice(-6)}`, status: o.seatStatus, funding: 'FREE_FIRST', acceptDeadline: T0, invitedAt: T0, confirmedAt: T0 } });
  }
  return { id, seats };
}

beforeAll(async () => {
  h = await startHarness(T0);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  nbId = (await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-ops-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } })).id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: nbId, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  venueId = (await h.db.venue.create({ data: { neighborhoodId: nbId, name: 'Café des Oiseaux', addressLine: '12 rue Oberkampf', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 2, accessibilityTags: [], checkinSecretRef: 'it-cafe' } })).id;
  for (const [i, n] of NAMES.entries()) users.push((await person(`it.ops.${i}`, n)).userId);
});
afterAll(async () => h?.close());

describe('back-office V5 : sorties', () => {
  it('ops annule avec step-up, audit dans la transaction, rejeu ; support refusé ; aucun montant pour ops', async () => {
    const o = await outing({ status: 'CONFIRMED', startsAt: START, lockAt: LOCK, seatStatus: 'CONFIRMED' });
    h.clock.set(AFTER_LOCK);
    const ops = await new StaffClient(h).login('staff.ops.1', ['ops' as never]);
    const support = await new StaffClient(h).login('staff.support.1', ['support']);

    const list = await ops.call('GET', '/v1/admin/outings');
    expect(list.status).toBe(200);
    expect(list.body.find((r: any) => r.id === o.id).confirmed).toBe(5);
    const detail = await ops.call('GET', `/v1/admin/outings/${o.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.seats.map((s: any) => s.firstName)).toEqual(['Alex', 'Tom', 'Léa', 'Malo', 'Sarah']);
    const json = JSON.stringify(detail.body);
    for (const k of ['refundState', 'funding', 'paymentRef', 'lookingFor', '"choice"', 'friendsOnly', 'lat', 'birthDate']) expect(json).not.toContain(k);

    expect((await support.call('POST', `/v1/admin/outings/${o.id}/cancel`, { kind: 'STAFF', reason: 'support essaie' })).status).toBe(403);
    const noStep = await ops.call('POST', `/v1/admin/outings/${o.id}/cancel`, { kind: 'STAFF', reason: 'lieu inondé' });
    expect(noStep.status).toBe(403);
    expect(noStep.body.detailsSafe.reason).toBe('STEP_UP_REQUIRED');

    await ops.stepUp();
    const cid = randomUUID();
    const done = await ops.call('POST', `/v1/admin/outings/${o.id}/cancel`, { kind: 'STAFF', reason: 'lieu inondé' }, { commandId: cid });
    expect(done.status, JSON.stringify(done.body)).toBe(201);
    expect(done.body.result).toMatchObject({ status: 'CANCELLED', affectedSeats: 5 });
    const again = await ops.call('POST', `/v1/admin/outings/${o.id}/cancel`, { kind: 'STAFF', reason: 'lieu inondé' }, { commandId: cid });
    expect(again.body.replayed).toBe(true);
    expect(await h.db.auditLog.count({ where: { action: 'outing.cancel', targetId: o.id } })).toBe(1);
    const row = await h.db.outing.findUniqueOrThrow({ where: { id: o.id } });
    expect(row.status).toBe('CANCELLED');
    expect(row.cancelReason).toBe('STAFF');
    const seats = await h.db.outingSeat.findMany({ where: { outingId: o.id } });
    expect(seats.every((s) => s.status === 'CANCELLED' && s.cancelKind === 'SYSTEM_REMOVAL')).toBe(true);
    // Aucune fiabilité touchée par une annulation Blowy.
    expect(await h.db.reliabilityEvent.count({ where: { userId: { in: users } } })).toBe(0);
    // V5.4 (C.12) : Blowy annule une sortie CONFIRMÉE → le lieu reçoit 3 € par place réservée (5 places), une fois.
    blowyCancelledId = o.id;
    await h.drain();
    const comp = await h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: 'VENUE_COMPENSATION' } });
    const mine = comp.filter((e) => (e.payload as any).refs?.outingId === o.id || (e.payload as any).outingId === o.id || JSON.stringify(e.payload).includes(o.id));
    expect(mine).toHaveLength(5);
    expect(mine.every((e) => JSON.stringify(e.payload).includes('BLOWY_CANCELLED'))).toBe(true);
    await h.drain();
    expect((await h.db.domainEvent.findMany({ where: { aggregateType: 'economy.journal', type: 'VENUE_COMPENSATION' } })).filter((e) => JSON.stringify(e.payload).includes(o.id))).toHaveLength(5);
    // Seconde annulation : refusée (déjà terminale).
    const late = await ops.call('POST', `/v1/admin/outings/${o.id}/cancel`, { kind: 'STAFF', reason: 'lieu inondé' });
    expect(late.status).toBe(412);
  });

  it('contestation acceptée : no-show corrigé, fiabilité rétablie ; levée de pause motivée', async () => {
    const o = await outing({ status: 'DONE', startsAt: new Date('2026-10-29T18:30:00Z'), lockAt: new Date('2026-10-28T17:00:00Z'), seatStatus: 'ATTENDED' });
    const seat = o.seats[1]!;
    const userId = users[1]!;
    await h.db.outingSeat.update({ where: { id: seat }, data: { status: 'NO_SHOW' } });
    await h.db.reliabilityStat.upsert({ where: { userId }, create: { userId, attended: 0, noShows: 2, episodeAbsences: 0, pausedUntil: new Date('2026-11-10T00:00:00Z'), updatedAt: T0 }, update: { attended: 0, noShows: 2, pausedUntil: new Date('2026-11-10T00:00:00Z') } });
    const dispute = await h.db.attendanceDispute.create({ data: { seatId: seat, userId, note: 'j’étais là, le code ne marchait pas', createdAt: T0 } });
    h.clock.set(AFTER_LOCK);
    const tl = await new StaffClient(h).login('staff.tl.1', ['trust_lead']);
    const view = await tl.call('GET', '/v1/admin/attendance');
    expect(view.status).toBe(200);
    expect(view.body.absences.some((a: any) => a.dispute?.id === dispute.id)).toBe(true);
    expect(view.body.pauses.some((p: any) => p.userId === userId)).toBe(true);
    expect((await tl.call('POST', `/v1/admin/attendance/disputes/${dispute.id}/decision`, { accept: true, reason: 'code chevalet en panne' })).status).toBe(403);
    await tl.stepUp();
    const r = await tl.call('POST', `/v1/admin/attendance/disputes/${dispute.id}/decision`, { accept: true, reason: 'code chevalet en panne' });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(r.body.result).toMatchObject({ status: 'ACCEPTED', corrected: 'NO_SHOW' });
    expect((await h.db.outingSeat.findUniqueOrThrow({ where: { id: seat } })).status).toBe('ATTENDED');
    const rel = await h.db.reliabilityStat.findUniqueOrThrow({ where: { userId } });
    expect(rel).toMatchObject({ attended: 1, noShows: 1, pausedUntil: null });
    expect(await h.db.auditLog.count({ where: { action: 'attendance.dispute_accept', targetId: dispute.id } })).toBe(1);
    // Plus de pause → levée refusée (412).
    expect((await tl.call('POST', `/v1/admin/reliability/${userId}/lift-pause`, { reason: 'déjà levée' })).status).toBe(412);
  });
});

describe('espace lieu partenaire', () => {
  const store = () => new PrismaVenuePartnerStore(h.db);
  type Call = (method: string, path: string, body?: unknown, csrf?: string | null) => Promise<{ status: number; body: any }>;
  async function partnerSession(key: string): Promise<{ login: { status: number; body: any }; session: string; call: Call }> {
    const c = new StaffClient(h);
    const l = await c.raw('POST', '/v1/venue/auth/login', { provider: 'local', credential: key });
    if (l.status !== 200) return { login: l, session: '', call: () => Promise.reject(new Error('pas de session')) };
    const pending = { 'x-blowy-venue-pending': l.body.pendingToken };
    if (!l.body.mfaEnrolled) expect((await c.raw('POST', '/v1/venue/auth/mfa/enroll', {}, pending)).status).toBe(200);
    const userId = (await h.db.authIdentity.findUniqueOrThrow({ where: { provider_subject: { provider: 'LOCAL', subject: key } } })).userId;
    const st = await store().partnerMfa(userId);
    const code = totpAt(deriveTotpSecret(loadAdminConfig({ BLOWY_ENV: 'test' } as NodeJS.ProcessEnv).staffMfaKey, venueTotpSubject(userId), st.generation), stepOf(h.clock.now()));
    const v = await c.raw('POST', '/v1/venue/auth/mfa/verify', { code }, pending);
    expect(v.status, JSON.stringify(v.body)).toBe(200);
    h.clock.advance(31_000);
    const call = (method: string, path: string, body?: unknown, csrf: string | null = v.body.csrfToken) =>
      c.raw(method, path, body, { 'x-blowy-venue-session': v.body.sessionToken, ...(method !== 'GET' ? { 'idempotency-key': randomUUID(), ...(csrf ? { 'x-blowy-venue-csrf': csrf } : {}) } : {}) });
    return { login: l, session: v.body.sessionToken as string, call };
  }

  it('accès par ops (step-up), auth distincte, effectif = prénoms seulement dès la confirmation', async () => {
    // Sessions lieu courtes (inactivité 15 min) : la confirmation tombe 10 min après l'ouverture de session.
    h.clock.set(new Date('2026-11-11T16:45:00Z'));
    const confirmed = await outing({ status: 'CONFIRMED', startsAt: new Date('2026-11-12T18:30:00Z'), lockAt: new Date('2026-11-11T17:00:00Z'), seatStatus: 'CONFIRMED' });
    const partner = await person('partner.cafe', 'Nadia Comptoir');
    const outsider = await person('partner.other', 'Paul');
    void outsider;

    // Non partenaire : refusé (401), sans dire pourquoi.
    expect((await partnerSession('partner.cafe')).login.status).toBe(401);
    const ops = await new StaffClient(h).login('staff.ops.2', ['ops' as never]);
    const grant = { provider: 'local', subject: 'partner.cafe', grant: true, reason: 'contrat signé ce jour' };
    expect((await ops.call('POST', `/v1/admin/venues/${venueId}/partners`, grant)).status).toBe(403);
    await ops.stepUp();
    expect((await ops.call('POST', `/v1/admin/venues/${venueId}/partners`, grant)).status).toBe(201);

    const p = await partnerSession('partner.cafe');
    expect(p.login.status).toBe(200);
    // Session lieu ≠ session staff ≠ bearer mobile.
    expect((await ops.raw('GET', '/v1/admin/auth/me', undefined, { 'x-blowy-staff-session': p.session })).status).toBe(401);
    expect((await ops.raw('GET', '/v1/venue/roster', undefined, { 'x-blowy-venue-session': ops.session })).status).toBe(401);
    expect((await partner.call('GET', '/v1/venue/roster')).status).toBe(401);

    // Avant la confirmation : nombre seulement, aucun prénom.
    const before = await p.call('GET', '/v1/venue/roster');
    expect(before.status, JSON.stringify(before.body)).toBe(200);
    const t0 = before.body.tables.find((t: any) => t.outingId === confirmed.id);
    expect(t0.firstNames).toEqual([]);
    expect(t0.code).toBeNull();

    h.clock.set(new Date('2026-11-11T17:01:00Z'));
    const after = await p.call('GET', '/v1/venue/roster');
    expect(after.status, JSON.stringify(after.body)).toBe(200);
    const t1 = after.body.tables.find((t: any) => t.outingId === confirmed.id);
    expect(t1).toMatchObject({ status: 'CONFIRMED', confirmedCount: 5, firstNames: ['Alex', 'Léa', 'Malo', 'Sarah', 'Tom'] });
    expect(t1.code).toMatch(/^\d{4}$/);
    const json = JSON.stringify(after.body);
    for (const u of users) expect(json).not.toContain(u);
    for (const k of ['Martin', 'userId', 'age', 'pet', 'funding', 'reliab', 'face', 'gender']) expect(json).not.toContain(k);

    // CSRF obligatoire sur une mutation ; accès à un autre lieu = 404.
    expect((await p.call('PUT', '/v1/venue/schedule/cap', { tables: 2 }, null)).status).toBe(403);
    expect((await p.call('GET', `/v1/venue/roster?venueId=${randomUUID()}`)).status).toBe(404);

    // Contrat : signature de la version courante, auditée.
    const c = await p.call('GET', '/v1/venue/contract');
    expect(c.body.signed).toBeNull();
    expect((await p.call('POST', '/v1/venue/contract/sign', { version: c.body.version, signerName: 'Nadia' })).status).toBe(201);
    expect((await p.call('GET', '/v1/venue/contract')).body.signed.signerName).toBe('Nadia');
    expect(await h.db.auditLog.count({ where: { action: 'venue.contract_signed', actorRole: 'venue_partner' } })).toBe(1);

    // Signalement d'un participant par prénom → file ops (échéance 1 h).
    expect((await p.call('POST', '/v1/venue/incidents', { outingId: confirmed.id, firstName: 'Tom', motive: 'REFUSED_TO_PAY', note: 'est parti sans payer' })).status).toBe(201);
    const reports = await ops.call('GET', '/v1/admin/reports-v5');
    expect(reports.status).toBe(200);
    expect(reports.body.venues[0]).toMatchObject({ firstName: 'Tom', motive: 'REFUSED_TO_PAY', overdue: false });

    // V5.4 (C.12) « Signaler un participant » (route dédiée) : prénom seulement, sortie DU lieu, après la confirmation.
    const rep = await p.call('POST', `/v1/venue/outings/${confirmed.id}/participant-reports`, { firstName: 'Léa', motive: 'BEHAVIOR', note: 'propos déplacés au comptoir' });
    expect(rep.status, JSON.stringify(rep.body)).toBe(201);
    expect(Object.keys(rep.body.result ?? rep.body)).toEqual(['id']);
    expect((await p.call('POST', `/v1/venue/outings/${confirmed.id}/participant-reports`, { firstName: 'Inconnu', motive: 'OTHER', note: 'personne de ce nom' })).status).toBe(404);
    expect((await p.call('POST', `/v1/venue/outings/${randomUUID()}/participant-reports`, { firstName: 'Léa', motive: 'OTHER', note: 'autre sortie inconnue' })).status).toBe(404);
    // Aucune autre donnée acceptée (contrat strict) ; aucune session staff / mobile.
    expect((await p.call('POST', `/v1/venue/outings/${confirmed.id}/participant-reports`, { firstName: 'Léa', motive: 'OTHER', note: 'champ en trop', userId: users[2] })).status).toBe(400);
    expect((await ops.raw('POST', `/v1/venue/outings/${confirmed.id}/participant-reports`, { firstName: 'Léa', motive: 'OTHER', note: 'session staff' }, { 'x-blowy-venue-session': ops.session, 'idempotency-key': randomUUID() })).status).toBe(401);
    expect((await ops.call('GET', '/v1/admin/reports-v5')).body.venues.some((v: any) => v.firstName === 'Léa' && v.motive === 'BEHAVIOR')).toBe(true);
    // L'outbox vers l'équipe ne porte que des identifiants (ni prénom ni note).
    const ob = await h.db.outboxEvent.findMany({ where: { topic: 'venue.participant_reported' } });
    expect(ob.length).toBeGreaterThanOrEqual(1);
    for (const e of ob) expect(JSON.stringify(e.payload)).not.toMatch(/Léa|Tom|comptoir|payer/);

    // V5.4 (C.12) : relevé MENSUEL agrégé par sortie (aucun prénom ni financement) ; la sortie annulée par Blowy y figure.
    const st = await p.call('GET', '/v1/venue/statement?period=2026-11');
    expect(st.status, JSON.stringify(st.body)).toBe(200);
    expect(st.body.lines.find((l: any) => l.outingId === blowyCancelledId)).toMatchObject({ seats: 5, reservedSeats: 5, attended: 0, amountCents: 1500, cancelledByBlowy: true });
    expect(st.body.taxBasis).toBe('HT');
    for (const k of ['firstName', 'userId', 'funding', 'Alex']) expect(JSON.stringify(st.body)).not.toContain(k);

    // Fermeture exceptionnelle le jour de la sortie : annulation VENUE_UNAVAILABLE, remboursée.
    const close = await p.call('POST', '/v1/venue/schedule/closures', { date: '2026-11-12', note: 'dégât des eaux' });
    expect(close.status, JSON.stringify(close.body)).toBe(201);
    expect(close.body.result.cancelledOutings).toBe(1);
    expect((await h.db.outing.findUniqueOrThrow({ where: { id: confirmed.id } })).cancelReason).toBe('VENUE_UNAVAILABLE');

    // Jour fermé : les créneaux au-delà du préavis passent à 0 table.
    const day = await p.call('PUT', '/v1/venue/schedule/days', { isoWeekday: 4, open: false, note: 'coup de feu, fermé' });
    expect(day.status, JSON.stringify(day.body)).toBe(200);
    const far = await h.db.venueSlot.findFirst({ where: { venueId, startsAt: new Date('2026-11-19T18:30:00Z') } });
    expect(far?.capacityOutings).toBe(0);
    const sched = await p.call('GET', '/v1/venue/schedule');
    expect(sched.body.days.find((d: any) => d.isoWeekday === 4)).toMatchObject({ open: false, note: 'coup de feu, fermé', times: null });

    // Révocation par ops (nouveau step-up : le précédent a expiré) : la session lieu tombe immédiatement.
    await ops.stepUp();
    expect((await ops.call('POST', `/v1/admin/venues/${venueId}/partners`, { ...grant, grant: false, reason: 'fin de contrat test' })).status).toBe(201);
    expect((await p.call('GET', '/v1/venue/roster')).status).toBe(401);
  });
});
