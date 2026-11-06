/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T4 (agent E) — intégration `safety` + trust V5 + media (vraie base, vrai graphe Nest, horloge) :
 *  - lien ange gardien : jeton rendu une fois (jamais en clair en base, même dans l'idempotence),
 *    limite par sujet, page du proche (lieu au verrouillage, chronologie, alerte sans position), 404
 *    identique (inconnu / révoqué / expiré / place retirée), en-têtes no-store / noindex ;
 *  - alerte « besoin d'aide » : dossier SAFETY_ALERT prioritaire (échéance 1 h), Web Push sans
 *    contenu au proche abonné, file staff (trust_lead seul, lecture auditée), résolution ;
 *  - blocage pendant une sortie : retrait système de la personne bloquée (remboursée, sans
 *    fiabilité, « ne pourra pas venir »), liens gardien révoqués, signalements V5 avec contexte ;
 *  - « je connais quelqu'un » en examen → dossier → décision staff (retrait sans pénalité) ;
 *  - visages : filigrane serveur du prénom du regardeur ; consentement art. 9 révocable + purge ;
 *  - D-050 : aucune position d'alerte n'est jamais collectée (champ ignoré).
 */
import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { uuidv7 } from '@blowy/database';
import { GuardianPageViewSchema } from '@blowy/api-contract';
import { ADMIN_MODERATION, ADMIN_TRUST, type AdminModerationPort, type AdminTrustPort } from '../../src/shared/application/ports/admin-trust.port.js';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import { SAFETY_JOBS } from '../../src/modules/safety/safety.module.js';
import { GUARDIAN_PUSH_SENDER } from '../../src/modules/safety/application/ports/safety.ports.js';
import type { RecordingPushSender } from '../../src/modules/safety/infrastructure/web-push.sender.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, venueCodeOf, type Harness } from './harness.js';
import { raw, synthImage, uploadMedia } from './e-helpers.js';

let h: Harness;
const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  beforeLock: new Date('2026-11-18T10:00:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  faces: new Date('2026-11-19T15:31:00Z'),
  active: new Date('2026-11-19T17:00:00Z'), // jeu. 18 h locales : fenêtre active (startsAt − 2 h = 17 h 30 Paris)
  checkin: new Date('2026-11-19T18:05:00Z'),
  alert: new Date('2026-11-19T19:10:00Z'),
  expired: new Date('2026-11-20T00:31:00Z'), // endsAt 21 h 30 + 3 h → 00 h 30 Paris = 23 h 30 UTC
  week: '2026-W47',
};
let nbId = '';
const staff = { trust: { staffUserId: '', roles: ['trust_lead' as const] }, mod: { staffUserId: '', roles: ['moderator' as const] } };

beforeAll(async () => {
  h = await startHarness(T.monday, process.env.IT_DEBUG ? { LOG_LEVEL: 'error' } : {});
  await h.reset();
  nbId = await place('it-safety-main');
  const s1 = new TestClient(h);
  await onboard(s1, 'staff.trust', { gender: 'WOMAN', seeking: [] });
  staff.trust.staffUserId = s1.userId;
  staff.mod.staffUserId = s1.userId;
});
afterAll(async () => h?.close());

/** Chaque groupe a sa ville (zone) : une composition hebdo par ville et par semaine. */
async function place(slug: string): Promise<string> {
  const zone = await h.db.zone.create({ data: { code: slug.toUpperCase().replace(/-/g, '_'), name: slug, timezone: 'Europe/Paris' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug, name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café des Oiseaux', addressLine: '12 rue Oberkampf', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: slug } });
  return n.id;
}

const job = (token: symbol, name: string) => h.app.get<RecurringJob[]>(token).find((j) => j.name === name)!;
const at = async (d: Date) => {
  h.clock.set(d);
  await h.drain();
};
const run = async (name: string, d: Date) => {
  h.clock.set(d);
  await job(name.startsWith('safety') ? SAFETY_JOBS : OUTINGS_JOBS, name).run(d);
  await h.drain();
};
const adminTrust = () => h.app.get<AdminTrustPort>(ADMIN_TRUST);
const adminMod = () => h.app.get<AdminModerationPort>(ADMIN_MODERATION);
const pub = (token: string) => raw(h, new TestClient(h), 'GET', `/v1/public/guardian/${token}`);
const tokenOf = (url: string) => url.split('/ange/')[1]!;

async function person(key: string, gender: 'WOMAN' | 'MAN', name: string, withRealPhoto = false, nb = nbId) {
  h.clock.set(T.monday);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  await h.db.profile.update({ where: { userId: c.userId }, data: { displayName: name } });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nb })).status).toBe(200);
  expect((await c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] })).status).toBe(200);
  if (withRealPhoto) {
    const up = await uploadMedia(h, c, { purpose: 'PROFILE_PHOTO', mimeType: 'image/jpeg', bytes: await synthImage({ width: 640, height: 640, color: '#7a9' }) });
    expect(up.view.status).toBe('READY');
  } else {
    await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.monday } });
  }
  return c;
}

