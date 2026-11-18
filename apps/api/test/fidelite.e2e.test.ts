/**
 * Fidélisation de bout en bout, en mémoire (docs/FIDELISATION.md) :
 * - Minimoa+ hebdomadaire acheté et reconnu ;
 * - messages de l'abonnement : bienvenue (push + e-mail), paiement refusé puis rattrapé, merci au renouvellement de
 *   l'annuel, au revoir, relance unique un mois après ; jamais deux fois ;
 * - nouvelles du minimoa : J1, J3, J7, absence de 14 jours (avec e-mail et ce qui s'est passé), anniversaire d'un mois ;
 *   une par jour au plus, rien quand le type est coupé, rien la nuit.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { notificationText } from '@blowy/content';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { BillingJobs } from '../src/modules/billing/application/billing.jobs';
import { memoryJws } from '../src/modules/billing/infrastructure/memory-billing';
import { FideliteJobs } from '../src/modules/fidelite/application/fidelite.jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { START, type TestWorld, onboardBody, startWorld } from './helpers';

const DAY = 86_400_000;
const plain = (s: string): string => s.replace(/[  ]/g, ' ');

describe('Fidélisation', () => {
  let w: TestWorld;
  const sent: { userId: string; kind: string; vars: Record<string, string> }[] = [];

  beforeAll(async () => {
    w = await startWorld();
    const notifier = w.app.get<Notifier>(NOTIFIER, { strict: false });
    notifier.notify = async (userId, kind, vars = {}) => {
      sent.push({ userId, kind, vars });
    };
  });
  afterAll(() => w.close());
  beforeEach(() => {
    sent.length = 0;
  });

  const now = (): number => w.clock.now().getTime();
  const of = (id: string, kind?: string) => sent.filter((s) => s.userId === id && (!kind || s.kind === kind));
  const mails = (email: string) => w.outbox.filter((m) => m.to === email);

  describe('Minimoa+', () => {
    const tx = (o: string, over: Record<string, unknown> = {}) =>
      memoryJws({
        transactionId: `${o}-1`,
        originalTransactionId: o,
        bundleId: 'app.blowy',
        productId: 'app.blowy.plus.yearly',
        purchaseDate: now(),
        expiresDate: now() + 7 * DAY,
        signedDate: now(),
        environment: 'Sandbox',
        offerType: 1,
        offerDiscountType: 'FREE_TRIAL',
        type: 'Auto-Renewable Subscription',
        ...over,
      });
    const renewal = (o: string, over: Record<string, unknown> = {}) =>
      memoryJws({ originalTransactionId: o, autoRenewStatus: 1, isInBillingRetryPeriod: false, signedDate: now(), environment: 'Sandbox', ...over });
    const notify = async (type: string, subtype: string | null, t: string, r: string | null, status = 1) => {
      const res = await fetch(`${w.baseUrl}/v1/plus/apple/notifications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          signedPayload: memoryJws({
            notificationType: type,
            subtype,
            notificationUUID: randomUUID(),
            signedDate: now(),
            data: { bundleId: 'app.blowy', environment: 'Sandbox', status, signedTransactionInfo: t, ...(r ? { signedRenewalInfo: r } : {}) },
          }),
        }),
      });
      return ((await res.json()) as { outcome?: string }).outcome;
    };

    it('hebdomadaire : 2,99 € par semaine, sans essai, reconnue à l’achat', async () => {
      const email = `hebdo-${randomUUID()}@example.com`;
      const { api, id } = w.client(undefined, email);
      await api.me.onboard(onboardBody());
      const o = `W-${id}`;
      const sub = await api.plus.submitPurchase({
        store: 'apple',
        signedTransaction: tx(o, { productId: 'app.blowy.plus.weekly', offerType: null, offerDiscountType: null, expiresDate: now() + 7 * DAY }),
        signedRenewalInfo: renewal(o),
      });
      expect(sub).toMatchObject({ plus: true, phase: 'active', plan: 'weekly', productId: 'app.blowy.plus.weekly', willRenew: true });
      // Bienvenue, sans phrase d'essai dans l'e-mail.
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['welcome']);
      const welcome = mails(email).find((m) => m.subject === 'Bienvenue dans Minimoa+');
      expect(welcome?.text).toMatch(/Réglages, ton nom, puis Abonnements/);
      expect(welcome?.text).not.toMatch(/essai/);
    });

    it('bienvenue une seule fois, paiement refusé puis rattrapé, pas de merci après l’essai, merci au renouvellement de l’annuel', async () => {
      const email = `plus-${randomUUID()}@example.com`;
      const { api, id } = w.client(undefined, email);
      await api.me.onboard(onboardBody());
      const o = `Y-${id}`;
      await api.plus.submitPurchase({ store: 'apple', signedTransaction: tx(o, { appAccountToken: id }), signedRenewalInfo: renewal(o) });
      // La notification SUBSCRIBED du même achat arrive ensuite : pas de seconde bienvenue.
      expect(await notify('SUBSCRIBED', 'INITIAL_BUY', tx(o, { appAccountToken: id }), renewal(o))).toBe('applied');
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['welcome']);
      expect(notificationText('fr', 'plus_account', of(id)[0]?.vars ?? {}).title).toBe('Bienvenue dans Minimoa+');
      const welcome = mails(email).filter((m) => m.subject === 'Bienvenue dans Minimoa+');
      expect(welcome).toHaveLength(1);
      expect(plain(welcome[0]?.text ?? '')).toMatch(/Ton essai gratuit court jusqu’au \d+ novembre\. On t’envoie un rappel deux jours avant le premier paiement\./);
      expect(welcome[0]?.text).toMatch(/Toute la carte/);

      // Fin de l'essai : premier paiement, pas de « merci pour une année de plus ».
      w.clock.advanceDays(7);
      const year1 = tx(o, { transactionId: `${o}-2`, purchaseDate: now(), expiresDate: now() + 365 * DAY, offerType: null, offerDiscountType: null, appAccountToken: id });
      await notify('DID_RENEW', null, year1, renewal(o));
      expect(of(id, 'plus_account')).toHaveLength(1);

      // Un an plus tard, le paiement est refusé : délai de grâce de 16 jours.
      w.clock.advanceDays(365);
      sent.length = 0;
      const graceUntil = now() + 16 * DAY;
      const failed = tx(o, { transactionId: `${o}-2`, purchaseDate: now() - 365 * DAY, expiresDate: now(), offerType: null, offerDiscountType: null, appAccountToken: id });
      await notify('DID_FAIL_TO_RENEW', 'GRACE_PERIOD', failed, renewal(o, { isInBillingRetryPeriod: true, gracePeriodExpiresDate: graceUntil }), 4);
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['billing_grace']);
      expect(of(id)[0]?.vars.endsOn).toBe(new Date(graceUntil).toISOString());
      expect(plain(notificationText('fr', 'plus_account', of(id)[0]?.vars ?? {}).body)).toMatch(/^Minimoa\+ reste ouvert jusqu’au \d+ \p{L}+\. Mets à jour ton moyen de paiement : Moi › Minimoa\+ › Gérer mon abonnement\.$/u);
      const billing = mails(email).find((m) => m.subject === 'Le paiement de Minimoa+ n’est pas passé');
      expect(billing?.html).toContain('https://apps.apple.com/account/subscriptions');
      // Apple renvoie la même nouvelle : rien de plus.
      await notify('DID_FAIL_TO_RENEW', 'GRACE_PERIOD', failed, renewal(o, { isInBillingRetryPeriod: true, gracePeriodExpiresDate: graceUntil }), 4);
      expect(of(id, 'plus_account')).toHaveLength(1);

      // Paiement rattrapé.
      w.clock.advanceDays(2);
      const recovered = tx(o, { transactionId: `${o}-3`, purchaseDate: now(), expiresDate: now() + 365 * DAY, offerType: null, offerDiscountType: null, appAccountToken: id });
      await notify('DID_RENEW', 'BILLING_RECOVERY', recovered, renewal(o));
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['billing_grace', 'recovered']);

      // Renouvellement suivant de l'annuel : merci.
      w.clock.advanceDays(365);
      const year3 = tx(o, { transactionId: `${o}-4`, purchaseDate: now(), expiresDate: now() + 365 * DAY, offerType: null, offerDiscountType: null, appAccountToken: id });
      await notify('DID_RENEW', null, year3, renewal(o));
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['billing_grace', 'recovered', 'renewed']);
      expect(notificationText('fr', 'plus_account', of(id)[2]?.vars ?? {}).title).toBe('Une année de plus avec Minimoa+');
    });

    it('au revoir dans la semaine qui suit la fin, relance unique un mois après, rien si Minimoa+ a repris', async () => {
      const jobs = w.app.get(BillingJobs, { strict: false });
      const email = `fin-${randomUUID()}@example.com`;
      const { api, id } = w.client(undefined, email);
      await api.me.onboard(onboardBody());
      const o = `M-${id}`;
      // Mensuelle, annulée tout de suite : fin dans 30 jours.
      await api.plus.submitPurchase({
        store: 'apple',
        signedTransaction: tx(o, { productId: 'app.blowy.plus.monthly', offerType: null, offerDiscountType: null, expiresDate: now() + 30 * DAY }),
        signedRenewalInfo: renewal(o, { autoRenewStatus: 0 }),
      });
      const end = now() + 30 * DAY;
      // Passes du minuteur à 11 h, heure de Paris (créneau de la demi-heure).
      const at = (days: number) => {
        const d = new Date(end + days * DAY);
        d.setUTCHours(10, 0, 0, 0);
        return d;
      };
      sent.length = 0;
      await jobs.runDue(at(-1));
      expect(of(id, 'plus_account')).toEqual([]);
      await jobs.runDue(at(1));
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['goodbye']);
      const bye = mails(email).find((m) => m.subject === 'Minimoa+ s’arrête ici');
      expect(bye?.text).toMatch(/2 habitudes suivies en même temps/);
      expect(bye?.text).toMatch(/tes liens et toutes vos conversations/);
      // Pas la nuit, pas deux fois.
      const night = at(2);
      night.setUTCHours(1, 0, 0, 0);
      await jobs.runDue(night);
      await jobs.runDue(at(2));
      expect(of(id, 'plus_account')).toHaveLength(1);

      await jobs.runDue(at(29));
      expect(of(id, 'plus_account')).toHaveLength(1);
      await jobs.runDue(at(31));
      expect(of(id, 'plus_account').map((s) => s.vars.step)).toEqual(['goodbye', 'winback']);
      expect(mails(email).some((m) => m.subject === 'Nino pense à toi' && /c’est le seul message/.test(m.text))).toBe(true);
      await jobs.runDue(at(33));
      expect(of(id, 'plus_account')).toHaveLength(2);
    });

    it('pas d’au revoir si la personne a repris Minimoa+ entre-temps', async () => {
      const jobs = w.app.get(BillingJobs, { strict: false });
      const { api, id } = w.client();
      await api.me.onboard(onboardBody());
      const first = `A-${id}`;
      await api.plus.submitPurchase({
        store: 'apple',
        signedTransaction: tx(first, { productId: 'app.blowy.plus.weekly', offerType: null, offerDiscountType: null, expiresDate: now() + 7 * DAY }),
        signedRenewalInfo: renewal(first, { autoRenewStatus: 0 }),
      });
      const end = now() + 7 * DAY;
      // Reprise par un nouvel achat annuel (autre série) avant la fin.
      const second = `B-${id}`;
      await api.plus.submitPurchase({ store: 'apple', signedTransaction: tx(second, { offerType: null, offerDiscountType: null, expiresDate: now() + 365 * DAY }), signedRenewalInfo: renewal(second) });
      sent.length = 0;
      const d = new Date(end + DAY);
      d.setUTCHours(10, 0, 0, 0);
      await jobs.runDue(d);
      expect(of(id, 'plus_account')).toEqual([]);
    });
  });

  describe('nouvelles du minimoa', () => {
    it('premiers pas J1, J3, J5, J7 (J2 pas rattrapé), rien pendant la semaine d’accueil, absence de 14 jours avec e-mail, anniversaire d’un mois ; une par jour', async () => {
      const jobs = w.app.get(FideliteJobs, { strict: false });
      const db = w.app.get<MemoryDb>(MEMORY_DB, { strict: false });
      // Monde neuf : on repart du 11 novembre à 11 h (Paris) pour des dates lisibles.
      const email = `news-${randomUUID()}@example.com`;
      const { api, id } = w.client(undefined, email);
      await api.me.onboard(onboardBody());
      const created = Date.parse(db.profiles.get(id)?.createdAt ?? '');
      const at = (days: number, hourUtc = 10, minute = 0) => {
        const d = new Date(created + days * DAY);
        d.setUTCHours(hourUtc, minute, 0, 0);
        return d;
      };
      // Quelqu'un lui fait signe pendant son absence.
      const other = w.client();
      await other.api.me.onboard(onboardBody({ displayName: 'Léa' }));
      const iso = new Date(created).toISOString();
      db.encounters.set(randomUUID(), { id: randomUUID(), fromUser: other.id, toUser: id, status: 'waved', intro: null, createdAt: iso, statusAt: iso });
      const news = () => of(id).filter((s) => s.kind === 'first_steps' || s.kind === 'minimoa_news');

      await jobs.runDue(at(1));
      await jobs.runDue(at(1, 10, 30));
      expect(news().map((s) => [s.kind, s.vars.step])).toEqual([['first_steps', 'd1']]);
      expect(notificationText('fr', 'first_steps', news()[0]?.vars ?? {}).title).toBe('Nino veut savoir qui tu es');
      // Hors du créneau de la demi-heure : rien n'est relu.
      expect(await jobs.runDue(at(3, 10, 12))).toBe(0);
      // La nuit (2 h à Paris) : rien.
      await jobs.runDue(at(3, 1));
      expect(news()).toHaveLength(1);
      await jobs.runDue(at(3));
      await jobs.runDue(at(5));
      await jobs.runDue(at(7));
      // Le jour 2 est passé sans envoi (minuteur arrêté) : J2 n'est pas rattrapé le jour 3, J3 part à sa place.
      expect(news().map((s) => s.vars.step)).toEqual(['d1', 'd3', 'd5', 'd7']);
      expect(notificationText('fr', 'first_steps', news()[2]?.vars ?? {}).body).toMatch(/présente/);
      // Jours 8 à 13 : ni premiers pas ni absence de 7 jours (semaine d'accueil).
      for (const day of [8, 9, 10, 11, 12, 13]) await jobs.runDue(at(day));
      expect(news()).toHaveLength(4);
      // 14 jours sans ouvrir l'app : nouvelle du minimoa et e-mail, avec ce qui s'est passé.
      await jobs.runDue(at(14));
      expect(news().map((s) => s.vars.step)).toEqual(['d1', 'd3', 'd5', 'd7', 'absence']);
      expect(news()[4]?.vars.days).toBe('14');
      expect(notificationText('fr', 'minimoa_news', news()[4]?.vars ?? {}).body).toBe('Nino va bien. Tes liens ont peut-être des nouvelles pour toi.');
      const absence = mails(email).filter((m) => m.subject === 'Nino te garde ta place');
      expect(absence).toHaveLength(1);
      expect(absence[0]?.text).toMatch(/1 personne t’a fait signe/);
      expect(absence[0]?.text).toMatch(/coupe « Nouvelles de ton minimoa » dans Moi › Réglages › Notifications/);
      await jobs.runDue(at(15));
      expect(news()).toHaveLength(5);
      // Un mois avec son minimoa.
      await jobs.runDue(at(30));
      expect(news()[5]).toMatchObject({ kind: 'minimoa_news', vars: { step: 'anniversary', count: '1' } });
      expect(notificationText('fr', 'minimoa_news', news()[5]?.vars ?? {}).title).toBe('Un mois avec Nino');
      expect(START.getTime()).toBeLessThanOrEqual(created);
    });

    it('type coupé : ni push ni e-mail ; compte de revue : jamais', async () => {
      const jobs = w.app.get(FideliteJobs, { strict: false });
      const db = w.app.get<MemoryDb>(MEMORY_DB, { strict: false });
      const email = `off-${randomUUID()}@example.com`;
      const off = w.client(undefined, email);
      await off.api.me.onboard(onboardBody());
      await off.api.notifications.updateSettings({ kinds: { first_steps: false, minimoa_news: false } });
      const review = w.client();
      await review.api.me.onboard(onboardBody());
      const p = db.profiles.get(review.id);
      if (p) db.profiles.set(review.id, { ...p, reviewWorld: review.id });
      const created = Date.parse(db.profiles.get(off.id)?.createdAt ?? '');
      for (const day of [1, 3, 7, 14]) {
        const d = new Date(created + day * DAY);
        d.setUTCHours(10, 0, 0, 0);
        await jobs.runDue(d);
      }
      expect(of(off.id)).toEqual([]);
      expect(of(review.id)).toEqual([]);
      expect(mails(email).filter((m) => m.subject.includes('place'))).toEqual([]);
    });
  });
});
