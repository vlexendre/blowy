import { randomUUID } from 'node:crypto';
import { type ApiClient, createAdminClient } from '@blowy/api-client';
import { QUIZ } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { QuartierJobs } from '../src/modules/quartiers/application/quartier.jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, errorCode, onboardBody, startWorld } from './helpers';

type P = { id: string; api: ApiClient };
const answers = (choice: 'a' | 'b' | 'c') => QUIZ.map((q) => ({ questionId: q.id, choice }));
const tokenOf = (html: string): string => /[?&]t=([A-Za-z0-9_-]+)/.exec(html)?.[1] ?? '';

/** Quiz du site et « Ouvre ton quartier » (docs/VIRALITE.md). En mémoire. */
describe('quiz et quartiers', () => {
  let w: TestWorld;
  let db: MemoryDb;
  const admin = () => createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:ops@minimoa.app` });
  const tick = () => w.app.get(QuartierJobs).runDue(w.clock.now());
  const calm = () => w.clock.advanceMinutes(2); // fenêtre des limites par IP

  beforeAll(async () => {
    w = await startWorld({ ADMIN_EMAILS: 'ops@minimoa.app' });
    db = w.app.get<MemoryDb>(MEMORY_DB);
  });
  afterAll(() => w.close());

  describe('quiz', () => {
    let code = '';

    it('sans compte : réponses → résultat gardé sous un code court, aucune donnée personnelle', async () => {
      await w.anonymous.quiz.start();
      const r = await w.anonymous.quiz.submit({ answers: answers('a'), locale: 'fr' });
      expect(r.code).toMatch(/^Q[2-9A-HJ-NP-Z]{6}$/);
      expect(['nino', 'suzie', 'gaston', 'pia']).toContain(r.species);
      code = r.code;
      expect(await w.anonymous.quiz.result(code.toLowerCase())).toEqual(r);
      expect(Object.keys(db.quizResults.get(code) ?? {}).sort()).toEqual(['code', 'createdAt', 'gauges', 'locale', 'ref', 'second', 'species', 'trait']);
      expect(await errorCode(w.anonymous.quiz.submit({ answers: answers('a').slice(1) }))).toBe('invalid');
      expect(await errorCode(w.anonymous.quiz.result('QZZZZZZ'))).toBe('not_found');
    });

    it('« Défie tes potes » : le défi et les partages sont comptés (facteur K du quiz)', async () => {
      await w.anonymous.quiz.share('challenge');
      await w.anonymous.quiz.start(code);
      const friend = await w.anonymous.quiz.submit({ answers: answers('c'), ref: code });
      expect(db.quizResults.get(friend.code)?.ref).toBe(code);
      const report = await admin().growth();
      const week = report.quiz.at(-1);
      expect(week).toMatchObject({ started: 2, challenged: 1, done: 2, shared: 1 });
      expect(week?.k).toBeCloseTo(0.5);
    });

    it('le code se tape dans « Un code ? » et pré-remplit le minimoa ; le compte vient du quiz', async () => {
      calm();
      expect(await w.anonymous.growth.code(code)).toEqual({ kind: 'quiz', code, label: null });
      const r = await w.anonymous.quiz.result(code);
      const p = w.client();
      await p.api.me.onboard(onboardBody({ pet: { name: 'Lou', species: r.species }, quiz: r.gauges, attribution: { source: 'quiz', ref: code } }));
      expect(db.acquisitions.get(p.id)).toMatchObject({ source: 'quiz', ref: code });
      expect((await p.api.me.get()).pet.species).toBe(r.species);
    });
  });

  describe('quartiers', () => {
    let lea: P;
    let first = '';

    it('compteur réel, inscription en double opt-in ; seules les adresses confirmées comptent', async () => {
      calm();
      expect(await w.anonymous.quartiers.status('paris-11')).toEqual({ zone: 'paris-11', label: 'Paris 11e', count: 0, threshold: 50, missing: 50, open: false });
      expect(await errorCode(w.anonymous.quartiers.status('atlantide'))).toBe('not_found');
      expect(await errorCode(w.anonymous.quartiers.join({ zone: 'paris-11', email: 'pas-une-adresse', consent: true, locale: 'fr' }))).toBe('invalid');
      const before = w.outbox.length;
      const joined = await w.anonymous.quartiers.join({ zone: 'paris-11', email: ' Ana@Exemple.fr ', consent: true, locale: 'fr' });
      expect(joined.status.count).toBe(0);
      const mail = w.outbox[before];
      expect(mail?.to).toBe('ana@exemple.fr');
      expect(mail?.subject).toBe('Confirme ton inscription à Minimoa');
      const confirmed = await w.anonymous.quartiers.confirm(tokenOf(mail?.html ?? ''));
      expect(confirmed.status.count).toBe(1);
      expect(confirmed.code).toMatch(/^N[2-9A-HJ-NP-Z]{7}$/);
      first = confirmed.code;
      // La même adresse ne s'inscrit pas deux fois ; la réponse ne dit pas qu'elle l'était.
      const again = await w.anonymous.quartiers.join({ zone: 'paris-11', email: 'ana@exemple.fr', consent: true, locale: 'fr' });
      expect(again.status.count).toBe(1);
      expect(w.outbox.length).toBe(before + 1);
    });

    it('inviter fait avancer son quartier ; le compte de l’app voit le compteur de sa zone', async () => {
      calm();
      for (const [i, ref] of [first, first, undefined].entries()) {
        const n = w.outbox.length;
        await w.anonymous.quartiers.join({ zone: 'paris-11', email: `voisin${i}@exemple.fr`, consent: true, locale: 'fr', ref });
        await w.anonymous.quartiers.confirm(tokenOf(w.outbox[n]?.html ?? ''));
        w.clock.advanceMinutes(1);
      }
      lea = w.client();
      await lea.api.me.onboard(onboardBody({ displayName: 'Léa', location: { latitude: 48.858, longitude: 2.381 } }));
      const mine = await lea.api.quartiers.mine();
      expect(mine.status).toMatchObject({ zone: 'paris-11', count: 4, missing: 46, open: false });
      const n = w.outbox.length;
      calm();
      await w.anonymous.quartiers.join({ zone: 'paris-11', email: 'amie-de-lea@exemple.fr', consent: true, locale: 'en', ref: mine.inviteCode });
      expect(w.outbox[n]?.subject).toBe('Confirm your Minimoa sign-up');
      await w.anonymous.quartiers.confirm(tokenOf(w.outbox[n]?.html ?? ''));
      expect((await lea.api.quartiers.mine()).status?.count).toBe(5);
    });

    it('désinscription en un clic : l’adresse est effacée, le compteur baisse', async () => {
      calm();
      const n = w.outbox.length;
      await w.anonymous.quartiers.join({ zone: 'paris-11', email: 'parti@exemple.fr', consent: true, locale: 'fr' });
      const token = tokenOf(w.outbox[n]?.html ?? '');
      await w.anonymous.quartiers.confirm(token);
      expect((await w.anonymous.quartiers.status('paris-11')).count).toBe(6);
      await w.anonymous.quartiers.unsubscribe(token);
      expect((await w.anonymous.quartiers.status('paris-11')).count).toBe(5);
      expect([...db.quartierSignups.values()].some((s) => s.email === 'parti@exemple.fr')).toBe(false);
    });

    it('seuil atteint : le minuteur ouvre, pose les fondateurs, prévient chacun une fois ; l’objet suit le code', async () => {
      const a = admin();
      expect((await a.setQuartierThreshold(5)).threshold).toBe(5);
      const n = w.outbox.length;
      await tick();
      const opened = (await a.quartiers()).items.find((q) => q.zone === 'paris-11');
      expect(opened).toMatchObject({ open: true, openedBy: 'threshold', count: 5, founders: 2, notified: 5 });
      const sent = w.outbox.slice(n);
      expect(sent).toHaveLength(5);
      expect(sent.every((m) => m.subject === 'Paris 11e est ouvert sur Minimoa' || m.subject === 'Paris 11th is open on Minimoa')).toBe(true);
      const anaMail = sent.find((m) => m.to === 'ana@exemple.fr');
      expect(anaMail?.text).toContain('médaille de fondateur');
      expect(anaMail?.text).toContain(first);
      await tick();
      expect(w.outbox.length).toBe(n + 5);
      // Léa (compte) a invité : objet « Fondateur ». Ana le reçoit en reprenant son code à l'inscription.
      await lea.api.pet.get();
      expect((await lea.api.pet.wardrobe()).items.find((i) => i.id === 'fondateur')?.state).toBe('owned');
      const ana = w.client();
      await ana.api.me.onboard(onboardBody({ displayName: 'Ana', attribution: { source: 'quartier', ref: first } }));
      expect(db.acquisitions.get(ana.id)?.source).toBe('quartier');
      await ana.api.pet.get();
      expect((await ana.api.pet.wardrobe()).items.find((i) => i.id === 'fondateur')?.state).toBe('owned');
    });

    it('ouverture à la main ; 30 jours après l’e-mail, les adresses sont effacées', async () => {
      calm();
      await w.anonymous.quartiers.join({ zone: 'lyon-3', email: 'lou@exemple.fr', consent: true, locale: 'fr' });
      const list = await admin().openQuartier('lyon-3');
      expect(list.items.find((q) => q.zone === 'lyon-3')).toMatchObject({ open: true, openedBy: 'admin', pending: 1, count: 0 });
      w.clock.advanceDays(31);
      await tick();
      expect([...db.quartierSignups.values()].filter((s) => s.zone === 'paris-11').every((s) => s.email === null && s.code)).toBe(true);
      // L'inscription non confirmée de Lyon (plus de 7 jours) est effacée.
      expect([...db.quartierSignups.values()].some((s) => s.zone === 'lyon-3')).toBe(false);
    });
  });
});