/** Cinq personnes, une sortie FORMING, toutes confirmées. */
async function formed(prefix: string, names: string[], realPhotos = false) {
  const ps: TestClient[] = [];
  const nb = await place(`it-s-${prefix}`);
  for (const [i, n] of names.entries()) ps.push(await person(`${prefix}${i}`, i % 2 ? 'MAN' : 'WOMAN', n, realPhotos && i < 2, nb));
  h.clock.set(T.monday);
  for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
  await run('outings.compose', T.composed);
  const id = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId as string;
  for (const p of ps) expect((await p.call('POST', `/v1/outings/${id}/seat/accept`, { funding: 'AUTO' })).status).toBe(200);
  await h.drain();
  return { ps, id };
}

describe('safety V5 (intégration)', () => {
  let lea: TestClient;
  let others: TestClient[] = [];
  let outingId = '';
  let token = '';
  let linkId = '';
  let alertId = '';
  const subject = () => ({ kind: 'OUTING', id: outingId });

  it('lien ange gardien : jeton rendu une fois, jamais en clair en base, limite par sujet, anti-IDOR', async () => {
    const g = await formed('itg', ['Léa', 'Hugo', 'Inès', 'Malo', 'Sarah'], true);
    [lea, ...others] = g.ps as [TestClient, ...TestClient[]];
    outingId = g.id;
    await at(T.composed);
    const key = randomUUID();
    const r = await lea.call('POST', '/v1/safety/guardian-links', { subject: subject(), label: 'Maman' }, { commandId: key });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    expect(r.body.url).toMatch(/\/ange\/[A-Za-z0-9_-]{43}$/);
    token = tokenOf(r.body.url);
    linkId = r.body.id;
    // Fenêtre : startsAt − 2 h → endsAt + 3 h.
    expect(r.body.activeFrom).toBe('2026-11-19T16:30:00.000Z');
    expect(r.body.expiresAt).toBe('2026-11-19T23:30:00.000Z');
    const row = await h.db.guardianLink.findUniqueOrThrow({ where: { id: linkId } });
    expect(row.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    // Le jeton n'existe nulle part en clair : ni dans le lien, ni dans la mémoire d'idempotence.
    const records = await h.db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "CommandRecord" WHERE "result"::text LIKE '%${token}%'`);
    expect(Number(records[0]!.n)).toBe(0);
    // Rejeu de la même clé : pas de second jeton, refus explicite.
    const replay = await lea.call('POST', '/v1/safety/guardian-links', { subject: subject(), label: 'Maman' }, { commandId: key });
    expect(replay.status).toBe(409);
    expect(replay.body.detailsSafe.reason).toBe('GUARDIAN_LINK_ALREADY_ISSUED');
    // Limite : 3 liens actifs par sujet.
    for (let i = 0; i < 2; i++) expect((await lea.call('POST', '/v1/safety/guardian-links', { subject: subject() })).status).toBe(201);
    const fourth = await lea.call('POST', '/v1/safety/guardian-links', { subject: subject() });
    expect(fourth.status).toBe(409);
    expect(fourth.body.detailsSafe.reason).toBe('GUARDIAN_LINK_LIMIT');
    // Liste sans URL ni jeton.
    const list = await lea.call('GET', `/v1/safety/guardian-links?subjectKind=OUTING&subjectId=${outingId}`);
    expect(list.body.items).toHaveLength(3);
    expect(JSON.stringify(list.body)).not.toMatch(/ange|url|token/i);
    // Sujet d'autrui : 404 neutre.
    const stranger = await person('itg.stranger', 'MAN', 'Victor');
    expect((await stranger.call('POST', '/v1/safety/guardian-links', { subject: subject() })).status).toBe(404);
    expect((await stranger.call('GET', `/v1/safety/status?subjectKind=OUTING&subjectId=${outingId}`)).status).toBe(404);
  });

  it('page du proche avant le verrouillage : rendez-vous prévu, pas de lieu, aucun autre participant', async () => {
    await at(T.beforeLock);
    const r = await pub(token);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toContain('no-store');
    expect(r.headers.get('x-robots-tag')).toContain('noindex');
    expect(r.headers.get('referrer-policy')).toBe('no-referrer');
    const v = GuardianPageViewSchema.parse(r.json());
    expect(v).toMatchObject({ ownerFirstName: 'Léa', kind: 'OUTING', active: false, timeline: [] });
    expect(v.venue).toBeUndefined();
    const text = r.buf.toString();
    for (const n of ['Hugo', 'Inès', 'Malo', 'Sarah', 'confirmedCount', 'members', 'capacity', 'reliability']) expect(text).not.toContain(n);
  });

  it('après le verrouillage : lieu ; fenêtre active : « tout va bien », arrivée (jamais « en route »)', async () => {
    await run('outings.lifecycle', T.locked);
    expect((await pub(token)).json().venue).toEqual({ name: 'Café des Oiseaux', address: '12 rue Oberkampf, 75011 Paris' });
    // Hors fenêtre : « tout va bien » refusé.
    expect((await lea.call('POST', '/v1/safety/ok', { subject: subject() })).body.detailsSafe.reason).toBe('SUBJECT_NOT_ACTIVE');
    await at(T.active);
    const st = await lea.call('GET', `/v1/safety/status?subjectKind=OUTING&subjectId=${outingId}`);
    expect(st.body).toMatchObject({ active: true, support: { humanResponseMinutes: 60, staffedNow: true }, activeGuardianLinks: 3, maxGuardianLinks: 3 });
    expect((await lea.call('POST', '/v1/safety/ok', { subject: subject() })).status).toBe(200);
    await run('outings.lifecycle', T.checkin);
    expect((await lea.call('POST', `/v1/outings/${outingId}/check-in`, { code: await venueCodeOf(h, outingId) })).status).toBe(200);
    const v = (await pub(token)).json();
    expect(v.active).toBe(true);
    expect(v.timeline.map((e: any) => e.type)).toEqual(['OK', 'CHECKED_IN']);
    expect(v.alert).toBeUndefined();
  });

  it('alerte « besoin d\'aide » : dossier prioritaire 1 h, page sans position (V5.3), Web Push sans contenu', async () => {
    const sub = await raw(h, new TestClient(h), 'POST', `/v1/public/guardian/${token}/push`, Buffer.from(JSON.stringify({ subscription: { endpoint: 'https://push.example.test/abc', keys: { p256dh: 'BPk', auth: 'xyz' } } })), { 'content-type': 'application/json' });
    expect(sub.status).toBe(204);
    // Seul l'endpoint est gardé (aucune clé).
    expect(Object.keys((await h.db.guardianPushSubscription.findFirstOrThrow({ where: { guardianLinkId: linkId } })) as object).sort()).toEqual(['createdAt', 'endpoint', 'guardianLinkId', 'id', 'purgeAfter']);
    await at(T.alert);
    // V5.6 (E14) : une position envoyée par un ancien client est refusée explicitement (400), jamais ignorée en silence.
    const before = await h.db.safetyAlert.count();
    expect((await lea.call('POST', '/v1/safety/alerts', { subject: subject(), position: { lat: 48.86491, lng: 2.37071, accuracyM: 18 } })).status).toBe(400);
    expect(await h.db.safetyAlert.count()).toBe(before);
    const a = await lea.call('POST', '/v1/safety/alerts', { subject: subject() });
    expect(a.status, JSON.stringify(a.body)).toBe(200);
    expect(a.body).toMatchObject({ emergencyNumbers: ['112', '17'], humanResponseMinutes: 60, callbackTargetMinutes: 5 });
    alertId = a.body.alertId;
    await h.drain();
    const c = await h.db.moderationCase.findFirstOrThrow({ where: { subjectType: 'SAFETY_ALERT', subjectId: alertId } });
    expect(c).toMatchObject({ priority: 1, reasonCode: 'SAFETY_ALERT', subjectUserId: lea.userId });
    expect(c.dueAt.getTime() - T.alert.getTime()).toBe(60 * 60_000);
    expect((h.app.get(GUARDIAN_PUSH_SENDER) as RecordingPushSender).sent).toContain('https://push.example.test/abc');
    expect((await h.db.safetyAlert.findUniqueOrThrow({ where: { id: alertId } })).ackAt).not.toBeNull();
    const r = await pub(token);
    const v = r.json();
    // V5.3 A.4 : le proche voit l'alerte, le lieu et l'heure — JAMAIS la position.
    expect(v.alert).toEqual({ at: T.alert.toISOString() });
    expect(v.venue.name).toBe('Café des Oiseaux');
    expect(r.buf.toString()).not.toMatch(/48\.86|2\.37|accuracy|position/);
    expect(v.timeline.at(-1)).toEqual({ type: 'ALERT', at: T.alert.toISOString() });
    // D-050 : la position envoyée par un ancien client est ignorée — rien en base, rien en mémoire d'idempotence.
    expect(await h.db.safetyAlert.findUniqueOrThrow({ where: { id: alertId } })).toMatchObject({ lat: null, lng: null, accuracyM: null });
    const rec = await h.db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "CommandRecord" WHERE "result"::text LIKE '%48.86491%'`);
    expect(Number(rec[0]!.n)).toBe(0);
  });

  it('staff : trust_lead seul lit l\'alerte (lecture auditée) ; aucune position n\'existe (D-050) ; le modérateur voit le dossier', async () => {
    await expect(adminTrust().listSafetyAlerts(staff.mod, { limit: 10 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const list = await adminTrust().listSafetyAlerts(staff.trust, { status: 'OPEN', limit: 10 });
    expect(list.items.find((x) => x.id === alertId)).toMatchObject({ positionAttached: false, overdue: false, slaDueAt: new Date(T.alert.getTime() + 3_600_000).toISOString() });
    expect(JSON.stringify(list)).not.toContain('48.86');
    await expect(adminTrust().getSafetyAlert(staff.trust, alertId, { justification: 'court' })).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    const d = await adminTrust().getSafetyAlert(staff.trust, alertId, { justification: 'Appel de Léa en cours (astreinte)' });
    expect(d.position).toBeNull();
    expect(await h.db.auditLog.count({ where: { action: 'safety.alert.read', targetId: alertId } })).toBe(1);
    const cases = await adminMod().listCases(staff.mod, { status: 'OPEN', subjectType: 'SAFETY_ALERT', limit: 10 });
    const sc = cases.items.find((x) => x.subjectId === alertId)!;
    const full = await adminMod().getCase(staff.mod, sc.id);
    expect(full.context.subject?.text).toContain('position jointe : non');
    expect(JSON.stringify(full)).not.toContain('48.86');
  });

  it('résolution « je vais bien » : l\'alerte disparaît de la page ; le dossier reste ouvert pour le suivi staff', async () => {
    h.clock.set(new Date(T.alert.getTime() + 5 * 60_000));
    expect((await lea.call('POST', `/v1/safety/alerts/${alertId}/resolve`, { status: 'SAFE' })).body).toEqual({ alertId, status: 'SAFE' });
    const v = (await pub(token)).json();
    expect(v.alert).toBeUndefined();
    expect(v.timeline.at(-1).type).toBe('OK');
    // D-050 : aucune position à purger ; la purge reste sans effet sur l'alerte.
    await run('safety.purge', new Date(T.alert.getTime() + 73 * 3_600_000));
    await adminTrust().handleSafetyAlert(staff.trust, alertId, { reason: 'Rappelée, tout va bien', commandId: randomUUID() });
    await run('safety.purge', new Date(T.alert.getTime() + 74 * 3_600_000));
    expect(await h.db.safetyAlert.findUniqueOrThrow({ where: { id: alertId } })).toMatchObject({ lat: null, lng: null, accuracyM: null });
    expect((await h.db.moderationCase.findFirstOrThrow({ where: { subjectType: 'SAFETY_ALERT', subjectId: alertId } })).status).toBe('RESOLVED');
  });

  it('404 identique : inconnu, mal formé, révoqué, expiré', async () => {
    h.clock.set(T.alert);
    const shape = (r: Awaited<ReturnType<typeof pub>>) => ({ status: r.status, code: r.json().code, message: r.json().message, cc: r.headers.get('cache-control') });
    const unknown = shape(await pub('A'.repeat(43)));
    expect(unknown.status).toBe(404);
    expect(shape(await pub('pas-un-jeton'))).toEqual(unknown);
    const second = await lea.call('GET', `/v1/safety/guardian-links?subjectKind=OUTING&subjectId=${outingId}`);
    const other = second.body.items.find((i: any) => i.id !== linkId);
    expect((await lea.call('DELETE', `/v1/safety/guardian-links/${linkId}`)).status).toBe(204);
    expect(shape(await pub(token))).toEqual(unknown);
    expect(await h.db.guardianPushSubscription.count({ where: { guardianLinkId: linkId } })).toBe(0);
    expect((await others[0]!.call('DELETE', `/v1/safety/guardian-links/${other.id}`)).status).toBe(404);
    h.clock.set(T.expired);
    const fresh = await h.db.guardianLink.findFirstOrThrow({ where: { id: other.id } });
    expect(fresh.expiresAt <= T.expired).toBe(true);
  });
});

describe('blocage pendant une sortie, signalements V5, « je connais quelqu\'un »', () => {
  let ps: TestClient[] = [];
  let id = '';

  it('Nora bloque Victor (sortie FORMING) : Victor retiré·e, remboursé·e, sans fiabilité ; Nora inchangée', async () => {
    const g = await formed('itb', ['Nora', 'Victor', 'Jade', 'Tom', 'Camille']);
    ps = g.ps;
    id = g.id;
    const [nora, victor, jade] = ps as [TestClient, TestClient, TestClient];
    await at(T.composed);
    const vl = await victor.call('POST', '/v1/safety/guardian-links', { subject: { kind: 'OUTING', id } });
    expect(vl.status).toBe(201);
    // Cible V5 : la personne vue dans la sortie ; un inconnu n'est pas désignable (404).
    const outsider = await person('itb.out', 'MAN', 'Ext');
    expect((await nora.call('POST', '/v1/blocks', { target: { outing: { id, userId: outsider.userId } } })).status).toBe(404);
    const b = await nora.call('POST', '/v1/reports', { target: { outing: { id, userId: victor.userId } }, category: 'OUTING_THREAT', note: 'menace de révéler', alsoBlock: true });
    expect(b.status, JSON.stringify(b.body)).toBe(201);
    expect(b.body).toMatchObject({ category: 'OUTING_THREAT', blocked: true });
    await h.drain();
    const vs = await h.db.outingSeat.findFirstOrThrow({ where: { outingId: id, userId: victor.userId } });
    expect(vs).toMatchObject({ status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL' });
    expect(['REFUNDED', 'RECREDITED', 'NONE', 'PENDING']).toContain(vs.refundState);
    expect((await h.db.outingSeat.findFirstOrThrow({ where: { outingId: id, userId: nora.userId } })).status).toBe('CONFIRMED');
    expect((await victor.call('GET', '/v1/me/reliability')).body).toMatchObject({ total: 0 });
    // Le groupe voit « ne pourra pas venir », sans motif ; Victor ne voit plus rien.
    const jv = (await jade.call('GET', `/v1/outings/${id}`)).body;
    expect(jv.members.find((m: any) => m.userId === victor.userId)).toMatchObject({ notComing: true });
    expect(JSON.stringify(jv)).not.toMatch(/SYSTEM_REMOVAL|OUTING_THREAT|bloqu/i);
    expect((await victor.call('GET', `/v1/outings/${id}`)).body.members ?? []).toEqual([]);
    // Liens gardien de Victor révoqués ; trace staff ; notification neutre planifiée.
    expect((await pub(tokenOf(vl.body.url))).status).toBe(404);
    expect(await h.db.safetySystemRemoval.count({ where: { outingId: id, removedUserId: victor.userId, triggeredByUserId: nora.userId, cause: 'BLOCK' } })).toBe(1);
    expect(await h.db.outboxEvent.count({ where: { topic: 'outing.composition_changed', aggregateId: vs.id } })).toBe(1);
    // Signalement : contexte sortie, dossier à 1 h ; le signalé n'est jamais informé.
    const rep = await h.db.report.findFirstOrThrow({ where: { reporterId: nora.userId, reportedUserId: victor.userId } });
    expect(rep.outingId).toBe(id);
    const c = await h.db.moderationCase.findFirstOrThrow({ where: { reportId: rep.id } });
    expect(c.dueAt.getTime() - rep.createdAt.getTime()).toBe(60 * 60_000);
  });

  it('incident sur place (sans personne visée) et absences répétées', async () => {
    const [nora, , jade] = ps as [TestClient, TestClient, TestClient];
    const inc = await nora.call('POST', '/v1/reports', { target: { outing: { id } }, category: 'ON_SITE_INCIDENT', note: 'serveur insistant' });
    expect(inc.status, JSON.stringify(inc.body)).toBe(201);
    expect(inc.body.category).toBe('ON_SITE_INCIDENT');
    const row = await h.db.safetyIncident.findFirstOrThrow({ where: { reporterId: nora.userId, outingId: id } });
    expect(row.venueId).not.toBeNull();
    expect((await h.db.moderationCase.findUniqueOrThrow({ where: { id: row.moderationCaseId! } })).subjectType).toBe('OUTING');
    // Sans personne visée, seul l'incident sur place est accepté.
    expect((await nora.call('POST', '/v1/reports', { target: { outing: { id } }, category: 'HARASSMENT' })).status).toBe(400);
    const outsider = await person('itb.out2', 'MAN', 'Ext2');
    expect((await outsider.call('POST', '/v1/reports', { target: { outing: { id } }, category: 'ON_SITE_INCIDENT' })).status).toBe(404);
    const rn = await nora.call('POST', '/v1/reports', { target: { outing: { id, userId: jade.userId } }, category: 'REPEATED_NO_SHOW' });
    expect(rn.status).toBe(201);
  });

  it('« je connais quelqu\'un » en examen → dossier prioritaire → décision staff : retrait sans pénalité', async () => {
    const [, , jade, tom] = ps as [TestClient, TestClient, TestClient, TestClient];
    await run('outings.lifecycle', T.locked);
    await at(T.faces);
    const k = await tom.call('POST', `/v1/outings/${id}/seat/knows-someone`, { userId: jade.userId });
    expect(k.status, JSON.stringify(k.body)).toBe(200);
    expect(k.body.status).toBe('IN_REVIEW');
    await h.drain();
    const seat = await h.db.outingSeat.findFirstOrThrow({ where: { outingId: id, userId: tom.userId } });
    const c = await h.db.moderationCase.findFirstOrThrow({ where: { subjectType: 'OUTING', subjectId: seat.id } });
    expect(c).toMatchObject({ reasonCode: 'KNOWS_SOMEONE_REVIEW', priority: 1 });
    await expect(adminTrust().resolveKnowsSomeone({ staffUserId: staff.trust.staffUserId, roles: ['analyst'] as any }, seat.id, { accept: true, reason: 'ex confirmé', commandId: randomUUID() })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const r = await adminTrust().resolveKnowsSomeone(staff.trust, seat.id, { accept: true, reason: 'Ex-compagne, conflit confirmé', commandId: randomUUID() });
    expect(r.status).toBe('MOVED');
    await h.drain();
    // V5.6 (A.1, E18) : « je connais quelqu'un » = sortie pour raison de sécurité (déplacement si un autre groupe du
    // créneau a une place ; sinon retrait remboursé, sans pénalité).
    expect(await h.db.outingSeat.findUniqueOrThrow({ where: { id: seat.id } })).toMatchObject({ status: 'CANCELLED', cancelKind: 'SAFETY_EXIT' });
    expect((await tom.call('GET', '/v1/me/reliability')).body.total).toBe(0);
    expect((await h.db.moderationCase.findUniqueOrThrow({ where: { id: c.id } })).status).toBe('RESOLVED');
    expect((await h.db.knowsSomeoneRequest.findFirstOrThrow({ where: { seatId: seat.id } })).status).toBe('ACCEPTED');
  });
});

describe('visages filigranés et consentement art. 9', () => {
  it('photo révélée en sortie : servie avec le filigrane du regardeur (octets différents de l\'original)', async () => {
    const g = await formed('itw', ['Alma', 'Bruno', 'Chloé', 'Dario', 'Elsa'], true);
    const [alma, bruno] = g.ps as [TestClient, TestClient];
    await run('outings.lifecycle', T.locked);
    // Avant la révélation : aucune photo.
    expect((await bruno.call('GET', `/v1/outings/${g.id}`)).body.members.find((m: any) => m.userId === alma.userId).photo).toBeUndefined();
    await at(T.faces);
    const m = (await bruno.call('GET', `/v1/outings/${g.id}`)).body.members.find((x: any) => x.userId === alma.userId);
    expect(m.photo?.url).toMatch(/\/v1\/media\/content\/[0-9a-f]{64}$/);
    const seen = await raw(h, new TestClient(h), 'GET', new URL(m.photo.url).pathname);
    expect(seen.status).toBe(200);
    expect(seen.headers.get('cache-control')).toContain('no-store');
    const own = await raw(h, alma, 'GET', `/v1/media/${m.photo.mediaId}/content?variant=thumbnail`);
    expect(own.status).toBe(200);
    expect(Buffer.compare(seen.buf, own.buf)).not.toBe(0);
    const meta = await sharp(seen.buf).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.exif).toBeUndefined();
  });

  it('genres recherchés : refusés sans consentement explicite ; retrait du consentement = purge immédiate', async () => {
    const c = await person('itc', 'WOMAN', 'Zoé');
    const set = (romance: string[]) => c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'BOTH', storySeriousness: 'SEE_HOW_IT_GOES', kidsSomeday: null, meetingMode: 'BOTH', meetGenders: [], romanceGenders: romance });
    const denied = await set(['MAN']);
    expect(denied.status).toBe(403);
    expect(denied.body.detailsSafe.purpose).toBe('SENSITIVE_PREFERENCES');
    expect((await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] })).status).toBeLessThan(300);
    expect((await set(['MAN'])).status).toBe(200);
    expect((await h.db.matchPreferences.findUniqueOrThrow({ where: { userId: c.userId } })).romanceGenders).toEqual(['MAN']);
    expect((await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: false }] })).status).toBeLessThan(300);
    const p = await h.db.matchPreferences.findUniqueOrThrow({ where: { userId: c.userId } });
    expect(p).toMatchObject({ romanceGenders: [], lookingFor: 'FRIENDS', storySeriousness: null });
    expect((await set(['MAN'])).status).toBe(403);
  });
});

