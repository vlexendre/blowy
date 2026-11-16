/**
 * Administration : accès réservé (403 pour toute autre adresse, sur chaque route), modération et journal,
 * suspension réellement appliquée, suppression par le chemin de « Supprimer mon compte », tâche quotidienne.
 */
import { randomUUID } from 'node:crypto';
import { type AdminClient, createAdminClient } from '@blowy/api-client';
import { adminRoutes } from '@blowy/contract';
import { addDays, dayOf } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AdminStatsJobs } from '../src/modules/admin/application/stats.jobs';
import type { DailyStatsRepository } from '../src/modules/admin/ports';
import { DAILY_STATS } from '../src/modules/admin/tokens';
import { MESSAGES } from '../src/shared/tokens';
import type { MessagesRepository } from '../src/modules/links/ports';
import { type TestWorld, apiError, onboardBody, startWorld } from './helpers';

const ADMIN = 'ops@blowy.app';

describe('administration', () => {
  let w: TestWorld;
  let admin: AdminClient;
  const asAdmin = (email: string) => createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${email}` });

  beforeAll(async () => {
    w = await startWorld({ ADMIN_EMAILS: ` Ops@Blowy.app , autre@blowy.app` });
    admin = asAdmin(ADMIN);
  });
  afterAll(() => w.close());

  describe('accès', () => {
    const routes: [string, string, unknown?][] = [
      ['GET', adminRoutes.me()],
      ['GET', adminRoutes.overview()],
      ['GET', adminRoutes.minimoas()],
      ['GET', adminRoutes.funnel()],
      ['GET', adminRoutes.reports()],
      ['GET', adminRoutes.report('1')],
      ['POST', adminRoutes.actions(), { action: 'warn', targetUserId: randomUUID(), reason: 'test' }],
      ['GET', adminRoutes.audit()],
      ['GET', adminRoutes.suspensions()],
      ['GET', adminRoutes.aiCosts()],
    ];
    const call = (method: string, path: string, body: unknown, token: string | null) =>
      fetch(w.baseUrl + path, {
        method,
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });

    it('sans jeton : 401 ; jeton d’une personne non autorisée : 403, sur chaque route', async () => {
      for (const [method, path, body] of routes) {
        expect((await call(method, path, body, null)).status, `${method} ${path}`).toBe(401);
        const res = await call(method, path, body, `test:${randomUUID()}:quelquun@exemple.fr`);
        expect(res.status, `${method} ${path}`).toBe(403);
        expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden');
        // Jeton sans e-mail du tout.
        expect((await call(method, path, body, `test:${randomUUID()}`)).status).toBe(403);
      }
    });

    it('adresse autorisée (casse et espaces ignorés) : accès', async () => {
      expect(await admin.me()).toEqual({ email: ADMIN, admin: true });
      expect(await asAdmin('autre@blowy.app').overview()).toMatchObject({ asOf: null });
    });
  });

  describe('modération', () => {
    it('signalement d’un message : contexte limité au message et à deux voisins de chaque côté', async () => {
      const lea = w.client(undefined, 'lea@exemple.fr');
      const tom = w.client(undefined, 'tom@exemple.fr');
      await lea.api.me.onboard(onboardBody({ displayName: 'Léa' }));
      await tom.api.me.onboard(onboardBody({ displayName: 'Tom' }));
      const invite = (await tom.api.me.get()).inviteCode;
      const link = await lea.api.invites.accept(invite);
      const bodies = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
      for (const [i, body] of bodies.entries()) {
        await (i % 2 === 0 ? tom : lea).api.links.send(link.id, { body });
        w.clock.advanceMinutes(1);
      }
      const messages = w.app.get<MessagesRepository>(MESSAGES, { strict: false });
      const page = await messages.page(link.id, null, 50);
      const reported = page.find((m) => m.body === 'cinq');
      expect(reported).toBeDefined();
      await lea.api.safety.report({ userId: tom.id, linkId: link.id, messageId: reported?.id, reason: 'harcelement', details: 'Il insiste.' });

      const list = await admin.reports({ status: 'open' });
      const item = list.items.find((r) => r.target?.id === tom.id);
      expect(item).toMatchObject({ reason: 'harcelement', status: 'open', overdue: false, hasMessage: true, reporter: { displayName: 'Léa' }, target: { displayName: 'Tom', openReports: 1 } });
      expect(list.targetHours).toBe(24);

      const detail = await admin.report(item?.id ?? '');
      const texts = detail.context.filter((m) => m.kind === 'text').map((m) => m.body);
      expect(texts).toEqual(['trois', 'quatre', 'cinq', 'six', 'sept']);
      expect(detail.context.find((m) => m.reported)?.body).toBe('cinq');
      expect(detail.context.find((m) => m.body === 'cinq')?.author).toBe('target');
      expect(detail.context.find((m) => m.body === 'quatre')?.author).toBe('reporter');

      // Recherche par prénom, filtre par motif.
      expect((await admin.reports({ status: 'open', q: 'tom' })).items.map((r) => r.id)).toEqual([item?.id]);
      expect((await admin.reports({ status: 'open', q: 'personne' })).items).toEqual([]);
      expect((await admin.reports({ status: 'open', reason: 'faux_profil' })).items.some((r) => r.id === item?.id)).toBe(false);

      // En retard après 24 h.
      w.clock.advanceHours(25);
      const later = await admin.reports({ status: 'open' });
      expect(later.items.find((r) => r.id === item?.id)?.overdue).toBe(true);
      expect(later.overdue).toBeGreaterThanOrEqual(1);

      // Avertir : e-mail envoyé, signalement traité, journal écrit.
      const before = w.outbox.length;
      const { entry } = await admin.act({ action: 'warn', targetUserId: tom.id, reportId: item?.id, reason: 'Insistance après un refus.' });
      expect(entry).toMatchObject({ action: 'warn', adminEmail: ADMIN, targetName: 'Tom', reportId: item?.id });
      expect(w.outbox.length).toBe(before + 1);
      expect(w.outbox[w.outbox.length - 1]).toMatchObject({ to: 'tom@exemple.fr', subject: 'Un avertissement de l’équipe Minimoa' });
      expect((await admin.reports({ status: 'open' })).items.some((r) => r.id === item?.id)).toBe(false);
      const handled = (await admin.reports({ status: 'handled' })).items.find((r) => r.id === item?.id);
      expect(handled?.resolution).toMatchObject({ action: 'warn', by: ADMIN });
      expect((await admin.report(item?.id ?? '')).history.map((h) => h.action)).toEqual(['warn']);
    });

    it('un message d’un autre lien ne fuit jamais dans le contexte', async () => {
      const a = w.client();
      const b = w.client();
      const c = w.client();
      for (const [x, name] of [[a, 'Ana'], [b, 'Bob'], [c, 'Cyd']] as const) await x.api.me.onboard(onboardBody({ displayName: name }));
      const ab = await a.api.invites.accept((await b.api.me.get()).inviteCode);
      const bc = await c.api.invites.accept((await b.api.me.get()).inviteCode);
      await b.api.links.send(bc.id, { body: 'secret entre Bob et Cyd' });
      const messages = w.app.get<MessagesRepository>(MESSAGES, { strict: false });
      const secret = (await messages.page(bc.id, null, 10)).find((m) => m.body?.startsWith('secret'));
      await a.api.safety.report({ userId: b.id, linkId: ab.id, messageId: secret?.id, reason: 'autre' });
      const item = (await admin.reports({ status: 'open', q: 'Bob' })).items[0];
      expect((await admin.report(item?.id ?? '')).context).toEqual([]);
    });

    it('suspendre : le compte reçoit `suspended` avec un message clair, peut encore supprimer son compte ; lever rétablit', async () => {
      const x = w.client();
      await x.api.me.onboard(onboardBody({ displayName: 'Max' }));
      const { entry } = await admin.act({ action: 'suspend', targetUserId: x.id, reason: 'Faux profil.', days: 7 });
      expect(entry.until).not.toBeNull();
      const err = await apiError(x.api.me.get());
      expect(err.code).toBe('suspended');
      expect(err.message).toMatch(/^Ton compte est suspendu jusqu’au \d+ \w+, après des signalements\. Une question\s\? Écris-nous à /);
      expect((await apiError(x.api.links.list())).code).toBe('suspended');
      expect((await admin.suspensions()).items.map((s) => s.displayName)).toContain('Max');

      await admin.act({ action: 'lift', targetUserId: x.id, reason: 'Erreur de notre part.' });
      expect((await x.api.me.get()).displayName).toBe('Max');
      expect((await apiError(admin.act({ action: 'lift', targetUserId: x.id, reason: 'encore' }))).code).toBe('conflict');

      // Suspension sans fin : la suppression du compte reste possible.
      await admin.act({ action: 'suspend', targetUserId: x.id, reason: 'Récidive.' });
      expect((await apiError(x.api.me.get())).message).toMatch(/^Ton compte est suspendu, après des signalements\./);
      await x.api.me.remove();
    });

    it('la suspension expire d’elle-même', async () => {
      const x = w.client();
      await x.api.me.onboard(onboardBody({ displayName: 'Eli' }));
      await admin.act({ action: 'suspend', targetUserId: x.id, reason: 'Une journée.', days: 1 });
      expect((await apiError(x.api.me.get())).code).toBe('suspended');
      w.clock.advanceHours(25);
      expect((await x.api.me.get()).displayName).toBe('Eli');
    });

    it('supprimer : confirmation par le prénom, même chemin que « Supprimer mon compte », journal gardé', async () => {
      const x = w.client(undefined, 'zed@exemple.fr');
      const y = w.client();
      await x.api.me.onboard(onboardBody({ displayName: 'Zed' }));
      await y.api.me.onboard(onboardBody({ displayName: 'Yan' }));
      await y.api.safety.report({ userId: x.id, reason: 'faux_profil' });
      const report = (await admin.reports({ q: 'Zed' })).items[0];
      expect((await apiError(admin.act({ action: 'delete', targetUserId: x.id, reportId: report?.id, reason: 'Faux profil avéré.', confirmName: 'Zoe' }))).code).toBe('invalid');
      await admin.act({ action: 'delete', targetUserId: x.id, reportId: report?.id, reason: 'Faux profil avéré.', confirmName: 'zed' });
      expect((await apiError(x.api.me.get())).code).toBe('unauthorized');
      const log = await admin.audit({ action: 'delete' });
      expect(log.items[0]).toMatchObject({ action: 'delete', targetName: 'Zed', targetUserId: x.id, reason: 'Faux profil avéré.' });
      expect((await admin.audit({ q: 'zed' })).items.length).toBeGreaterThanOrEqual(1);
      expect((await apiError(admin.act({ action: 'warn', targetUserId: x.id, reason: 'trop tard' }))).code).toBe('not_found');
    });

    it('classer un signalement sans suite, journal paginé', async () => {
      const a = w.client();
      const b = w.client();
      await a.api.me.onboard(onboardBody({ displayName: 'Ida' }));
      await b.api.me.onboard(onboardBody({ displayName: 'Jon' }));
      await a.api.safety.report({ userId: b.id, reason: 'autre', details: 'Pas sûr.' });
      const r = (await admin.reports({ q: 'Jon' })).items[0];
      await admin.act({ action: 'dismiss', targetUserId: b.id, reportId: r?.id, reason: 'Rien de grave.' });
      expect((await admin.reports({ status: 'handled', q: 'Jon' })).items[0]?.resolution?.action).toBe('dismiss');
      expect((await apiError(admin.act({ action: 'dismiss', targetUserId: b.id, reportId: '999999', reason: 'nope' }))).code).toBe('not_found');
      const p1 = await admin.audit({ limit: 2 });
      expect(p1.items).toHaveLength(2);
      expect(p1.nextCursor).not.toBeNull();
      const p2 = await admin.audit({ limit: 2, cursor: p1.nextCursor ?? undefined });
      expect(p2.items[0]?.id).not.toBe(p1.items[0]?.id);
      expect(Number(p2.items[0]?.id)).toBeLessThan(Number(p1.items[1]?.id));
    });
  });

  describe('statistiques quotidiennes', () => {
    it('la tâche calcule chaque jour terminé une seule fois ; nouveaux comptes, actifs et rétention J1', async () => {
      const jobs = w.app.get(AdminStatsJobs, { strict: false });
      const d0 = dayOf(w.clock.now());
      const people = [w.client(), w.client(), w.client()];
      for (const p of people) await p.api.me.onboard(onboardBody());
      // Le lendemain, deux des trois reviennent.
      w.clock.advanceDays(1);
      await people[0]?.api.me.get();
      await people[1]?.api.me.get();
      w.clock.advanceDays(1);
      const ran = await jobs.runDue(w.clock.now());
      expect(ran).toBeGreaterThanOrEqual(2);
      expect(await jobs.runDue(w.clock.now())).toBe(0);

      const overview = await admin.overview();
      expect(overview.asOf).toBe(addDays(d0, 1));
      expect(overview.accounts.active.day.value).toBe(2);
      expect(overview.retention.d1.base).toBeGreaterThanOrEqual(3);
      expect(overview.retention.d1.value).not.toBeNull();
      expect(overview.series.find((s) => s.key === 'dau')?.points).toHaveLength(30);
      const funnel = await admin.funnel();
      // Sept jours calculés sont nécessaires pour une semaine de propositions.
      expect(funnel.encounters.proposed.value).toBeNull();
      expect(funnel.links.active).toBeGreaterThanOrEqual(1);
      const minimoas = await admin.minimoas();
      // Apports de « vision » et « rituels » (LiveAdminInsights) : sur les deux comptes actifs ce jour-là.
      const shapes = minimoas.shapes;
      expect(shapes && shapes.en_forme + shapes.bof + shapes.boude).toBe(2);
      expect(minimoas.visions?.map((v) => v.axis)).toEqual(['foyer', 'ancrage', 'elan', 'rythme', 'cap']);
      expect(minimoas.visions?.[0]?.buckets.reduce((a, b) => a + b, 0)).toBe(2);
      expect(overview.averageStreak.value).toBe(0);
      expect(Array.isArray(minimoas.top)).toBe(true);
      const ai = await admin.aiCosts(7);
      expect(ai.available).toBe(true);
    });

    it('le classement nominatif (prénoms, minimoas) ne survit pas aux jours d’activité (40 jours)', async () => {
      const jobs = w.app.get(AdminStatsJobs, { strict: false });
      const stats = w.app.get(DAILY_STATS, { strict: false }) as DailyStatsRepository;
      const old = addDays(dayOf(w.clock.now()), -60);
      const named = { userId: 'u', ownerName: 'Léa', petName: 'Nino', species: 'nino', activeLinks: 2 };
      const row = (await stats.latest())!;
      await stats.put({ ...row, day: old, metrics: { ...row.metrics, top: [named], topDetails: { u: { shape: null, streak: 3 } } } });
      w.clock.advanceDays(1);
      await jobs.runDue(w.clock.now());
      const kept = (await stats.get(old))!;
      expect(kept.metrics.top).toEqual([]);
      expect(kept.metrics.topDetails).toEqual({});
      expect(kept.metrics.accountsTotal).toBe(row.metrics.accountsTotal);
      expect(JSON.stringify(kept)).not.toContain('Léa');
    });
  });
});
