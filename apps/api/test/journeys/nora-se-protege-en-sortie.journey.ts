/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — J9 « Nora se protège en sortie » (spec-v5 §2.6 D-025, §3.1, §11.3 T4 ; V5.1 G.19 ; V5.2 C.8,
 * C.10 ; V5.3 B.7–9). Nora, Victor, Jade, Tom et Camille confirment jeudi. Victor écrit dans le chat
 * qu'il va « dire à tout le monde » qui est Nora : elle le signale (menace d'outing) et le bloque.
 *  - Victor est retiré (message neutre, remboursé, aucune fiabilité) ; Nora ne fait rien ;
 *  - le groupe voit seulement « Victor ne pourra pas venir » ; Victor ne voit plus rien de Nora ;
 *  - à la confirmation (veille 18 h), Tom voit prénoms, tranches d'âge et pets (sans visages) et
 *    signale en privé qu'il connaît Jade → examen humain → retiré sans pénalité ;
 *  - les visages (J −3 h) sont servis avec le filigrane du prénom de celle qui regarde ;
 *  - Camille part « mal à l'aise » pendant la sortie : sans pénalité, staff prévenu ;
 *  - Victor et Nora ne sont jamais recomposés ensemble la semaine suivante.
 * Écrit par l'agent E (T4) à la demande de l'orchestrateur (habituellement réservé à H).
 */
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { ADMIN_TRUST, type AdminTrustPort } from '../../src/shared/application/ports/admin-trust.port.js';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, CYCLE, formOuting, leaksIn, outing, v5Person, type City } from './support/v5.js';

let w: World;
let c: City;
let [nora, victor, jade, tom, camille]: Person[] = [];
let outingId = '';
let convId = '';
const S = story('v5-nora-en-sortie', 'V5 J9 : Nora se protège en sortie');

