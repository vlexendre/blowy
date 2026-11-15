/**
 * Audit App Store (docs/AUDIT-APPLE.md) côté serveur, en mémoire :
 * B1 compte de revue et son monde d'exemple · B6 filtre des contenus · M9 alertes et escalade des signalements ·
 * M3 rappel de fin d'essai par e-mail · M6 position enregistrée arrondie · M8 zone choisie sans localisation.
 */
import { randomUUID } from 'node:crypto';
import { createAdminClient, createApiClient } from '@blowy/api-client';
import { addDays, dayOf, distanceKm, reviewFixtureId, storedPoint } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AI_MODEL } from '../src/integrations/plateforme/plateforme.module';
import type { MemoryModel } from '../src/integrations/ai/memory-model';
import { AdminStatsJobs } from '../src/modules/admin/application/stats.jobs';
import { BillingJobs } from '../src/modules/billing/application/billing.jobs';
import type { SubscriptionsRepository } from '../src/modules/billing/ports';
import { SUBSCRIPTIONS } from '../src/modules/billing/tokens';
import { ModerationJobs } from '../src/modules/moderation/moderation.jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { Background } from '../src/shared/background';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, PARIS, apiError, errorCode, onboardBody, startWorld, upload } from './helpers';

const REVIEW_EMAIL = 'review@blowy.app';
const REVIEW_CODE = '4815162342';
const ADMIN = 'ops@blowy.app';
const CUPERTINO = { latitude: 37.3349, longitude: -122.009 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };

/** Client d'une personne, dans une langue donnée (Accept-Language). */
const clientIn = (w: TestWorld, locale: string, email?: string) => {
  const id = randomUUID();
  const token = `test:${id}${email ? `:${email}` : ''}`;
  return { id, api: createApiClient({ baseUrl: w.baseUrl, getToken: () => token, getLocale: () => locale }) };
};

