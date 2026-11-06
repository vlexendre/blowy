/**
 * Intégration social (§21 n°16) sur PostgreSQL réel :
 *  - page anonyme bornée aux 12 mots (aucun texte libre), anti-rejeu du jeton, une réponse par
 *    visiteur, quota visiteur, réputation non farmable, page désactivable, retrait/signalement,
 *    aucun indice inventé ;
 *  - parrainage : lien signé, anti-auto-parrainage, aucune récompense au clic/claim, récompense
 *    +100/+100 une seule fois via ledger après activation, rejeu du consommateur sans doublon.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { onboard, startHarness, TestClient, type Harness } from '../../../../test/integration/harness.js';
import { ReferralUseCases } from '../application/use-cases/referral.use-cases.js';

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

const visitor = () => randomBytes(24).toString('base64url');
async function pub(method: string, path: string, body?: unknown, v?: string) {
  const res = await fetch(`${h.baseUrl}${path}`, { method, headers: { 'content-type': 'application/json', ...(v ? { 'x-blowy-visitor': v } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text();
  return { status: res.status, body: t ? JSON.parse(t) : null };
}

async function targetWithSlug(key: string, slug: string) {
  const c = new TestClient(h);
  await onboard(c, key, { gender: 'WOMAN', seeking: ['MAN'] });
  await h.db.profile.update({ where: { userId: c.userId }, data: { publicSlug: slug } });
  return c;
}

describe('réponses anonymes « 3 mots »', () => {
  it('12 mots seulement, anti-rejeu, une réponse par visiteur, réputation non farmable', async () => {
    const t = await targetWithSlug('anon.t', 'alex-test');
    const v = visitor();
    const p = await pub('GET', '/v1/public/profiles/alex-test', undefined, v);
    expect(p.status).toBe(200);
    expect(p.body.words).toHaveLength(12);
    expect(JSON.stringify(p.body)).not.toContain(t.userId);
    expect(p.body).not.toHaveProperty('email');

    // Mot hors liste / texte libre / 4 mots / doublon : refusés.
    for (const words of [['SUPER'], ['DROLE', 'LOYAL', 'SOLAIRE', 'FIABLE'], ['DROLE', 'DROLE'], []]) {
      expect((await pub('POST', '/v1/public/profiles/alex-test/responses', { words, formToken: p.body.formToken, visitorToken: v })).status).toBe(400);
    }
    expect((await pub('POST', '/v1/public/profiles/alex-test/responses', { words: ['DROLE'], text: 'insulte', formToken: p.body.formToken, visitorToken: v })).status).toBe(200);
    expect((await h.db.anonymousResponse.findFirstOrThrow({ where: { targetUserId: t.userId } })).words).toEqual(['DROLE']);

    // Rejeu du même jeton : refusé.
    expect((await pub('POST', '/v1/public/profiles/alex-test/responses', { words: ['LOYAL'], formToken: p.body.formToken, visitorToken: v })).status).toBe(409);
    // Rechargement (nouveau jeton) même visiteur : ALREADY_ANSWERED, pas de 2e réponse.
    const p2 = await pub('GET', '/v1/public/profiles/alex-test', undefined, v);
    const again = await pub('POST', '/v1/public/profiles/alex-test/responses', { words: ['LOYAL', 'SOLAIRE'], formToken: p2.body.formToken, visitorToken: v });
    expect(again.body.status).toBe('ALREADY_ANSWERED');
    expect(await h.db.anonymousResponse.count({ where: { targetUserId: t.userId } })).toBe(1);
    const rep = await h.db.reputationAggregate.findUniqueOrThrow({ where: { userId: t.userId } });
    expect(rep.respondents).toBe(1);
    // Jeton signé pour une autre cible : refusé.
    await targetWithSlug('anon.u', 'autre-test');
    const other = await pub('GET', '/v1/public/profiles/autre-test', undefined, v);
    expect((await pub('POST', '/v1/public/profiles/alex-test/responses', { words: ['LOYAL'], formToken: other.body.formToken, visitorToken: visitor() })).status).toBe(412);
    // Jeton expiré.
    const p3 = await pub('GET', '/v1/public/profiles/alex-test', undefined, v);
    h.clock.advance(31 * 60_000);
    expect((await pub('POST', '/v1/public/profiles/alex-test/responses', { words: ['LOYAL'], formToken: p3.body.formToken, visitorToken: visitor() })).status).toBe(412);
  });

  it('quota visiteur, désactivation, retrait et signalement par la cible, aucun indice inventé', async () => {
    const t = await targetWithSlug('anon.q', 'quota-test');
    const v = visitor();
    // Quota visiteur/jour (10) sur des cibles différentes.
    for (let i = 0; i < 11; i++) {
      await targetWithSlug(`anon.q${i}`, `quota-${i}`);
      const p = await pub('GET', `/v1/public/profiles/quota-${i}`, undefined, v);
      const r = await pub('POST', `/v1/public/profiles/quota-${i}/responses`, { words: ['FIABLE'], formToken: p.body.formToken, visitorToken: v });
      expect(r.status).toBe(i < 10 ? 200 : 429);
    }
    const p = await pub('GET', '/v1/public/profiles/quota-test', undefined, visitor());
    const vv = visitor();
    const p1 = await pub('GET', '/v1/public/profiles/quota-test', undefined, vv);
    await pub('POST', '/v1/public/profiles/quota-test/responses', { words: ['SOLAIRE', 'APAISANT'], formToken: p1.body.formToken, visitorToken: vv });

    const own = await t.call('GET', '/v1/me/anonymous-responses');
    expect(own.status).toBe(200);
    expect(own.body.items).toHaveLength(1);
    expect(JSON.stringify(own.body)).not.toMatch(/visitor/i);
    const id = own.body.items[0].id;
    const hints = await t.call('GET', `/v1/me/anonymous-responses/${id}/hints`);
    // V5 (§7.7) : « Qui a écrit ? » est retiré — 410 RETIRED_IN_V5, aucun indice possible.
    expect([hints.status, hints.body.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);
    expect((await t.call('POST', `/v1/me/anonymous-responses/${id}/report`, {})).status).toBe(201);
    expect((await h.db.reputationAggregate.findUniqueOrThrow({ where: { userId: t.userId } })).respondents).toBe(0);
    expect(await h.db.outboxEvent.count({ where: { topic: 'social.anonymous_response_reported' } })).toBe(1);

    // Désactivation : la page n'existe plus publiquement, l'ancien jeton ne sert plus.
    expect((await t.call('PUT', '/v1/me/public-page', { enabled: false })).status).toBe(200);
    expect((await pub('POST', '/v1/public/profiles/quota-test/responses', { words: ['DROLE'], formToken: p.body.formToken, visitorToken: visitor() })).status).toBe(404);
  });
});

describe('parrainage', () => {
  it('pas d’auto-parrainage, pas de récompense au clic/claim, +100/+100 une seule fois après activation', async () => {
    const referrer = new TestClient(h);
    await onboard(referrer, 'ref.alex', { gender: 'MAN', seeking: ['WOMAN'] });
    const link = await referrer.call('POST', '/v1/referrals/link', {});
    expect(link.status).toBe(200);
    expect(link.body.url).toContain(`/invite/${link.body.token}`);

    // Aperçu public : valide ; jeton altéré : signature invalide.
    expect((await pub('GET', `/v1/public/invites/${link.body.token}`)).body.valid).toBe(true);
    const forged = link.body.token.replace(/.$/, (c: string) => (c === 'A' ? 'B' : 'A'));
    expect((await pub('GET', `/v1/public/invites/${forged}`)).body.reason).toBe('INVALID_SIGNATURE');

    // Auto-parrainage refusé.
    expect((await referrer.call('POST', '/v1/referrals/claim', { ref: link.body.token })).status).toBe(403);

    // Nouveau compte : claim (code court de repli) AVANT activation → aucune pièce.
    h.clock.advance(60_000);
    const referee = new TestClient(h);
    await referee.signIn('ref.new');
    const claim = await referee.call('POST', '/v1/referrals/claim', { ref: link.body.code });
    expect(claim.status).toBe(200);
    expect(claim.body.status).toBe('PENDING_ACTIVATION');
    expect(claim.body.missing).toEqual(expect.arrayContaining(['PRIMARY_PET', 'VERIFICATION', 'FIRST_ACTION']));
    await h.drain();
    expect(await h.db.ledgerEntry.count()).toBe(0);
    // Second claim : refusé (un seul parrainage par filleul).
    expect((await referee.call('POST', '/v1/referrals/claim', { ref: link.body.token })).status).toBe(409);

    // Activation : onboarding complet (pet + vérification fixture locale) + première action.
    await referee.call('PATCH', '/v1/me', { displayName: 'Nouveau', gender: 'WOMAN', birthDate: '1998-05-10', zoneCode: 'PARIS_11', timezone: 'Europe/Paris' });
    await referee.call('POST', '/v1/consents', { items: ['TERMS', 'PRIVACY', 'AI_MODERATION'].map((purpose) => ({ purpose, version: '2026-11', granted: true })) });
    const pet = await referee.call('POST', '/v1/pets', { name: 'Pet-new', species: 'NINO', vision: { axes: { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 }, school: 'AUTODIDACTE', sunday: 'BRUNCH', passions: ['MUSIQUE'], limit: 'MENTIR' } });
    await referee.call('POST', '/v1/verifications', { kind: 'SELFIE_QUALITY' });
    await h.drain();
    expect(await h.db.ledgerEntry.count()).toBe(0); // pas encore de première action
    // V5 : les gestes de soin sont retirés (410) ; la 1ʳᵉ action valide V5 est la 1ʳᵉ sortie vécue (parcours
    // `alex-invite-son-quartier`). Ici, raccourci de test documenté : un soin déjà enregistré (historique V4) compte.
    expect((await referee.call('POST', `/v1/pets/${pet.body.id}/actions`, { action: 'FEED' })).status).toBe(410);
    await h.db.petCareEvent.create({ data: { petId: pet.body.id, actorUserId: referee.userId, action: 'FEED', occurredAt: h.clock.now(), effects: {}, engineVersion: 'test', tuningVersion: 'test' } });
    await h.app.get(ReferralUseCases).activatePending(); // job `social.referral_activation` (filet)
    await h.drain();
    await h.drain();

    const entries = await h.db.ledgerEntry.findMany();
    expect(entries.map((e) => [e.userId, e.reason, e.amount]).sort((x, y) => String(x[1]).localeCompare(String(y[1])))).toEqual([
      [referee.userId, 'REFERRAL_REFEREE', 100],
      [referrer.userId, 'REFERRAL_REFERRER', 100],
    ]);
    expect((await referee.call('GET', '/v1/referrals/me')).body.status).toBe('REWARDED');

    // Rejeu : événement remis en file + job d'activation → aucune nouvelle écriture.
    await h.db.outboxEvent.updateMany({ where: { topic: 'referral.activated' }, data: { publishedAt: null } });
    await h.db.consumerDeduplication.deleteMany({ where: { consumer: 'economy.referral_reward' } });
    await h.drain();
    await h.drain();
    expect(await h.db.ledgerEntry.count()).toBe(2);
    expect(await h.db.outboxEvent.count({ where: { topic: 'economy.referral_rewarded' } })).toBe(1);
  });

  it('un compte existant avant le lien ne peut pas être parrainé rétroactivement', async () => {
    const old = new TestClient(h);
    await onboard(old, 'ref.old', { gender: 'WOMAN', seeking: ['MAN'] });
    h.clock.advance(60_000);
    const referrer = new TestClient(h);
    await onboard(referrer, 'ref.r2', { gender: 'MAN', seeking: ['WOMAN'] });
    const link = await referrer.call('POST', '/v1/referrals/link', {});
    const r = await old.call('POST', '/v1/referrals/claim', { ref: link.body.token });
    expect(r.status).toBe(412);
  });
});
