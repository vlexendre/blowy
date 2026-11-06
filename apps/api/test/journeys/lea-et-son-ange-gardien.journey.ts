/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — J10 « Léa et son ange gardien » (spec-v5 §2.9, §3.2, §11.3 T4 ; V5.1 G.19–21 ; V5.3 A.4, B.9).
 * Léa sort jeudi avec quatre inconnu·es. Elle envoie un lien à sa sœur Maud (sans compte, sans app).
 * Ce que voit Maud, à chaque moment : le rendez-vous (avant J-1, pas de lieu) ; le lieu au
 * verrouillage ; « arrivée à 19 h 34 », « tout va bien » ; l'alerte (lieu et heure, JAMAIS de
 * position) ; jamais personne d'autre du groupe. Le staff (trust_lead) voit l'alerte en moins d'1 h.
 * Révocation et expiration → même 404. Un lien perdu n'est jamais ré-émis (jeton jamais en clair).
 * Écrit par l'agent E (T4) à la demande de l'orchestrateur (habituellement réservé à H).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { ADMIN_MODERATION, ADMIN_TRUST, type AdminModerationPort, type AdminTrustPort } from '../../src/shared/application/ports/admin-trust.port.js';
import { publicCall, type Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, checkIn, city, CYCLE, formOuting, v5Person, type City } from './support/v5.js';

let w: World;
let c: City;
let [lea, hugo, ines, malo, sarah]: Person[] = [];
let outingId = '';
let url = '';
let token = '';
let alertId = '';
const S = story('v5-ange-gardien', 'V5 J10 : Léa et son ange gardien');
const subject = () => ({ kind: 'OUTING', id: outingId });
const maud = () => publicCall(w, 'GET', `/v1/public/guardian/${token}`);
const trustLead = { staffUserId: '', roles: ['trust_lead' as const] };

