/**
 * Parcours complet V7 en mémoire, tous chantiers ensemble (« vision », « rituels », « plateforme »,
 * « facturation-admin » et l'intégration) : inscription avec le test, compatibilité expliquée, coucou de nuit (heures
 * calmes), lien, chat et minimoas avec accord (rôles, plafond), défi du jour et série, preuve d'habitude, bilan du
 * dimanche, Minimoa+ (habitudes, carte), signalement → suspension (invisible, sans push), suppression (chaque table),
 * conservation (comptes inactifs, exclusion définitive, purge de la modération).
 */
import { randomUUID } from 'node:crypto';
import { type ApiClient, createAdminClient } from '@blowy/api-client';
import type { Message } from '@blowy/contract';
import { addDays, dayOf } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryModel } from '../src/integrations/ai/memory-model';
import { AI_MODEL } from '../src/integrations/plateforme/plateforme.module';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import { memoryJws } from '../src/modules/billing/infrastructure/memory-billing';
import { RetentionJobs } from '../src/modules/retention/application/retention.jobs';
import { RituelsJobs } from '../src/modules/rituels/application/rituels.jobs';
import type { MemoryHabitVerifier } from '../src/modules/rituels/infrastructure/adapters';
import { HABIT_VERIFIER } from '../src/modules/rituels/tokens';
import type { MemoryDb } from '../src/persistence/memory-db';
import { Background } from '../src/shared/background';
import { MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { PARIS, type TestWorld, apiError, doToday, errorCode, onboardBody, startWorld, upload, visionAnswers } from './helpers';

type Person = { id: string; api: ApiClient };
const SECRET = 'secret-du-minuteur-parcours-complet';
const ADMIN = 'ops@blowy.app';
/** ~300 m de la place de la République. */
const NEAR = { latitude: 48.87, longitude: 2.366 };

describe('parcours complet V7 (mémoire)', () => {
  let w: TestWorld;
  let db: MemoryDb;
  let pusher: MemoryPusher;
  let ana: Person;
  let ben: Person;
  let dan: Person;
  let linkId = '';

  const tick = async (): Promise<void> => {
    const res = await fetch(`${w.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': SECRET } });
    expect(res.ok).toBe(true);
  };
  const pushesTo = (token: string, kind?: string) => pusher.outbox.filter((m) => m.to === token && (!kind || m.data.kind === kind));
  /** Avance jusqu'à l'heure de Paris donnée (hiver, UTC+1), le jour même ou le lendemain. */
  const toParisHour = (hour: number, minute = 0): void => {
    const now = w.clock.now();
    const target = new Date(now);
    target.setUTCHours(hour - 1, minute, 0, 0);
    if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
    w.clock.advanceMinutes((target.getTime() - now.getTime()) / 60_000);
  };
  /** Minimoa en forme (sinon, quelques jours sans soins et il boude : plus de rencontres ni de coucou). */
  const cheerUp = (...ids: string[]): void => {
    for (const [key, pet] of db.pets) {
      if (!ids.includes(pet.ownerId)) continue;
      const full = Object.fromEntries(Object.keys(pet.needs).map((k) => [k, 100])) as typeof pet.needs;
      db.pets.set(key, { ...pet, needs: full, needsAt: w.clock.now().toISOString() });
    }
  };
  const admin = () => createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:${ADMIN}` });

  beforeAll(async () => {
    w = await startWorld({ INTERNAL_TICK_SECRET: SECRET, ADMIN_EMAILS: ADMIN });
    db = w.app.get<MemoryDb>(MEMORY_DB);
    pusher = w.app.get<MemoryPusher>(PUSHER);
  });
  afterAll(() => w.close());

  it('inscription : nouveaux champs et test passé avant le compte ; sans test, inscrite mais signalée et sans suggestion', async () => {
    ana = w.client(randomUUID(), 'ana@exemple.fr');
    const meAna = await ana.api.me.onboard(
      onboardBody({ displayName: 'Ana', gender: 'femme', consents: { location: true }, location: PARIS }),
    );
    expect(meAna).toMatchObject({ visionTestDone: true, identity: { gender: 'femme' } });
    ben = w.client(randomUUID(), 'ben@exemple.fr');
    await ben.api.me.onboard(onboardBody({ displayName: 'Ben', gender: 'homme', consents: { location: true }, location: NEAR, pet: { name: 'Gaston', species: 'gaston' } }));
    dan = w.client(randomUUID(), 'dan@exemple.fr');
    await dan.api.me.onboard(onboardBody({ displayName: 'Dan', gender: 'homme', consents: { location: true }, location: NEAR }));

    // Test incomplet : refusé, rien n'est créé. Sans réponse : inscrite, `visionTestDone` faux, aucune suggestion.
    const carl = w.client();
    expect(await errorCode(carl.api.me.onboard(onboardBody({ displayName: 'Carl', visionAnswers: visionAnswers(0).slice(3) })))).toBe('invalid');
    expect(await errorCode(carl.api.me.get())).toBe('not_onboarded');
    const meCarl = await carl.api.me.onboard(onboardBody({ displayName: 'Carl', visionAnswers: [] }));
    expect(meCarl.visionTestDone).toBe(false);
    expect((await carl.api.encounters.list()).suggestions).toEqual([]);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.displayName)).not.toContain('Carl');
    // Passé ensuite : le drapeau tombe.
    await carl.api.vision.retakeTest(visionAnswers(0));
    expect((await carl.api.me.get()).visionTestDone).toBe(true);
  });

  it('compatibles : proposés l’un à l’autre, avec 3 points communs et 1 différence', async () => {
    const forBen = (await ben.api.encounters.list()).suggestions.find((s) => s.user.id === ana.id);
    expect(forBen?.compatibility).toBeGreaterThanOrEqual(70);
    expect(forBen?.explanation.common).toHaveLength(3);
    expect(forBen?.explanation.explore.text.length).toBeGreaterThan(5);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.displayName)).toEqual(expect.arrayContaining(['Ben', 'Dan']));
  });

  it('coucou de nuit : push reporté au matin (heures calmes), une fois ; accepté, le lien se crée', async () => {
    await ana.api.notifications.registerDevice({ token: 'ExponentPushToken[ana]', platform: 'ios', timeZone: 'Europe/Paris' });
    await ben.api.notifications.registerDevice({ token: 'ExponentPushToken[ben]', platform: 'ios', timeZone: 'Europe/Paris' });
    await dan.api.notifications.registerDevice({ token: 'ExponentPushToken[dan]', platform: 'android', timeZone: 'Europe/Paris' });
    toParisHour(23, 30);
    cheerUp(ana.id, ben.id, dan.id);
    await ben.api.encounters.wave(ana.id);
    expect(pushesTo('ExponentPushToken[ana]', 'waved')).toHaveLength(0);
    expect(db.notificationLog.some((l) => l.userId === ana.id && l.kind === 'waved' && l.status === 'deferred')).toBe(true);
    toParisHour(8, 5);
    await tick();
    w.clock.advanceMinutes(5);
    await tick();
    expect(pushesTo('ExponentPushToken[ana]', 'waved')).toHaveLength(1);

    const incoming = (await ana.api.encounters.list()).incoming.find((i) => i.from.id === ben.id);
    expect(incoming?.explanation?.common).toHaveLength(3);
    const link = await ana.api.encounters.accept(incoming?.id ?? '');
    linkId = link.id;
    expect(link.other.displayName).toBe('Ben');
  });

  it('chat : accord des deux pour la lecture par l’IA, minimoas avec leurs rôles, au plus 3 interventions par jour et par lien', async () => {
    const model = w.app.get<MemoryModel>(AI_MODEL);
    const background = w.app.get(Background);
    const before = (await ana.api.links.messages(linkId)).messages.filter((m) => m.petRole !== null);
    expect(before.map((m) => m.petRole)).toEqual(['icebreaker']);
    expect((await ana.api.minimoas.get(linkId)).consent).toMatchObject({ mine: null, reading: false });
    await ana.api.minimoas.update(linkId, { consent: true });
    expect((await ben.api.minimoas.update(linkId, { consent: true })).consent.reading).toBe(true);
    const calls = model.calls.length;
    for (let i = 0; i < 30; i++) await (i % 2 === 0 ? ana : ben).api.links.send(linkId, { body: `Tu connais ce resto ? ${i}` });
    await background.settle();
    expect(model.calls.length).toBeGreaterThan(calls); // l'IA a lu (fenêtre courte), jamais un appel par message
    expect(model.calls.length - calls).toBeLessThan(5);
    const today = dayOf(w.clock.now());
    const all: Message[] = [];
    let page = await ana.api.links.messages(linkId);
    all.push(...page.messages);
    while (page.nextBefore) {
      page = await ana.api.links.messages(linkId, page.nextBefore);
      all.push(...page.messages);
    }
    const lines = all.filter((m) => m.petRole !== null && m.petRole !== 'event');
    for (const m of lines) expect(['icebreaker', 'remark', 'nudge', 'guard']).toContain(m.petRole);
    expect(lines.filter((m) => dayOf(new Date(m.at)) === today).length).toBeLessThanOrEqual(3);
    expect((await ana.api.minimoas.get(linkId)).interventionsToday).toBeLessThanOrEqual(3);
  });

  it('défi du jour fait, série qui avance ; preuve d’habitude validée par le vérificateur mémoire', async () => {
    await doToday(ana);
    expect((await ana.api.rituals.streak()).current).toBe(1);
    w.clock.advanceDays(1);
    cheerUp(ana.id, ben.id, dan.id);
    await doToday(ana);
    expect((await ana.api.rituals.streak())).toMatchObject({ current: 2, doneToday: true });

    const verifier = w.app.get<MemoryHabitVerifier>(HABIT_VERIFIER);
    const ref = (await ana.api.rituals.addHabit({ habitId: 'marcher' })).habits[0]?.ref ?? '';
    // Accord explicite pour la vérification par l'IA (audit B5), sinon la preuve ne part pas au vérificateur.
    await ana.api.me.setAiProofs(true);
    const t = await ana.api.rituals.proofTicket(ref, 'image/jpeg');
    await upload(t.uploadUrl);
    const proof = await ana.api.rituals.proof(ref, t.path, true);
    expect(proof).toMatchObject({ verdict: 'yes', counted: true });
    expect(verifier.calls.at(-1)).toMatchObject({ userId: ana.id, habitId: 'marcher' });
  });

  it('bilan du dimanche soir, construit par le minuteur et notifié', async () => {
    // Vendredi → dimanche 15 novembre, 19 h.
    while (dayOf(w.clock.now()) < '2026-11-15') w.clock.advanceDays(1);
    toParisHour(19);
    await w.app.get(RituelsJobs).runDue(w.clock.now());
    const { reviews } = await ana.api.rituals.reviews();
    expect(reviews[0]).toMatchObject({ weekStart: '2026-11-09', read: false });
    expect(reviews[0]?.facts.challengesDone).toBe(2);
    expect(pushesTo('ExponentPushToken[ana]', 'weekly_review')).toHaveLength(1);
  });

  it('Minimoa+ acheté (facturation mémoire) : 6 habitudes au lieu de 2, toute la carte', async () => {
    cheerUp(ana.id, ben.id, dan.id);
    await ben.api.rituals.addHabit({ habitId: 'marcher' });
    await ben.api.rituals.addHabit({ habitId: 'lire' });
    expect((await apiError(ben.api.rituals.addHabit({ habitId: 'sport' }))).code).toBe('forbidden');
    expect((await ben.api.vision.map()).scope).toBe('zone');
    const now = w.clock.now().getTime();
    const sub = await ben.api.plus.submitPurchase({
      store: 'apple',
      signedTransaction: memoryJws({
        transactionId: 'T-ben-1',
        originalTransactionId: 'O-ben',
        bundleId: 'app.blowy',
        productId: 'app.blowy.plus.yearly',
        purchaseDate: now,
        expiresDate: now + 7 * 86_400_000,
        signedDate: now,
        environment: 'Sandbox',
        offerType: 1,
        offerDiscountType: 'FREE_TRIAL',
        type: 'Auto-Renewable Subscription',
        appAccountToken: ben.id,
      }),
    });
    expect(sub).toMatchObject({ plus: true, phase: 'trial' });
    await ben.api.rituals.addHabit({ habitId: 'sport' });
    expect((await ben.api.rituals.habits()).habits).toHaveLength(3);
    expect((await ben.api.vision.map()).scope).toBe('everywhere');
  });

  it('signalement → suspension : compte bloqué, plus proposé ni sur la carte, plus de push, plus de page publique', async () => {
    cheerUp(ana.id, ben.id, dan.id);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.id)).toContain(dan.id);
    expect((await ana.api.vision.map()).pins.map((p) => p.user.id)).toContain(dan.id);
    const danMe = await dan.api.me.get();
    const teaserBefore = (await ana.api.plus.paywall()).teaser.compatibleNearby;
    await ana.api.safety.report({ userId: dan.id, reason: 'faux_profil', details: 'Photos volées.' });
    const a = admin();
    const report = (await a.reports({ status: 'open' })).items.find((r) => r.target?.id === dan.id);
    expect(report).toBeTruthy();
    await a.act({ action: 'suspend', targetUserId: dan.id, reportId: report?.id, reason: 'Faux profil.', days: 30 });

    expect((await apiError(dan.api.me.get())).code).toBe('suspended');
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.id)).not.toContain(dan.id);
    expect((await ana.api.vision.map()).pins.map((p) => p.user.id)).not.toContain(dan.id);
    expect(await errorCode(ana.api.encounters.wave(dan.id))).toBe('not_found');
    expect(await errorCode(w.anonymous.invites.get(danMe.inviteCode))).toBe('not_found');
    const before = pushesTo('ExponentPushToken[dan]').length;
    await ana.api.notifications.registerDevice({ token: 'ExponentPushToken[ana]', platform: 'ios', timeZone: 'Europe/Paris' });
    const { NOTIFIER } = await import('../src/integrations/push/notifier');
    await w.app.get<{ notify: (u: string, k: 'words_received') => Promise<void> }>(NOTIFIER).notify(dan.id, 'words_received');
    expect(pushesTo('ExponentPushToken[dan]').length).toBe(before);
    // Le paywall ne compte que des personnes proposables : Dan (suspendu) n'y est plus.
    expect((await ana.api.plus.paywall()).teaser.compatibleNearby).toBe(teaserBefore - 1);
  });

  it('suppression du compte : chaque table V7 est vidée de la personne, ses fichiers effacés', async () => {
    const storage = w.app.get<MemoryStorage>(STORAGE);
    const kept = [...db.ritualPhotos.values()].filter((p) => p.userId === ana.id && p.keep).map((p) => p.path);
    expect(kept.length).toBeGreaterThan(0);
    await ana.api.notifications.registerDevice({ token: 'a'.repeat(64), platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'start' } });
    const id = ana.id;
    const has = {
      profilePlaces: db.profilePlaces.has(id),
      visionSignals: db.visionSignals.some((s) => s.userId === id),
      ritualStates: db.ritualStates.has(id),
      dailyChallenges: db.dailyChallenges.some((c) => c.userId === id),
      habits: [...db.habits.values()].some((h) => h.userId === id),
      habitChecks: db.habitChecks.some((c) => c.userId === id),
      weeklyReviews: [...db.weeklyReviews.values()].some((r) => r.userId === id),
      chatLinkSettings: [...db.chatLinkSettings.values()].some((c) => c.userId === id),
      pushDevices: [...db.pushDevices.values()].some((d) => d.userId === id),
      notificationSettings: db.notificationSettings.has(id),
      notificationLog: db.notificationLog.some((l) => l.userId === id),
      encounterProposals: [...db.encounterProposals.keys()].some((k) => k.endsWith(id)),
      liveActivityTokens: [...db.liveActivityTokens.values()].some((t) => t.record.userId === id),
    };
    expect(Object.values(has).every(Boolean)).toBe(true);

    await ana.api.me.remove();
    expect(db.profiles.has(id)).toBe(false);
    expect(db.profilePlaces.has(id)).toBe(false);
    expect(db.visionSignals.some((s) => s.userId === id)).toBe(false);
    expect(db.visionProfiles.has(id)).toBe(false);
    expect(db.matchCache.has(id)).toBe(false);
    expect(db.ritualStates.has(id)).toBe(false);
    expect(db.dailyChallenges.some((c) => c.userId === id)).toBe(false);
    expect([...db.habits.values()].some((h) => h.userId === id)).toBe(false);
    expect(db.habitChecks.some((c) => c.userId === id)).toBe(false);
    expect([...db.ritualPhotos.values()].some((p) => p.userId === id)).toBe(false);
    expect([...db.weeklyReviews.values()].some((r) => r.userId === id)).toBe(false);
    expect([...db.chatLinkSettings.values()].some((c) => c.userId === id || c.linkId === linkId)).toBe(false);
    expect(db.chatPetStates.has(linkId)).toBe(false);
    expect([...db.aiUserCalls.keys()].some((k) => k.startsWith(id))).toBe(false);
    expect([...db.pushDevices.values()].some((d) => d.userId === id)).toBe(false);
    expect(db.notificationSettings.has(id)).toBe(false);
    expect(db.notificationLog.some((l) => l.userId === id)).toBe(false);
    expect([...db.encounterProposals.keys()].some((k) => k.endsWith(id))).toBe(false);
    expect([...db.liveActivityTokens.values()].some((t) => t.record.userId === id)).toBe(false);
    expect(db.accountActivity.has(id)).toBe(false);
    expect([...db.activityDays].some((k) => k.endsWith(id))).toBe(false);
    expect(db.links.has(linkId)).toBe(false);
    expect(db.messages.some((m) => m.linkId === linkId)).toBe(false);
    expect([...db.encounters.values()].some((e) => e.fromUser === id || e.toUser === id)).toBe(false);
    for (const path of kept) expect(storage.peek(path)).toBeNull();
    expect(await errorCode(ana.api.me.get())).toBe('unauthorized');
  });

  it('conservation : prévenance puis suppression après 2 ans d’inactivité ; exclusion définitive ; purge de la modération', async () => {
    const jobs = w.app.get(RetentionJobs);
    // Exclusion définitive de Dan (suppression par la modération) : même identifiant de connexion refusé ensuite.
    await admin().act({ action: 'delete', targetUserId: dan.id, reason: 'Faux profil confirmé.', confirmName: 'Dan' });
    expect(db.profiles.has(dan.id)).toBe(false);
    const again = w.client(randomUUID(), 'dan@exemple.fr');
    expect(await apiError(again.api.me.onboard(onboardBody({ displayName: 'Dan' })))).toMatchObject({ code: 'forbidden' });
    expect(db.bannedIdentities.size).toBe(1);
    expect([...db.bannedIdentities.keys()][0]).toMatch(/^[0-9a-f]{64}$/);

    // Ben revient régulièrement ; Carl et les autres non.
    const eve = w.client(randomUUID(), 'eve@exemple.fr');
    await eve.api.me.onboard(onboardBody({ displayName: 'Ève' }));
    const mails = () => w.outbox.filter((m) => m.to === 'eve@exemple.fr');
    const welcome = mails().length;
    w.clock.advanceDays(699);
    expect(await jobs.runDue(w.clock.now())).toBeGreaterThanOrEqual(0);
    expect(mails()).toHaveLength(welcome);
    w.clock.advanceDays(1);
    await ben.api.me.get(); // Ben se connecte : sa date d'activité repart
    await jobs.runDue(w.clock.now());
    expect(mails()).toHaveLength(welcome + 1);
    expect(mails().at(-1)?.subject).toBe('Ton compte Minimoa va être supprimé');
    expect(w.outbox.some((m) => m.to === 'ben@exemple.fr' && m.subject === 'Ton compte Minimoa va être supprimé')).toBe(false);
    await jobs.runDue(w.clock.now());
    expect(mails()).toHaveLength(welcome + 1); // une seule prévenance
    w.clock.advanceDays(29);
    await jobs.runDue(w.clock.now());
    expect(db.profiles.has(eve.id)).toBe(true);
    w.clock.advanceDays(1);
    await jobs.runDue(w.clock.now());
    expect(db.profiles.has(eve.id)).toBe(false);
    expect(db.profiles.has(ben.id)).toBe(true);

    // Les signalements clos et le journal de plus d'un an sont effacés ; l'exclusion tient 3 ans.
    expect(db.purgedReports.size).toBeGreaterThan(0);
    expect(db.auditLog).toHaveLength(0);
    expect(db.bannedIdentities.size).toBe(1);
    w.clock.advanceDays(3 * 365 - 730);
    await jobs.runDue(w.clock.now());
    expect(db.bannedIdentities.size).toBe(0);
    void addDays;
  });
});