describe('audit App Store — côté serveur', () => {
  let w: TestWorld;
  let db: MemoryDb;
  let model: MemoryModel;
  const settle = () => w.app.get(Background).settle();
  const tick = () => w.app.get(ModerationJobs).runDue(w.clock.now());
  const teamMails = () => w.outbox.filter((m) => m.to === ADMIN);

  beforeAll(async () => {
    w = await startWorld({ REVIEW_EMAIL, REVIEW_CODE, ADMIN_EMAILS: ADMIN });
    db = w.app.get<MemoryDb>(MEMORY_DB);
    model = w.app.get<MemoryModel>(AI_MODEL);
  });
  afterAll(() => w.close());

  // ── B1 ──────────────────────────────────────────────────────────────────────
  describe('B1 · compte de revue et monde d’exemple', () => {
    let reviewer: { id: string; api: ReturnType<typeof createApiClient> };
    let normal: { id: string; api: ReturnType<typeof createApiClient> };

    it('refuse toute autre adresse ou un mauvais code, avec le même message', async () => {
      for (const body of [
        { email: REVIEW_EMAIL, code: '0000000000' },
        { email: 'someone@else.com', code: REVIEW_CODE },
      ]) {
        expect(await apiError(w.anonymous.review.session(body))).toEqual({ code: 'unauthorized', message: 'Adresse ou code incorrect.' });
      }
      const closed = await startWorld();
      try {
        expect(await errorCode(closed.anonymous.review.session({ email: REVIEW_EMAIL, code: REVIEW_CODE }))).toBe('unauthorized');
      } finally {
        await closed.close();
      }
    });

    it('ouvre une session ; à l’inscription, le monde d’exemple est posé autour du compte', async () => {
      const session = await w.anonymous.review.session({ email: ' Review@Blowy.app ', code: REVIEW_CODE });
      expect(session).toMatchObject({ email: REVIEW_EMAIL, worldReset: false });
      reviewer = { id: session.userId, api: createApiClient({ baseUrl: w.baseUrl, getToken: () => session.accessToken }) };
      await reviewer.api.me.onboard(onboardBody({ displayName: 'Apple', location: CUPERTINO, whom: 'femmes', seeking: 'les_deux', gender: 'homme', consents: { sensitive: true, location: true } }));

      const fixtures = [...db.profiles.values()].filter((p) => p.reviewWorld === reviewer.id && p.id !== reviewer.id);
      expect(fixtures).toHaveLength(8);
      expect(fixtures.every((f) => f.gender === 'femme')).toBe(true);
      expect(fixtures.map((f) => f.id).sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7].map((s) => reviewFixtureId(reviewer.id, s)).sort());
      // Comptes fictifs : adresses réservées, jamais d'e-mail.
      expect(fixtures.every((f) => /\.invalid$/.test(db.authEmails.get(f.id) ?? ''))).toBe(true);

      // Rencontres : un coucou reçu et des personnes compatibles proches, expliquées.
      const enc = await reviewer.api.encounters.list();
      expect(enc.incoming).toHaveLength(1);
      expect(enc.suggestions.length).toBeGreaterThanOrEqual(1);
      for (const s of enc.suggestions) {
        expect(s.compatibility).toBeGreaterThanOrEqual(70);
        expect(s.explanation.common).toHaveLength(3);
      }
      // Liens : un lien ouvert avec une conversation (chaque rôle de minimoa), un lien en danger.
      const links = await reviewer.api.links.list();
      expect(links).toHaveLength(2);
      const danger = links.find((l) => l.lives === 2);
      expect(danger).toBeTruthy();
      const active = links.find((l) => l.lives !== 2);
      const page = await reviewer.api.links.messages(active?.id ?? '');
      const roles = new Set(page.messages.map((m) => m.petRole).filter(Boolean));
      for (const role of ['icebreaker', 'nudge', 'remark', 'guard']) expect(roles.has(role as never), role).toBe(true);
      const minimoas = await reviewer.api.minimoas.get(active?.id ?? '');
      expect(minimoas.consent.theirs).toBe('agreed');
      // Carte : épingles dans la zone et un compteur « plus loin ».
      const map = await reviewer.api.vision.map();
      expect(map.status).toBe('ok');
      expect(map.pins.length).toBeGreaterThanOrEqual(2);
      expect(map.pins.some((p) => p.relation === 'waved_you')).toBe(true);
      expect(map.beyond.count).toBeGreaterThanOrEqual(3);
      // Série, habitudes, bilan passé, paywall.
      expect((await reviewer.api.rituals.streak()).current).toBe(6);
      expect((await reviewer.api.rituals.habits()).habits).toHaveLength(2);
      expect((await reviewer.api.rituals.reviews()).reviews.length).toBeGreaterThanOrEqual(1);
      expect((await reviewer.api.plus.paywall()).teaser.compatibleNearby).toBeGreaterThanOrEqual(3);
    });

    it('le monde suit la zone du compte de revue (zone choisie, puis position)', async () => {
      const near = (p: { latitude: number; longitude: number }) => {
        const home = db.profilePlaces.get(reviewFixtureId(reviewer.id, 3))?.home;
        return home ? distanceKm({ lat: p.latitude, lng: p.longitude }, home) : Infinity;
      };
      expect(near(CUPERTINO)).toBeLessThan(2);
      await reviewer.api.vision.forgetLocation();
      await reviewer.api.vision.chooseArea({ label: 'Sydney', ...SYDNEY });
      expect(near(SYDNEY)).toBeLessThan(2);
      expect((await reviewer.api.vision.map()).pins.length).toBeGreaterThanOrEqual(2);
      await reviewer.api.vision.locate(CUPERTINO);
      expect(near(CUPERTINO)).toBeLessThan(2);
    });

    it('un vrai compte au même endroit ne voit jamais ce monde, et inversement', async () => {
      normal = w.client();
      await normal.api.me.onboard(onboardBody({ displayName: 'Vraie', location: CUPERTINO }));
      const hidden = new Set([reviewer.id, ...[0, 1, 2, 3, 4, 5, 6, 7].map((s) => reviewFixtureId(reviewer.id, s))]);
      const enc = await normal.api.encounters.list();
      expect([...enc.suggestions.map((s) => s.user.id), ...enc.incoming.map((i) => i.from.id)].filter((id) => hidden.has(id))).toEqual([]);
      const map = await normal.api.vision.map();
      expect(map.pins.filter((p) => hidden.has(p.user.id))).toEqual([]);
      expect(map.beyond.count).toBe(0);
      expect((await normal.api.plus.paywall()).teaser.compatibleNearby).toBe(0);
      expect(await errorCode(normal.api.encounters.wave(reviewFixtureId(reviewer.id, 3)))).toBe('not_found');
      expect(await errorCode(normal.api.encounters.wave(reviewer.id))).toBe('not_found');
      const reviewerMe = await reviewer.api.me.get();
      expect(await errorCode(normal.api.invites.get(reviewerMe.inviteCode))).toBe('not_found');
      expect(await errorCode(normal.api.invites.accept(reviewerMe.inviteCode))).toBe('not_found');
      // Le compte de revue ne voit pas non plus le vrai compte.
      const mine = await reviewer.api.encounters.list();
      expect(mine.suggestions.some((s) => s.user.id === normal.id)).toBe(false);
      expect(await errorCode(reviewer.api.encounters.wave(normal.id))).toBe('not_found');
    });

    it('les personnes fictives répondent ; signaler et bloquer marchent, sans alerter l’équipe', async () => {
      const [active] = (await reviewer.api.links.list()).filter((l) => l.lives !== 2);
      const before = (await reviewer.api.links.messages(active?.id ?? '')).messages.length;
      await reviewer.api.links.send(active?.id ?? '', { body: 'Avec plaisir, mardi alors !' });
      await settle();
      const after = (await reviewer.api.links.messages(active?.id ?? '')).messages;
      expect(after.length).toBeGreaterThan(before + 1);
      expect(after.some((m) => m.author === 'other' && m.body === 'Haha, carrément.')).toBe(true);

      const target = reviewFixtureId(reviewer.id, 3);
      const mailsBefore = teamMails().length;
      await reviewer.api.safety.report({ userId: target, reason: 'mineur', details: 'test de la revue' });
      await reviewer.api.safety.block(target);
      await tick();
      expect(teamMails()).toHaveLength(mailsBefore);
      const reports = await createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${ADMIN}` }).reports({ status: 'open' });
      expect(reports.items.find((r) => r.target?.id === target)).toMatchObject({ review: true, priority: 'normal' });
      expect(db.suspensions.has(target)).toBe(false);
    });

    it('hors statistiques', async () => {
      const today = dayOf(w.clock.now());
      const metrics = await w.app.get(AdminStatsJobs).computeDay(today, w.clock.now());
      const real = [...db.profiles.values()].filter((p) => !p.reviewWorld);
      expect(metrics.accountsTotal).toBe(real.length);
      expect(metrics.encountersWaved).toBe([...db.encounters.values()].filter((e) => !db.profiles.get(e.fromUser)?.reviewWorld && dayOf(new Date(e.createdAt)) === today).length);
      expect(metrics.reportsOpen).toBe(0);
      expect(metrics.top.some((t) => t.userId === reviewer.id)).toBe(false);
      expect([...db.activityDays].some((k) => k.endsWith(reviewer.id))).toBe(false);
    });

    it('remise à neuf à la connexion suivante (et sur demande)', async () => {
      const target = reviewFixtureId(reviewer.id, 3);
      expect((await reviewer.api.safety.blocks()).length).toBe(1);
      const again = await w.anonymous.review.session({ email: REVIEW_EMAIL, code: REVIEW_CODE });
      expect(again).toMatchObject({ userId: reviewer.id, worldReset: true });
      expect(await reviewer.api.safety.blocks()).toEqual([]);
      expect(db.reports.filter((r, i) => r.reporter === reviewer.id && !db.purgedReports.has(String(i + 1)))).toEqual([]);
      expect(db.profiles.get(target)?.reviewWorld).toBe(reviewer.id);
      expect((await reviewer.api.encounters.list()).incoming).toHaveLength(1);
      expect(await reviewer.api.review.reset()).toEqual({ ok: true, fixtures: 8 });
      expect(await errorCode(normal.api.review.reset())).toBe('forbidden');
    });

    it('supprimer le compte de revue emporte ses personnes fictives', async () => {
      await reviewer.api.me.remove();
      expect([...db.profiles.values()].filter((p) => p.reviewWorld === reviewer.id)).toEqual([]);
    });

    it('après suppression, la même adresse se réinscrit ; sans localisation, le monde est complet (zone Paris, changeable)', async () => {
      const s = await w.anonymous.review.session({ email: REVIEW_EMAIL, code: REVIEW_CODE });
      expect(s.worldReset).toBe(false);
      const again = createApiClient({ baseUrl: w.baseUrl, getToken: () => s.accessToken });
      await again.me.onboard(onboardBody({ displayName: 'Apple', location: undefined, consents: { sensitive: false, location: false } }));
      const me = await again.me.get();
      expect(me.identity.location).toMatchObject({ source: 'manual', manualArea: { label: 'Paris' } });
      const map = await again.vision.map();
      expect(map.status).toBe('ok');
      expect(map.pins.length).toBeGreaterThanOrEqual(2);
      expect((await again.vision.chooseArea({ label: 'Lyon', latitude: 45.76, longitude: 4.84 })).manualArea?.label).toBe('Lyon');
      expect((await again.vision.map()).pins.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── B6 ──────────────────────────────────────────────────────────────────────
  describe('B6 · filtre des contenus', () => {
    it('prénom et nom du minimoa : refus clair, traduit, même déguisé', async () => {
      const fr = clientIn(w, 'fr');
      expect(await apiError(fr.api.me.onboard(onboardBody({ displayName: 'S@l0pe' })))).toEqual({
        code: 'content_refused',
        message: 'Ce prénom ne peut pas être utilisé sur Blowy. Choisis-en un autre.',
      });
      expect(await apiError(fr.api.me.onboard(onboardBody({ pet: { name: 'snap lea93', species: 'nino' } })))).toEqual({
        code: 'content_refused',
        message: 'Pas de lien, d’adresse, de numéro ni de pseudo dans un nom.',
      });
      expect(db.profiles.has(fr.id)).toBe(false);
      // L'app sait vers quel champ ramener la personne (texte gardé, jamais renvoyé par l'API).
      const field = async (p: Promise<unknown>) => p.then(() => null, (e: unknown) => (e as { field?: string }).field ?? null);
      expect(await field(fr.api.me.onboard(onboardBody({ displayName: 'S@l0pe' })))).toBe('displayName');
      expect(await field(fr.api.me.onboard(onboardBody({ pet: { name: 'snap lea93', species: 'nino' } })))).toBe('petName');
      const en = clientIn(w, 'en');
      expect(await apiError(en.api.me.onboard(onboardBody({ displayName: 'B i t c h', locale: 'en' })))).toEqual({
        code: 'content_refused',
        message: 'This first name can’t be used on Blowy. Pick another one.',
      });
      await fr.api.me.onboard(onboardBody({ displayName: 'Lou' }));
      expect(await errorCode(fr.api.me.update({ displayName: 'connard' }))).toBe('content_refused');
      expect(await errorCode(fr.api.pet.rename('Enculé'))).toBe('content_refused');
      await fr.api.pet.rename('Biscotte');
      expect((await fr.api.me.update({ displayName: 'Louise' })).displayName).toBe('Louise');
    });

    it('messages : violation nette bloquée et signalée en urgence ; insulte livrée, signalée et garde-fou', async () => {
      const a = clientIn(w, 'fr');
      const b = clientIn(w, 'en');
      await a.api.me.onboard(onboardBody({ displayName: 'Maé' }));
      const meA = await a.api.me.get();
      await b.api.me.onboard(onboardBody({ displayName: 'Sam', locale: 'en', inviteCode: meA.inviteCode }));
      const [link] = await a.api.links.list();
      const linkId = link?.id ?? '';
      const count = async () => (await a.api.links.messages(linkId)).messages.filter((m) => m.author === 'me').length;
      const sentBefore = await count();
      const mails = teamMails().length;

      expect(await apiError(a.api.links.send(linkId, { body: 'Je s@is où tu h4bites.' }))).toEqual({
        code: 'content_refused',
        message: 'Message non envoyé : il ne respecte pas les règles de la communauté de Blowy.',
      });
      expect(await apiError(b.api.links.send(linkId, { body: 'I will kill you' }))).toMatchObject({ code: 'content_refused', message: 'Message not sent: it doesn’t follow Blowy’s community rules.' });
      expect(await count()).toBe(sentBefore);
      // Urgent : l'équipe est prévenue tout de suite, sans le contenu ni les prénoms.
      const urgent = teamMails().slice(mails);
      expect(urgent.length).toBeGreaterThanOrEqual(1);
      expect(urgent[0]?.subject).toMatch(/URGENT/);
      expect(urgent.map((m) => m.text).join('\n')).not.toMatch(/habites|kill|Maé|Sam/);

      await a.api.links.send(linkId, { body: 'T’es vraiment un c.o.n.n.a.r.d' });
      expect(await count()).toBe(sentBefore + 1);
      const guard = (await a.api.links.messages(linkId)).messages.filter((m) => m.petRole === 'guard');
      expect(guard).toHaveLength(1);
      expect((await b.api.links.messages(linkId)).messages.filter((m) => m.petRole === 'guard')).toHaveLength(0);

      const admin = createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${ADMIN}` });
      const mine = (await admin.reports({ status: 'open', limit: 100 })).items.filter((r) => r.linkId === linkId);
      expect(mine.find((r) => r.category === 'threat' && r.source === 'filter')).toMatchObject({ priority: 'urgent', hasMessage: false, reason: 'harcelement' });
      expect(mine.find((r) => r.category === 'insult')).toMatchObject({ source: 'filter', hasMessage: true });
      // File : les urgents d'abord.
      expect(mine[0]?.priority).toBe('urgent');
    });

    it('vocabulaire pédocriminel explicite : bloqué, urgent, compte suspendu en attendant la modération', async () => {
      const a = w.client();
      const b = w.client();
      await a.api.me.onboard(onboardBody({ displayName: 'Rémi' }));
      await b.api.me.onboard(onboardBody({ displayName: 'Zoé', inviteCode: (await a.api.me.get()).inviteCode }));
      const [link] = await a.api.links.list();
      expect(await errorCode(a.api.links.send(link?.id ?? '', { body: 'tu as des liens p3d0p0rn ?' }))).toBe('content_refused');
      expect(await errorCode(a.api.me.get())).toBe('suspended');
      expect(db.auditLog.at(-1)).toMatchObject({ action: 'suspend', adminEmail: 'filtre automatique', targetUserId: a.id });
    });

    it('lien nu : livré ; l’IA ne confirme que si les deux ont accepté la lecture, et jamais au-delà du budget', async () => {
      const a = w.client();
      const b = w.client();
      await a.api.me.onboard(onboardBody({ displayName: 'Ana' }));
      await b.api.me.onboard(onboardBody({ displayName: 'Bo', inviteCode: (await a.api.me.get()).inviteCode }));
      const [link] = await a.api.links.list();
      const linkId = link?.id ?? '';
      const calls = () => model.calls.filter((c) => c.prompt.startsWith('Message :')).length;
      const before = calls();
      await a.api.links.send(linkId, { body: 'regarde www.example.com' });
      await settle();
      expect(calls()).toBe(before);
      await a.api.minimoas.update(linkId, { consent: true });
      await b.api.minimoas.update(linkId, { consent: true });
      model.respondWith((c) => (c.prompt.startsWith('Message :') ? 'SPAM' : 'oui'));
      try {
        await a.api.links.send(linkId, { body: 'gagne vite sur www.example.com' });
        await settle();
      } finally {
        model.respondWith(null);
      }
      expect(calls()).toBe(before + 1);
      const flagged = [...db.reports].filter((r) => r.linkId === linkId && r.source === 'filter');
      expect(flagged.map((r) => r.category)).toEqual(['scam']);
      // Passerelle en panne : le message reste envoyé, aucun signalement inventé.
      model.failWith(true);
      try {
        await a.api.links.send(linkId, { body: 'et www.example.org' });
        await settle();
      } finally {
        model.failWith(false);
      }
      expect([...db.reports].filter((r) => r.linkId === linkId && r.source === 'filter')).toHaveLength(1);
    });

    it('photo de profil : rejetée par l’IA (effacée, signalée), acceptée, ou publiée puis vérifiée par le minuteur', async () => {
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: 'Iris' }));
      const send = async () => {
        const t = await p.api.me.avatarTicket('image/jpeg');
        await upload(t.uploadUrl);
        return t.path;
      };
      model.respondWith((c) => (c.system.includes('photos de profil') ? 'SEXUAL' : 'oui'));
      let rejected = '';
      try {
        rejected = await send();
        expect(await apiError(p.api.me.setAvatar(rejected))).toEqual({
          code: 'content_refused',
          message: 'Cette photo ne peut pas être ta photo de profil. Choisis-en une autre : toi, reconnaissable, sans nudité.',
        });
      } finally {
        model.respondWith(null);
      }
      expect(db.profiles.get(p.id)?.avatarPath).toBeNull();
      expect(db.reports.at(-1)).toMatchObject({ targetUser: p.id, source: 'filter', category: 'photo_sexual' });

      model.respondWith((c) => (c.system.includes('photos de profil') ? 'OK' : 'oui'));
      try {
        const ok = await send();
        await p.api.me.setAvatar(ok);
        expect(db.profiles.get(p.id)).toMatchObject({ avatarPath: ok });
        expect(db.profiles.get(p.id)?.avatarCheckedAt).toBeTruthy();
      } finally {
        model.respondWith(null);
      }

      model.failWith(true);
      let later = '';
      try {
        later = await send();
        await p.api.me.setAvatar(later);
      } finally {
        model.failWith(false);
      }
      expect(db.profiles.get(p.id)).toMatchObject({ avatarPath: later, avatarCheckedAt: null });
      // Le minuteur vérifie une fois par heure (créneau de 5 minutes).
      while (w.clock.now().getUTCMinutes() >= 5) w.clock.advanceMinutes(5);
      await tick();
      expect(db.profiles.get(p.id)?.avatarCheckedAt).toBeTruthy();
    });
  });

  // ── M9 ──────────────────────────────────────────────────────────────────────
  describe('M9 · alertes et escalade des signalements', () => {
    it('récapitulatif groupé (15 min), urgent tout de suite, escalade après 24 h, priorité et suspension automatique', async () => {
      // Ce qui reste des tests précédents part d'abord ; puis la fenêtre de 15 minutes est passée.
      w.clock.advanceHours(1);
      await tick();
      w.clock.advanceMinutes(16);
      const target = w.client();
      await target.api.me.onboard(onboardBody({ displayName: 'Cible' }));
      const reporters = await Promise.all(
        [0, 1, 2].map(async (i) => {
          const r = w.client();
          await r.api.me.onboard(onboardBody({ displayName: `R${i}` }));
          return r;
        }),
      );
      const start = teamMails().length;
      await reporters[0]?.api.safety.report({ userId: target.id, reason: 'harcelement', details: 'Il insiste' });
      expect(teamMails()).toHaveLength(start); // pas urgent : attend le minuteur
      await tick();
      expect(teamMails()).toHaveLength(start + 1);
      expect(teamMails().at(-1)?.subject).toBe('[Blowy] 1 signalement à traiter');
      expect(teamMails().at(-1)?.text).not.toMatch(/Cible|insiste/);

      await reporters[1]?.api.safety.report({ userId: target.id, reason: 'faux_profil' });
      await tick();
      expect(teamMails()).toHaveLength(start + 1); // moins de 15 min après le précédent
      w.clock.advanceMinutes(16);
      await reporters[2]?.api.safety.report({ userId: target.id, reason: 'autre' });
      await tick();
      expect(teamMails()).toHaveLength(start + 2);
      expect(teamMails().at(-1)?.subject).toBe('[Blowy] 2 signalements à traiter');

      const admin = createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${ADMIN}` });
      const onTarget = () => admin.reports({ status: 'open', limit: 100 }).then((r) => r.items.filter((x) => x.target?.id === target.id));
      // Trois personnes différentes : priorité haute pour tous ses signalements.
      expect((await onTarget()).map((r) => r.priority)).toEqual(['high', 'high', 'high']);

      // « Personne mineure » par deux personnes différentes : urgent, alerte immédiate, suspension de 72 h.
      await reporters[0]?.api.safety.report({ userId: target.id, reason: 'mineur' });
      expect(teamMails().at(-1)?.subject).toMatch(/^\[Blowy\] URGENT/);
      expect(await target.api.me.get()).toBeTruthy();
      await reporters[1]?.api.safety.report({ userId: target.id, reason: 'mineur' });
      expect(await errorCode(target.api.me.get())).toBe('suspended');
      expect(db.suspensions.get(target.id)).toMatchObject({ byEmail: 'filtre automatique' });

      // Délai cible dépassé : remontés et annoncés une seule fois.
      const before = teamMails().length;
      w.clock.advanceHours(25);
      await tick();
      const overdue = teamMails().slice(before).filter((m) => /au-delà de 24 h/.test(m.subject));
      expect(overdue).toHaveLength(1);
      const items = await onTarget();
      expect(items.every((r) => r.overdue)).toBe(true);
      await tick();
      expect(teamMails().slice(before).filter((m) => /au-delà de 24 h/.test(m.subject))).toHaveLength(1);
    });
  });

  // ── M3 ──────────────────────────────────────────────────────────────────────
  describe('M3 · rappel de fin d’essai aussi par e-mail', () => {
    it('une seule fois par essai, dans la langue du profil, à l’adresse du compte (relais Apple compris)', async () => {
      const relay = 'x7k2@privaterelay.appleid.com';
      const p = w.client(randomUUID(), relay);
      await p.api.me.onboard(onboardBody({ displayName: 'Nora' }));
      const now = w.clock.now();
      const ends = new Date(now.getTime() + 2 * 86_400_000);
      // En journée à Paris.
      while (Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(w.clock.now())) !== 12) w.clock.advanceHours(1);
      await w.app.get<SubscriptionsRepository>(SUBSCRIPTIONS).save({
        store: 'apple',
        originalTransactionId: `M3-${p.id}`,
        latestTransactionId: `M3-${p.id}`,
        productId: 'app.blowy.plus.yearly',
        plan: 'yearly',
        status: 'trial',
        expiresAt: ends.toISOString(),
        graceUntil: null,
        trialEndsAt: ends.toISOString(),
        trialUsed: true,
        autoRenew: true,
        revokedAt: null,
        startedAt: addDays(dayOf(now), -5) + 'T10:00:00.000Z',
        updatedAt: now.toISOString(),
        userId: p.id,
        environment: 'Sandbox',
        trialReminderFor: null,
      });
      const jobs = w.app.get(BillingJobs);
      await jobs.runDue(w.clock.now());
      await jobs.runDue(w.clock.now());
      const mails = w.outbox.filter((m) => m.to === relay && m.subject === 'Ton essai Blowy+ se termine bientôt');
      expect(mails).toHaveLength(1);
      expect(mails[0]?.text.replace(/[  ]/g, ' ')).toMatch(/premier paiement de 59,88 €/);
      expect(mails[0]?.html).toContain('https://apps.apple.com/account/subscriptions');
    });
  });

  // ── M6 ──────────────────────────────────────────────────────────────────────
  describe('M6 · position enregistrée arrondie', () => {
    it('jamais le point exact ; la sortie hors de la zone reste détectée', async () => {
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: 'Gus' }));
      const exact = { lat: PARIS.latitude, lng: PARIS.longitude };
      expect(db.profilePlaces.get(p.id)?.last).toEqual(storedPoint(exact));
      expect(db.profilePlaces.get(p.id)?.last).not.toEqual(exact);
      // 3 km plus loin : sortie détectée avec le point exact, qui n'est pas gardé.
      const far = { latitude: PARIS.latitude + 0.027, longitude: PARIS.longitude };
      await p.api.vision.locate(far);
      const place = db.profilePlaces.get(p.id);
      expect(place?.lastAwayAt).toBeTruthy();
      expect(place?.last).toEqual(storedPoint({ lat: far.latitude, lng: far.longitude }));
    });
  });

  // ── M8 ──────────────────────────────────────────────────────────────────────
  describe('M8 · zone choisie sans localisation, gratuite', () => {
    it('sans position : choisir une ville donne carte et rencontres ; une fois tous les 30 jours sans Blowy+', async () => {
      const lyon = { label: 'Lyon', latitude: 45.76, longitude: 4.84 };
      const neighbour = w.client();
      await neighbour.api.me.onboard(onboardBody({ displayName: 'Voisine', location: { latitude: 45.761, longitude: 4.842 } }));
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: 'Hugo', location: undefined, consents: { sensitive: false, location: false } }));
      expect((await p.api.vision.map()).status).toBe('no_location');

      const status = await p.api.vision.chooseArea(lyon);
      expect(status).toMatchObject({ source: 'manual', manualArea: { label: 'Lyon', nextChangeOn: addDays(dayOf(w.clock.now()), 30) } });
      expect(status.consentAt).toBeTruthy();
      const map = await p.api.vision.map();
      expect(map.status).toBe('ok');
      expect(map.pins.map((x) => x.user.id)).toContain(neighbour.id);
      expect((await p.api.encounters.list()).suggestions.map((s) => s.user.id)).toContain(neighbour.id);

      expect(await apiError(p.api.vision.chooseArea({ label: 'Nantes', latitude: 47.22, longitude: -1.55 }))).toMatchObject({ code: 'forbidden' });
      expect((await apiError(p.api.vision.chooseArea({ label: 'Nantes', latitude: 47.22, longitude: -1.55 }))).message).toMatch(/^Tu pourras changer de zone à partir du \d+ \p{L}+\. Avec Blowy\+, quand tu veux\.$/u);
      // Re-choisir la même ville ne relance pas l'attente.
      await p.api.vision.chooseArea(lyon);
      w.clock.advanceDays(31);
      expect((await p.api.vision.chooseArea({ label: 'Nantes', latitude: 47.22, longitude: -1.55 })).manualArea?.label).toBe('Nantes');

      // Blowy+ : quand on veut.
      const plus = db.profiles.get(p.id);
      if (plus) db.profiles.set(p.id, { ...plus, plusUntil: addDays(dayOf(w.clock.now()), 30) + 'T00:00:00.000Z' });
      expect((await p.api.vision.chooseArea(lyon)).manualArea).toEqual({ label: 'Lyon', nextChangeOn: null });

      // La position du téléphone, une fois donnée, remplace la zone choisie ; plus de zone à la main ensuite.
      const gps = await p.api.vision.locate({ latitude: 45.75, longitude: 4.85 });
      expect(gps).toMatchObject({ source: 'gps', manualArea: null });
      expect(await errorCode(p.api.vision.chooseArea(lyon))).toBe('conflict');
    });
  });
});