describe('« Je pars, mal à l\'aise » (V5.3 B.9)', () => {
  it('sans pénalité, staff prévenu, gardien seulement si choisi, 3ᵉ départ → recontact humain', async () => {
    const g = await formed('itl', ['Rose', 'Paul', 'Mina', 'Noé', 'Ivy']);
    const [rose, paul] = g.ps as [TestClient, TestClient];
    await at(T.composed);
    const link = await rose.call('POST', '/v1/safety/guardian-links', { subject: { kind: 'OUTING', id: g.id } });
    const pl = await paul.call('POST', '/v1/safety/guardian-links', { subject: { kind: 'OUTING', id: g.id } });
    await run('outings.lifecycle', T.locked);
    await run('outings.lifecycle', T.checkin);
    expect((await rose.call('POST', `/v1/outings/${g.id}/check-in`, { code: await venueCodeOf(h, g.id) })).status).toBe(200);
    // Après le check-in, pendant la sortie : toujours possible.
    h.clock.set(new Date('2026-11-19T18:40:00Z'));
    const r = await rose.call('POST', '/v1/safety/leave', { subject: { kind: 'OUTING', id: g.id }, notifyGuardian: true });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ left: true, guardianNotified: true, humanResponseMinutes: 60, callbackTargetMinutes: 5 });
    await h.drain();
    expect(await h.db.outingSeat.findFirstOrThrow({ where: { outingId: g.id, userId: rose.userId } })).toMatchObject({ status: 'CANCELLED', cancelKind: 'SAFETY_EXIT' });
    expect((await rose.call('GET', '/v1/me/reliability')).body.total).toBe(0);
    const seat = await h.db.outingSeat.findFirstOrThrow({ where: { outingId: g.id, userId: rose.userId } });
    expect(await h.db.moderationCase.count({ where: { subjectType: 'OUTING', subjectId: seat.id, reasonCode: 'UNEASY_LEAVE' } })).toBe(1);
    // Le gardien de Rose garde sa page et voit « terminé » à l'heure du départ (elle l'a choisi).
    const v = (await pub(tokenOf(link.body.url))).json();
    expect(v.timeline.at(-1)).toEqual({ type: 'ENDED', at: '2026-11-19T18:40:00.000Z' });
    // Paul a déjà quitté deux sorties « mal à l'aise » : son 3ᵉ départ déclenche un recontact humain.
    for (let i = 0; i < 2; i++) await h.db.safetyUneasyLeave.create({ data: { userId: paul.userId, outingId: randomUUID(), seatId: randomUUID(), createdAt: T.monday } });
    // Il part sans prévenir son gardien : la page ne montre pas son départ.
    expect((await paul.call('POST', '/v1/safety/leave', { subject: { kind: 'OUTING', id: g.id } })).body.guardianNotified).toBe(false);
    await h.drain();
    const pv = await pub(tokenOf(pl.body.url));
    expect(pv.status).toBe(200);
    expect(pv.json().timeline.map((e: any) => e.type)).not.toContain('ENDED');
    expect(await h.db.moderationCase.count({ where: { subjectType: 'USER', subjectId: paul.userId, reasonCode: 'UNEASY_LEAVE_RECONTACT' } })).toBe(1);
    expect(await h.db.moderationCase.count({ where: { subjectType: 'USER', subjectId: rose.userId, reasonCode: 'UNEASY_LEAVE_RECONTACT' } })).toBe(0);
    // Le groupe voit seulement « ne pourra pas venir ».
    expect(JSON.stringify((await g.ps[2]!.call('GET', `/v1/outings/${g.id}`)).body)).not.toMatch(/SAFETY|mal à l|UNEASY/);
  });
});
