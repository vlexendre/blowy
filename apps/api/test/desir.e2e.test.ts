/**
 * Désir de Minimoa+ sans rien inventer (docs/DESIR.md) : collection saisonnière à vraie date de fin, moments clés
 * plafonnés par le serveur, mesure de la conversion par déclencheur.
 */
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { memoryJws } from '../src/modules/billing/infrastructure/memory-billing';
import { PARIS, type TestWorld, onboardBody, startWorld } from './helpers';

const DAY = 86_400_000;

describe('Désir de Minimoa+', () => {
  let w: TestWorld;
  beforeAll(async () => {
    w = await startWorld({ ADMIN_EMAILS: 'ops@minimoa.app' });
  });
  afterAll(() => w.close());

  const now = (): number => w.clock.now().getTime();
  const admin = () => createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:ops@minimoa.app` });
  const yearly = (id: string, days = 7) =>
    memoryJws({
      transactionId: `T-${id}`,
      originalTransactionId: `O-${id}`,
      bundleId: 'app.blowy',
      productId: 'app.blowy.plus.yearly',
      purchaseDate: now(),
      expiresDate: now() + days * DAY,
      signedDate: now(),
      environment: 'Sandbox',
      offerType: 1,
      offerDiscountType: 'FREE_TRIAL',
      type: 'Auto-Renewable Subscription',
      appAccountToken: id,
    });

  it('déclencheurs : ouverture et essai comptés par déclencheur, une restauration ne compte pas', async () => {
    const { api, id } = w.client();
    await api.me.onboard(onboardBody());
    await api.plus.opened('far_away');
    await api.plus.opened('far_away');
    await api.plus.opened('try_on');
    const signedTransaction = yearly(id);
    expect(await api.plus.submitPurchase({ store: 'apple', signedTransaction, trigger: 'far_away' })).toMatchObject({ plus: true, phase: 'trial' });
    // Restaurer le même abonnement (déjà ouvert) : pas une conversion.
    await api.plus.submitPurchase({ store: 'apple', signedTransaction, trigger: 'far_away' });
    const report = await admin().growth();
    expect(report.plus.find((r) => r.trigger === 'far_away')).toEqual({ trigger: 'far_away', opens: 2, trials: 1, paid: 0, rate: 0.5 });
    expect(report.plus.find((r) => r.trigger === 'try_on')).toMatchObject({ opens: 1, trials: 0 });
  });

  it('moment clé : jamais le jour de l’inscription, une fois après le premier lien, puis plafonné', async () => {
    const a = w.client();
    const b = w.client();
    await a.api.me.onboard(onboardBody({ displayName: 'Léa' }));
    await b.api.me.onboard(onboardBody({ displayName: 'Tom' }));
    expect(await a.api.plus.moment()).toEqual({ moment: null });
    w.clock.advanceDays(1);
    expect(await a.api.plus.moment()).toEqual({ moment: null });
    // Première rencontre réussie : les deux se saluent, le lien naît.
    await a.api.encounters.wave(b.id);
    await b.api.encounters.wave(a.id);
    expect((await a.api.links.list()).length).toBe(1);
    expect(await a.api.plus.moment()).toEqual({ moment: 'first_link' });
    // Une fois seulement, même si l'app redemande.
    expect(await a.api.plus.moment()).toEqual({ moment: null });
    // Tom aussi a vécu sa première rencontre : sa proposition à lui.
    expect(await b.api.plus.moment()).toEqual({ moment: 'first_link' });
  });

  it('vu de loin : de vraies personnes compatibles au-delà de la zone, comptées sans identité, rien avec Minimoa+', async () => {
    const FARTHER = { latitude: 48.83, longitude: 2.4 };
    const me = w.client();
    await me.api.me.onboard(onboardBody({ displayName: 'Ana', location: PARIS }));
    const others = [];
    for (let i = 0; i < 9; i++) {
      const o = w.client();
      await o.api.me.onboard(onboardBody({ displayName: `Loin ${i}`, location: FARTHER }));
      others.push(o);
    }
    const hidden = w.client();
    await hidden.api.me.onboard(onboardBody({ displayName: 'Discrète', location: FARTHER }));
    await hidden.api.me.update({ discreet: true });
    w.clock.advanceDays(1);

    const list = await me.api.encounters.list();
    const shown = new Set(list.suggestions.map((s) => s.user.id));
    const expected = others.filter((o) => !shown.has(o.id)).length;
    expect(expected).toBeGreaterThan(0);
    expect(list.far).toMatchObject({ count: expected });
    expect(list.far?.label).toMatch(/au-delà de ta zone/);
    // Personne en mode discret : jamais comptée ; aucune identité dans le bloc.
    expect(JSON.stringify(list.far)).not.toMatch(/Loin|Discrète/);
    const map = await me.api.vision.map();
    expect(map.beyond.count).toBe(9);
    expect(map.beyond.strong).toBeLessThanOrEqual(9);

    await me.api.plus.submitPurchase({ store: 'apple', signedTransaction: yearly(me.id) });
    expect((await me.api.encounters.list()).far).toBeNull();
  });

  it('collection Hiver : vraie date de fin, gardée par qui avait Minimoa+, plus proposée aux autres après', async () => {
    const free = w.client();
    const member = w.client();
    await free.api.me.onboard(onboardBody());
    await member.api.me.onboard(onboardBody());
    const before = await free.api.pet.wardrobe();
    expect(before.collection).toMatchObject({ id: 'hiver_2026', until: '2027-01-31', kept: false });
    expect(before.items.find((i) => i.id === 'hiver_bonnet')).toMatchObject({ state: 'premium', plus: true });
    const paywall = await free.api.plus.paywall();
    expect(paywall.collection).toMatchObject({ id: 'hiver_2026', until: '2027-01-31' });

    // Minimoa+ pour un an : la collection est à lui.
    await member.api.plus.submitPurchase({ store: 'apple', signedTransaction: yearly(member.id, 400) });
    const owned = await member.api.pet.wardrobe();
    expect(owned.collection).toMatchObject({ kept: true });
    expect(owned.items.find((i) => i.id === 'hiver_bonnet')?.state).toBe('owned');
    await member.api.pet.setOutfit({ head: 'hiver_bonnet' });

    // Après le 31 janvier : plus de collection ; il garde ses objets, les autres ne les voient plus proposés.
    w.clock.advanceDays(Math.ceil((Date.parse('2027-02-01T10:00:00Z') - now()) / DAY));
    const after = await free.api.pet.wardrobe();
    expect(after.collection).toBeNull();
    expect(after.items.some((i) => i.id.startsWith('hiver_'))).toBe(false);
    expect((await free.api.plus.paywall()).collection).toBeNull();
    const kept = await member.api.pet.wardrobe();
    expect(kept.items.find((i) => i.id === 'hiver_bonnet')?.state).toBe('owned');
    expect(kept.outfit.head).toBe('hiver_bonnet');
  });
});