beforeAll(async () => {
  w = await startWorld('J_V5_ANGE', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-ange', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Léa et son ange gardien', () => {
  S.step('Cinq personnes confirment la sortie de jeudi ; Léa n\'a pas encore de lien', async () => {
    const specs = [
      ['lea', 'Léa', 'WOMAN', 'Praline'],
      ['hugo', 'Hugo', 'MAN', 'Moka'],
      ['ines', 'Inès', 'WOMAN', 'Luna'],
      ['malo', 'Malo', 'MAN', 'Réglisse'],
      ['sarah', 'Sarah', 'WOMAN', 'Myrtille'],
    ] as const;
    const ps: Person[] = [];
    for (const [k, n, g, pet] of specs) ps.push(await v5Person(w, { key: `j10.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: pet }, c));
    [lea, hugo, ines, malo, sarah] = ps;
    outingId = await formOuting(w, ps);
    const st = await lea!.call('GET', `/v1/safety/status?subjectKind=OUTING&subjectId=${outingId}`);
    expect(st.data).toMatchObject({ active: false, activeGuardianLinks: 0, support: { humanResponseMinutes: 60 } });
    trustLead.staffUserId = hugo!.userId; // identifiant d'acteur pour l'audit (rôle passé par le port)
  });

  S.step('Léa crée un lien « Maud » : l\'URL n\'est rendue qu\'une fois ; un inconnu ne peut pas en créer', async () => {
    const r = await lea!.call('POST', '/v1/safety/guardian-links', { subject: subject(), label: 'Maud' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    url = r.data.url;
    expect(url).toMatch(/\/ange\/[A-Za-z0-9_-]{43}$/);
    token = url.split('/ange/')[1]!;
    const list = await lea!.call('GET', `/v1/safety/guardian-links?subjectKind=OUTING&subjectId=${outingId}`);
    expect(list.data.items).toEqual([expect.objectContaining({ label: 'Maud', revoked: false, lastViewedAt: null })]);
    expect(JSON.stringify(list.data)).not.toContain(token);
    const stranger = await v5Person(w, { key: 'j10.stranger', displayName: 'Victor', gender: 'MAN', seeking: [], looking: 'FRIENDS' }, c);
    expect((await stranger.call('POST', '/v1/safety/guardian-links', { subject: subject() })).status).toBe(404);
  });

  S.step('Avant J-1, Maud voit le rendez-vous de Léa : jour et heure, pas de lieu, personne d\'autre', async () => {
    const r = await maud();
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ownerFirstName: 'Léa', kind: 'OUTING', active: false, timeline: [] });
    expect(r.body.venue).toBeUndefined();
    const text = JSON.stringify(r.body);
    for (const n of ['Hugo', 'Inès', 'Malo', 'Sarah', 'Moka', 'Luna', 'members', 'confirmedCount', 'reliability']) expect(text).not.toContain(n);
    expect((await lea!.call('GET', `/v1/safety/guardian-links?subjectKind=OUTING&subjectId=${outingId}`)).data.items[0].lastViewedAt).not.toBeNull();
  });

  S.step('Mercredi 18 h (verrouillage) : Maud voit le lieu', async () => {
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    const r = await maud();
    expect(r.body.venue).toEqual({ name: 'Café Paris 11e', address: '12 rue Oberkampf, 75011 Paris' });
    expect(r.body.active).toBe(false);
  });

  S.step('Jeudi : Léa arrive (check-in) puis dit « tout va bien » ; Maud voit « arrivée » et « tout va bien », jamais « en route »', async () => {
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    expect((await checkIn(lea!, outingId)).ok).toBe(true);
    await w.advance(20 * 60_000);
    expect((await lea!.call('POST', '/v1/safety/ok', { subject: subject() })).ok).toBe(true);
    const r = await maud();
    expect(r.body.active).toBe(true);
    expect(r.body.timeline.map((e: any) => e.type)).toEqual(['CHECKED_IN', 'OK']);
    expect(JSON.stringify(r.body)).not.toMatch(/en route|EN_ROUTE|Hugo|Inès/);
  });

  S.step('Léa demande de l\'aide (position jointe) : Maud voit l\'alerte, le lieu et l\'heure — jamais de position ; Léa reçoit l\'accusé', async () => {
    await w.advance(30 * 60_000);
    // V5.6 (E14) : aucune position acceptée — un ancien client qui en joint une reçoit un 400 explicite.
    expect((await lea!.call('POST', '/v1/safety/alerts', { subject: subject(), position: { lat: 48.86493, lng: 2.37069, accuracyM: 12 } })).status).toBe(400);
    const r = await lea!.call('POST', '/v1/safety/alerts', { subject: subject() });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    expect(r.data).toMatchObject({ emergencyNumbers: ['112', '17'], humanResponseMinutes: 60 });
    alertId = r.data.alertId;
    await w.drain();
    expect(await lea!.phone.waitFor((e) => e.type === 'safety.alert_ack')).not.toBeNull();
    const v = await maud();
    expect(v.body.alert).toEqual({ at: w.clock.now().toISOString() });
    expect(v.body.venue.name).toBe('Café Paris 11e');
    expect(JSON.stringify(v.body)).not.toMatch(/48\.86|2\.37|position|accuracy/);
    // Le reste du groupe n'en sait rien.
    for (const p of [hugo!, ines!, malo!, sarah!]) expect(JSON.stringify((await p.call('GET', `/v1/outings/${outingId}`)).data)).not.toMatch(/alert|SAFETY|aide/i);
  });

  S.step('Le staff : trust_lead voit l\'alerte dans la file (échéance 1 h) sur lecture motivée et auditée — aucune position n\'a été collectée (D-050)', async () => {
    const t = w.app.get<AdminTrustPort>(ADMIN_TRUST);
    const list = await t.listSafetyAlerts(trustLead, { status: 'OPEN', limit: 20 });
    const item = list.items.find((a) => a.id === alertId)!;
    expect(item).toMatchObject({ userId: lea!.userId, positionAttached: false, overdue: false });
    expect(new Date(item.slaDueAt).getTime() - new Date(item.createdAt).getTime()).toBe(3_600_000);
    await expect(t.listSafetyAlerts({ staffUserId: trustLead.staffUserId, roles: ['support'] }, { limit: 5 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const d = await t.getSafetyAlert(trustLead, alertId, { justification: 'Rappel de Léa par l’astreinte' });
    expect(d.position).toBeNull();
    const cases = await w.app.get<AdminModerationPort>(ADMIN_MODERATION).listCases({ staffUserId: trustLead.staffUserId, roles: ['moderator'] }, { status: 'OPEN', subjectType: 'SAFETY_ALERT', limit: 20 });
    expect(cases.items.find((x) => x.subjectId === alertId)).toMatchObject({ priority: 1 });
    await t.handleSafetyAlert(trustLead, alertId, { reason: 'Léa rappelée, raccompagnée', commandId: randomUUID() });
    expect((await t.getSafetyAlert(trustLead, alertId, { justification: 'Vérification de clôture' })).status).toBe('HANDLED');
  });

  S.step('Maud ne voit plus d\'alerte ouverte ; la sortie se termine', async () => {
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    await at(w, new Date(CYCLE.done.getTime() + 40 * 60_000)); // après endsAt (21 h 30)
    const r = await maud();
    expect(r.body.alert).toBeUndefined();
    expect(r.body.timeline.map((e: any) => e.type)).toEqual(['CHECKED_IN', 'OK', 'ALERT', 'ENDED']);
  });

  S.step('Révocation puis expiration : la même réponse 404 qu\'un jeton inconnu', async () => {
    const unknown = await publicCall(w, 'GET', `/v1/public/guardian/${'Z'.repeat(43)}`);
    expect(unknown.status).toBe(404);
    const second = await lea!.call('POST', '/v1/safety/guardian-links', { subject: subject(), label: 'Coloc' });
    const t2 = (second.data.url as string).split('/ange/')[1]!;
    const id = (await lea!.call('GET', `/v1/safety/guardian-links?subjectKind=OUTING&subjectId=${outingId}`)).data.items.find((i: any) => i.label === 'Maud').id;
    expect((await lea!.call('DELETE', `/v1/safety/guardian-links/${id}`)).ok).toBe(true);
    const revoked = await maud();
    expect({ s: revoked.status, c: revoked.body.code, m: revoked.body.message }).toEqual({ s: 404, c: unknown.body.code, m: unknown.body.message });
    expect((await publicCall(w, 'GET', `/v1/public/guardian/${t2}`)).status).toBe(200);
    await at(w, new Date(CYCLE.done.getTime() + 4 * 3_600_000)); // > endsAt + 3 h
    const expired = await publicCall(w, 'GET', `/v1/public/guardian/${t2}`);
    expect({ s: expired.status, c: expired.body.code, m: expired.body.message }).toEqual({ s: 404, c: unknown.body.code, m: unknown.body.message });
  });
});