beforeAll(async () => {
  w = await startWorld('J_V5_NORA', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-nora', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Nora se protège en sortie', () => {
  S.step('Cinq personnes confirment jeudi ; le chat de groupe s\'ouvre', async () => {
    const specs = [
      ['nora', 'Nora', 'WOMAN', 'Luna'],
      ['victor', 'Victor', 'MAN', 'Moka'],
      ['jade', 'Jade', 'WOMAN', 'Praline'],
      ['tom', 'Tom', 'MAN', 'Réglisse'],
      ['camille', 'Camille', 'WOMAN', 'Myrtille'],
    ] as const;
    const ps: Person[] = [];
    for (const [k, n, g, pet] of specs) ps.push(await v5Person(w, { key: `j9.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: pet }, c));
    [nora, victor, jade, tom, camille] = ps;
    outingId = await formOuting(w, ps);
    const v = (await outing(nora!, outingId)).data;
    expect(v.status).toBe('FORMING');
    convId = v.conversationId;
    expect(convId).toBeTruthy();
  });

  S.step('Victor a créé un lien gardien ; il menace Nora dans le chat', async () => {
    expect((await victor!.call('POST', '/v1/safety/guardian-links', { subject: { kind: 'OUTING', id: outingId } })).ok).toBe(true);
    const m = await victor!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: randomUUID(), body: 'Je vais dire à tout le monde qui tu es vraiment, Nora' });
    S.note(`message de Victor : ${m.status}`);
  });

  S.step('Nora signale (menace d\'outing) et bloque Victor depuis la fiche de sortie : un seul geste', async () => {
    const r = await nora!.call('POST', '/v1/reports', { target: { outing: { id: outingId, userId: victor!.userId } }, category: 'OUTING_THREAT', note: 'Menace de révéler mon orientation', alsoBlock: true });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    expect(r.data).toMatchObject({ category: 'OUTING_THREAT', blocked: true });
    await w.drain();
  });

  S.step('Victor est retiré : remboursé, aucune absence, message neutre ; il ne voit plus rien du groupe', async () => {
    const vs = await w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: victor!.userId } });
    expect(vs).toMatchObject({ status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL' });
    expect((await victor!.call('GET', '/v1/me/reliability')).data).toMatchObject({ total: 0 });
    const vv = (await outing(victor!, outingId)).data;
    expect(vv.members ?? []).toEqual([]);
    expect(vv.conversationId).toBeUndefined();
    expect(JSON.stringify(vv)).not.toMatch(/Nora|bloqu|OUTING_THREAT|report/i);
    expect(await victor!.phone.join(`outing:${outingId}`)).toBe(false);
    // Notification neutre (planificateur T8) : ni motif, ni qui.
    const ev = await w.db.outboxEvent.findFirstOrThrow({ where: { topic: 'outing.composition_changed', aggregateId: vs.id } });
    expect(JSON.stringify(ev.payload)).not.toMatch(/nora|block|report|OUTING_THREAT/i);
    // Son lien gardien est révoqué.
    expect(await w.db.guardianLink.count({ where: { ownerUserId: victor!.userId, revokedAt: null } })).toBe(0);
  });

  S.step('Nora ne fait rien : sa place est intacte ; le groupe voit « Victor ne pourra pas venir », sans motif', async () => {
    expect((await w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: nora!.userId } })).status).toBe('CONFIRMED');
    for (const p of [nora!, jade!, tom!, camille!]) {
      const v = (await outing(p, outingId)).data;
      const vic = v.members.find((m: any) => m.userId === victor!.userId);
      if (p === nora) expect(vic === undefined || vic.notComing === true).toBe(true);
      else expect(vic).toMatchObject({ notComing: true });
      expect(JSON.stringify(v)).not.toMatch(/OUTING_THREAT|SYSTEM_REMOVAL|bloqu|signal/i);
      expect(leaksIn(v.members)).toEqual([]);
    }
    expect((await outing(jade!, outingId)).data.confirmedCount).toBe(4);
  });

  S.step('Confirmation (veille 18 h) : prénoms, tranches d\'âge et pets visibles, sans visages ; Tom signale en privé qu\'il connaît Jade', async () => {
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    const tv = (await outing(tom!, outingId)).data;
    expect(tv.status).toBe('CONFIRMED');
    const j = tv.members.find((m: any) => m.userId === jade!.userId);
    expect(j).toMatchObject({ firstName: 'Jade' });
    expect(j.ageRange).toBeDefined();
    expect(j.pet).toBeDefined();
    expect(j.photo).toBeUndefined();
    expect(tv.knowsSomeoneAvailable).toBe(true);
    const k = await tom!.call('POST', `/v1/outings/${outingId}/seat/knows-someone`, { userId: jade!.userId });
    expect(k.data).toEqual({ status: 'IN_REVIEW' });
    await w.drain();
    // Jade n'en sait rien.
    expect(JSON.stringify((await outing(jade!, outingId)).data)).not.toMatch(/IN_REVIEW|connai|KNOWS_SOMEONE/);
  });

  S.step('Un humain examine (< 1 h) : accepté → Tom retiré sans pénalité, remboursé', async () => {
    const seat = await w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: tom!.userId } });
    const cas = await w.db.moderationCase.findFirstOrThrow({ where: { subjectType: 'OUTING', subjectId: seat.id, reasonCode: 'KNOWS_SOMEONE_REVIEW' } });
    expect(cas.dueAt.getTime() - cas.createdAt.getTime()).toBe(3_600_000);
    const r = await w.app.get<AdminTrustPort>(ADMIN_TRUST).resolveKnowsSomeone({ staffUserId: nora!.userId, roles: ['trust_lead'] }, seat.id, { accept: true, reason: 'Ex-collègue en conflit, confirmé', commandId: randomUUID() });
    expect(r.status).toBe('MOVED');
    await w.drain();
    expect(await w.db.outingSeat.findUniqueOrThrow({ where: { id: seat.id } })).toMatchObject({ status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL' });
    expect((await tom!.call('GET', '/v1/me/reliability')).data.total).toBe(0);
  });

  S.step('J −3 h : les visages apparaissent, filigranés au prénom de celle qui regarde', async () => {
    await at(w, CYCLE.faces);
    const v = (await outing(jade!, outingId)).data;
    const n = v.members.find((m: any) => m.userId === nora!.userId);
    expect(n.photo?.url).toMatch(/\/v1\/media\/content\/[0-9a-f]{64}$/);
    const seen = await fetch(`${w.baseUrl}${new URL(n.photo.url).pathname}`);
    expect(seen.status).toBe(200);
    expect(seen.headers.get('cache-control')).toContain('no-store');
    const bytes = Buffer.from(await seen.arrayBuffer());
    const own = await nora!.raw('GET', `/v1/media/${n.photo.mediaId}/content?variant=thumbnail`);
    expect(Buffer.compare(bytes, own.buf)).not.toBe(0);
    expect((await sharp(bytes).metadata()).format).toBe('jpeg');
    // Victor (retiré, bloqué) n'a aucun accès au visage de Nora.
    expect((await victor!.raw('GET', `/v1/media/${n.photo.mediaId}/content?variant=thumbnail`)).status).toBe(404);
  });

  S.step('Pendant la sortie, Camille part « mal à l\'aise » : sans pénalité, le staff est prévenu', async () => {
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    const r = await camille!.call('POST', '/v1/safety/leave', { subject: { kind: 'OUTING', id: outingId }, notifyGuardian: false });
    expect(r.data).toEqual({ left: true, guardianNotified: false, humanResponseMinutes: 60, callbackTargetMinutes: 5 });
    await w.drain();
    expect((await camille!.call('GET', '/v1/me/reliability')).data.total).toBe(0);
    const seat = await w.db.outingSeat.findFirstOrThrow({ where: { outingId, userId: camille!.userId } });
    expect(await w.db.moderationCase.count({ where: { subjectType: 'OUTING', subjectId: seat.id, reasonCode: 'UNEASY_LEAVE' } })).toBe(1);
    const nv = (await outing(nora!, outingId)).data;
    expect(nv.members.find((m: any) => m.userId === camille!.userId)).toMatchObject({ notComing: true });
    expect(JSON.stringify(nv)).not.toMatch(/mal à l|UNEASY|SAFETY/);
  });

  S.step('La semaine suivante, Nora et Victor ne sont jamais recomposés ensemble', async () => {
    const blocked = await w.db.block.findFirst({ where: { blockerId: nora!.userId, blockedId: victor!.userId } });
    expect(blocked).not.toBeNull();
    const shared = await w.db.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT count(*)::bigint AS n FROM "OutingSeat" a JOIN "OutingSeat" b ON a."outingId" = b."outingId" WHERE a."userId" = $1::uuid AND b."userId" = $2::uuid AND a.status IN ('INVITED','HELD','CONFIRMED','CHECKED_IN') AND b.status IN ('INVITED','HELD','CONFIRMED','CHECKED_IN')`,
      nora!.userId,
      victor!.userId,
    );
    expect(Number(shared[0]!.n)).toBe(0);
    S.note('Recomposition de la semaine W48 non rejouée ici : le filtre BLOCKED de la composition est couvert par les tests de @blowy/matching et outings-v5 (intégration).');
  });
});
