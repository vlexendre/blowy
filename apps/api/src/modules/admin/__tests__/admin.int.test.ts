/**
 * Intégration admin (§21 n°19) sur PostgreSQL réel (blowy_test) via le graphe Nest complet :
 *  - auth staff : MFA obligatoire, bearer mobile refusé, CSRF exigé, rôle interdit refusé ;
 *  - mutation auditée (AuditLog dans la même transaction) ; step-up exigé ;
 *  - tuning : publication versionnée + rollback (nouvelle version, historique conservé) ;
 *  - correction économique via ADMIN_ECONOMY (écriture ledger STAFF_CORRECTION, rejeu sans doublon) ;
 *  - vrai dossier modéré : signalement → décision REJECT, puis recours → résolution (via ports de E).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { DEFAULT_TUNING } from '@blowy/tuning';
import { startHarness, type Harness } from '../../../../test/integration/harness.js';
import { matchedPair } from '../../../../test/integration/fixtures.js';
import { StaffClient } from './staff-client.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
});
afterAll(async () => {
  await h?.close();
});
beforeEach(async () => {
  await h.reset();
});

const auditCount = (action: string) => h.db.auditLog.count({ where: { action } });

describe('auth staff', () => {
  it('refuse un non-staff, un bearer mobile, l’absence de MFA, de CSRF ou de permission', async () => {
    const notStaff = await new StaffClient(h).raw('POST', '/v1/admin/auth/login', { provider: 'local', credential: 'nobody' });
    expect(notStaff.status).toBe(401);

    const analyst = await new StaffClient(h).login('staff.analyst', ['analyst']);
    // Bearer mobile d'un compte staff : ignoré par l'admin.
    const mobile = await analyst.raw('POST', '/v1/auth/sessions', { provider: 'local', credential: 'staff.analyst', device: { platform: 'ios' } });
    const withBearer = await analyst.raw('GET', '/v1/admin/auth/me', undefined, { authorization: `Bearer ${mobile.body.accessToken}` });
    expect(withBearer.status).toBe(401);
    // Session staff : jamais acceptée par le guard mobile.
    const onMobile = await analyst.raw('GET', '/v1/me', undefined, { authorization: `Bearer ${analyst.session}` });
    expect(onMobile.status).toBe(401);

    const me = await analyst.call('GET', '/v1/admin/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.roles).toEqual(['analyst']);
    // Rôle interdit : analyst ne lit ni les utilisateurs ni la modération ni l'économie.
    expect((await analyst.call('GET', '/v1/admin/users')).status).toBe(403);
    expect((await analyst.call('GET', '/v1/admin/moderation/cases')).status).toBe(403);
    expect((await analyst.call('GET', '/v1/admin/economy/webhooks')).status).toBe(403);
    expect((await analyst.call('GET', '/v1/admin/dashboard')).status).toBe(200);

    const finance = await new StaffClient(h).login('staff.finance', ['finance']);
    // Finance ne lit pas le chat (contexte de dossier).
    expect((await finance.call('GET', `/v1/admin/moderation/cases/${randomUUID()}`)).status).toBe(403);
    // CSRF manquant sur une mutation.
    const noCsrf = await finance.call('POST', `/v1/admin/economy/users/${analyst.userId}/corrections`, { amount: 10, reason: 'test csrf' }, { csrf: null });
    expect(noCsrf.status).toBe(403);
    expect(noCsrf.body.detailsSafe?.reason).toBe('CSRF');
    // Session révoquée : refusée ensuite.
    expect((await finance.call('DELETE', '/v1/admin/auth/sessions/current')).status).toBe(204);
    expect((await finance.call('GET', '/v1/admin/auth/me')).status).toBe(401);
  });

  it('un code TOTP ne sert qu’une fois (anti-rejeu)', async () => {
    const s = await new StaffClient(h).login('staff.support', ['support']);
    const l = await s.raw('POST', '/v1/admin/auth/login', { provider: 'local', credential: 'staff.support' });
    expect(l.body.mfaEnrolled).toBe(true);
    // Rejoue le code du pas précédent (déjà consommé à la connexion) : refusé.
    h.clock.advance(-31_000);
    const st = await import('../infrastructure/prisma-staff.repository.js').then((m) => new m.PrismaStaffRepository(h.db).mfaState(s.userId));
    const { deriveTotpSecret, totpAt, stepOf } = await import('../domain/totp.js');
    const { loadAdminConfig } = await import('../infrastructure/admin-config.js');
    const code = totpAt(deriveTotpSecret(loadAdminConfig({ BLOWY_ENV: 'test' } as NodeJS.ProcessEnv).staffMfaKey, s.userId, st.generation), stepOf(h.clock.now()));
    const r = await s.raw('POST', '/v1/admin/auth/mfa/verify', { code }, { 'x-blowy-staff-pending': l.body.pendingToken });
    expect(r.status).toBe(401);
    h.clock.advance(31_000);
  });
});

describe('tuning versionné', () => {
  it('publie une version (step-up, audit), conserve l’historique et fait un rollback par nouvelle version', async () => {
    const content = await new StaffClient(h).login('staff.content', ['content_manager']);
    // content_manager : lecture du tuning seulement (rôle interdit pour l'écriture).
    expect((await content.call('GET', '/v1/admin/tuning')).status).toBe(200);
    expect((await content.call('POST', '/v1/admin/tuning/drafts', { payload: { version: 'bad' } })).status).toBe(403);
    const cm = await new StaffClient(h).login('staff.admin', ['admin']);
    expect((await cm.call('POST', '/v1/admin/tuning/drafts', { payload: { version: 'bad' } })).status).toBe(400);
    const v1 = { ...structuredClone(DEFAULT_TUNING), version: 'tuning-2026.11.101' } as Record<string, unknown>;
    (v1 as { coins: { missionDaily: number } }).coins.missionDaily = 25;
    const d1 = await cm.call('POST', '/v1/admin/tuning/drafts', { payload: v1, note: 'missions +5' });
    expect(d1.status).toBe(201);
    const id1 = d1.body.result.id as string;
    const diff = await cm.call('GET', `/v1/admin/tuning/versions/${id1}/diff`);
    expect(diff.body.changes.map((c: { path: string }) => c.path)).toEqual(expect.arrayContaining(['coins.missionDaily', 'version']));

    // Publication sans step-up : refusée.
    const noStep = await cm.call('POST', `/v1/admin/tuning/versions/${id1}/publish`, { reason: 'publication test' });
    expect(noStep.status).toBe(403);
    expect(noStep.body.detailsSafe.reason).toBe('STEP_UP_REQUIRED');
    await cm.stepUp();
    const cid = randomUUID();
    const pub = await cm.call('POST', `/v1/admin/tuning/versions/${id1}/publish`, { reason: 'publication test' }, { commandId: cid });
    expect(pub.status).toBe(201);
    // Double validation (même commandId) : rejouée, aucune seconde publication ni audit.
    const again = await cm.call('POST', `/v1/admin/tuning/versions/${id1}/publish`, { reason: 'publication test' }, { commandId: cid });
    expect(again.body.replayed).toBe(true);
    expect(await auditCount('tuning.publish')).toBe(1);

    const ov = await cm.call('GET', '/v1/admin/tuning');
    expect(ov.body.active.version).toBe('tuning-2026.11.101');
    expect(ov.body.simulator.available).toBe(false);

    // Rollback vers la version du package : nouvelle version copiée, publiée et auditée.
    const d0 = await cm.call('POST', '/v1/admin/tuning/drafts', { payload: { ...structuredClone(DEFAULT_TUNING), version: 'tuning-2026.11.100' } });
    const rb = await cm.call('POST', '/v1/admin/tuning/rollback', { targetVersionId: d0.body.result.id, newVersion: 'tuning-2026.11.102', reason: 'retour arrière' });
    expect(rb.status).toBe(201);
    expect(rb.body.result.previous).toBe('tuning-2026.11.101');
    const versions = (await cm.call('GET', '/v1/admin/tuning')).body.versions as { version: string; status: string }[];
    expect(versions.find((v) => v.version === 'tuning-2026.11.102')?.status).toBe('ACTIVE');
    expect(versions.find((v) => v.version === 'tuning-2026.11.101')?.status).toBe('SUPERSEDED');
    expect(await h.db.configVersion.count({ where: { kind: 'TUNING' } })).toBe(3);
    const audit = await h.db.auditLog.findFirst({ where: { action: 'tuning.rollback' } });
    expect(audit?.reason).toBe('retour arrière');
    expect(audit?.actorUserId).toBe(cm.userId);
  });
});

describe('économie', () => {
  it('correction motivée via ledger (STAFF_CORRECTION), step-up, rejeu sans doublon, jamais sur soi', async () => {
    const { a } = await matchedPair(h, 'eco');
    const fin = await new StaffClient(h).login('staff.finance2', ['finance']);
    const body = { amount: 150, reason: 'geste commercial ticket #42' };
    expect((await fin.call('POST', `/v1/admin/economy/users/${a.userId}/corrections`, body)).status).toBe(403);
    await fin.stepUp();
    const cid = randomUUID();
    const r1 = await fin.call('POST', `/v1/admin/economy/users/${a.userId}/corrections`, body, { commandId: cid });
    expect(r1.status).toBe(201);
    expect(r1.body.result.balance).toBe(150);
    const r2 = await fin.call('POST', `/v1/admin/economy/users/${a.userId}/corrections`, body, { commandId: cid });
    expect(r2.body.result.replayed).toBe(true);
    const entries = await h.db.ledgerEntry.findMany({ where: { userId: a.userId } });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ reason: 'STAFF_CORRECTION', source: 'STAFF', actorUserId: fin.userId, amount: 150 });
    const ledger = await fin.call('GET', `/v1/admin/economy/users/${a.userId}/ledger`);
    expect(ledger.body.balance).toBe(150);
    expect((await fin.call('POST', `/v1/admin/economy/users/${fin.userId}/corrections`, body)).status).toBe(403);
    expect(await auditCount('economy.correct_balance')).toBeGreaterThanOrEqual(1);
  });
});

describe('modération (ports de l’agent E)', () => {
  it('vrai dossier : signalement → décision REJECT ; recours → résolution ; signaleur jamais exposé', async () => {
    const { a, b, convId } = await matchedPair(h, 'mod');
    const sent = await b.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'mod-b-0001', body: 'Message synthétique publié, signalé ensuite' });
    expect(sent.status).toBeLessThan(300);
    await h.drain();
    const rep = await a.call('POST', '/v1/reports', { target: { messageId: sent.body.id }, category: 'HARASSMENT' });
    expect(rep.status).toBeLessThan(300);

    const support = await new StaffClient(h).login('staff.support2', ['support']);
    const mod = await new StaffClient(h).login('staff.moderator', ['moderator']);
    const list = await mod.call('GET', '/v1/admin/moderation/cases?status=OPEN');
    expect(list.status).toBe(200);
    const kase = list.body.items.find((c: { subjectId: string }) => c.subjectId === sent.body.id);
    expect(kase).toBeTruthy();
    expect(JSON.stringify(list.body)).not.toContain(a.userId); // signaleur absent
    // Support : lecture de la file mais pas de décision.
    expect((await support.call('POST', `/v1/admin/moderation/cases/${kase.id}/decisions`, { action: 'REJECT', reason: 'pas autorisé' })).status).toBe(403);

    const ctx = await mod.call('GET', `/v1/admin/moderation/cases/${kase.id}`);
    expect(ctx.status).toBe(200);
    expect(JSON.stringify(ctx.body)).not.toContain(a.userId);
    const dec = await mod.call('POST', `/v1/admin/moderation/cases/${kase.id}/decisions`, { action: 'REJECT', reason: 'harcèlement confirmé' });
    expect(dec.status).toBe(201);
    expect(await h.db.auditLog.count({ where: { action: 'moderation.decide.reject', targetId: kase.id } })).toBe(1);
    expect(await h.db.moderationDecision.count({ where: { subjectId: sent.body.id, source: 'HUMAN', action: 'REJECT' } })).toBe(1);

    // Recours de l'auteur → résolution par un rôle habilité.
    const ap = await b.call('POST', '/v1/appeals', { subjectType: 'MESSAGE', subjectId: sent.body.id });
    expect(ap.status).toBeLessThan(300);
    const appeals = await mod.call('GET', '/v1/admin/moderation/appeals?status=OPEN');
    const appeal = appeals.body.items.find((x: { id: string }) => x.id === ap.body.id);
    expect(appeal).toBeTruthy();
    const res = await mod.call('POST', `/v1/admin/moderation/appeals/${ap.body.id}/resolve`, { outcome: 'UPHELD', reason: 'décision maintenue après revue' });
    expect(res.status).toBe(201);
    expect((await h.db.appeal.findUniqueOrThrow({ where: { id: ap.body.id } })).status).toBe('UPHELD');
  });

  it('sanction de compte : trust_lead + step-up, moderator refusé, auditée', async () => {
    const { b } = await matchedPair(h, 'sanc');
    const mod = await new StaffClient(h).login('staff.moderator2', ['moderator']);
    expect((await mod.call('POST', `/v1/admin/users/${b.userId}/actions`, { kind: 'SUSPEND', reason: 'fraude manifeste' })).status).toBe(403);
    const tl = await new StaffClient(h).login('staff.trust', ['trust_lead']);
    expect((await tl.call('POST', `/v1/admin/users/${b.userId}/actions`, { kind: 'SUSPEND', reason: 'fraude manifeste' })).status).toBe(403);
    await tl.stepUp();
    const r = await tl.call('POST', `/v1/admin/users/${b.userId}/actions`, { kind: 'SUSPEND', reason: 'fraude manifeste' });
    expect(r.status).toBe(201);
    expect((await h.db.user.findUniqueOrThrow({ where: { id: b.userId } })).status).toBe('SUSPENDED');
    expect(await auditCount('users.suspend')).toBe(1);
  });
});

describe('missions et relations', () => {
  it('mission : récompenses bornées, publication versionnée, version publiée immuable', async () => {
    const cm = await new StaffClient(h).login('staff.content2', ['content_manager']);
    const draft = { key: 'veggie_test', titleKey: 'mission.healthy_meal', criteria: { visible: ['assiette'], photosExpected: 1, joint: false }, accessibleAlternative: null, linkXpMilli: 6000, petXpMilli: 20000, coins: 20 };
    expect((await cm.call('POST', '/v1/admin/missions', { ...draft, coins: 999_999 })).status).toBe(400);
    const c = await cm.call('POST', '/v1/admin/missions', draft);
    expect(c.status).toBe(201);
    await cm.stepUp();
    expect((await cm.call('POST', `/v1/admin/missions/${c.body.result.id}/publish`, { reason: 'mise en ligne' })).status).toBe(201);
    expect((await cm.call('PUT', `/v1/admin/missions/${c.body.result.id}`, draft)).status).toBe(412);
    const v2 = await cm.call('POST', '/v1/admin/missions', { ...draft, coins: 10 });
    expect(v2.body.result.version).toBe(2);
  });

  it('relation : timeline sans événements privés, réparation corrective auditée du seul niveau éligible', async () => {
    const { relId } = await matchedPair(h, 'rel');
    await h.db.relationshipContext.update({ where: { id: relId }, data: { eligibleLevel: 3 } }); // incohérence de test explicite
    const tl = await new StaffClient(h).login('staff.trust2', ['trust_lead']);
    const v = await tl.call('GET', `/v1/admin/relationships/${relId}`);
    expect(v.body.diagnostics.eligibleMismatch).toBe(true);
    await tl.stepUp();
    const before = await h.db.relationshipContext.findUniqueOrThrow({ where: { id: relId } });
    const r = await tl.call('POST', `/v1/admin/relationships/${relId}/repair`, { kind: 'RECOMPUTE_ELIGIBLE_LEVEL', reason: 'incohérence niveau' });
    expect(r.status).toBe(201);
    const after = await h.db.relationshipContext.findUniqueOrThrow({ where: { id: relId } });
    expect(after.eligibleLevel).toBe(1);
    expect(after.reachedLevel).toBe(before.reachedLevel);
    expect(after.xpMilli).toBe(before.xpMilli);
    expect(after.branch).toBe(before.branch);
    expect(await h.db.relationshipEvent.count({ where: { contextId: relId, type: 'relationship.staff_correction' } })).toBe(1);
  });
});
