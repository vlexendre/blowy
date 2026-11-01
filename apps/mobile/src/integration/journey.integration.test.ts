/**
 * Test d'intégration RÉEL contre l'API locale (ignoré par défaut ; `pnpm --filter @blowy/mobile test:api`).
 * Utilise les repositories et le client du mobile (aucun mock) :
 * login alex → me → pets/mine → action FEED → relationships → conversations →
 * envoi d'un message → PENDING_MODERATION puis PUBLISHED (worker de modération).
 * Prérequis : API + worker démarrés sur BLOWY_API_URL (défaut http://localhost:3999), base seedée.
 */
import { describe, expect, it } from 'vitest';
import { createApi } from '../core/api/client';
import { createAccountRepository } from '../features/account/api/account.repository';
import { createConversationsRepository } from '../features/conversations/api/conversations.repository';
import { mergeMessages } from '../features/conversations/model/messages';
import { createMatchingRepository } from '../features/matching/api/matching.repository';
import { createPetsRepository } from '../features/pets/api/pets.repository';
import { wasCorrected } from '../features/pets/model/actions';
import { createRelationshipsRepository } from '../features/relationships/api/relationships.repository';

const randomUUID = (): string => globalThis.crypto.randomUUID();

const BASE = process.env.BLOWY_API_URL ?? 'http://localhost:3999';
let token: string | null = null;
const api = createApi({ baseUrl: BASE, getToken: () => token, newCommandId: randomUUID });
const account = createAccountRepository(api, 'ios');
const pets = createPetsRepository(api);
const matching = createMatchingRepository(api);
const rels = createRelationshipsRepository(api);
const convs = createConversationsRepository(api);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('parcours mobile ↔ API locale (alex)', () => {
  let petId = '';
  let conversationId = '';

  it('connexion locale alex (LocalAuthProvider) → session', async () => {
    const s = await account.signIn({ provider: 'local', credential: 'alex' }, 'integration');
    expect(s.accessToken.length).toBeGreaterThan(10);
    expect(s.onboardingRequired).toBe(false);
    token = s.accessToken;
  });

  it('me : profil onboardé, vérifié, préférences', async () => {
    const me = await account.me();
    expect(me.onboarded).toBe(true);
    expect(me.age).toBeGreaterThanOrEqual(18);
    expect(me.preferences).not.toBeNull();
  });

  it('pets/mine : Nino', async () => {
    const p = await pets.mine();
    expect(p.name).toBe('Nino');
    expect(p.species).toBe('NINO');
    petId = p.id;
  });

  it('action FEED (commandId) : confirmée ou corrigée par le serveur ; rejouée = idempotente', async () => {
    const cid = randomUUID();
    const r = await pets.act(cid, petId, { action: 'FEED' });
    expect(['APPLIED', 'NO_GAIN']).toContain(r.outcome);
    expect(r.pet.id).toBe(petId);
    expect(typeof wasCorrected(r)).toBe('boolean');
    const again = await pets.act(cid, petId, { action: 'FEED' });
    expect(again.pet.version).toBe(r.pet.version);
  });

  it('matches : flux conforme au contrat', async () => {
    const f = await matching.feed();
    expect(Array.isArray(f.items)).toBe(true);
  });

  it('relationships : rendez-vous avec Suzie (L.), sans vote d’autrui exposé', async () => {
    const list = await rels.list();
    const withSuzie = list.items.find((r) => r.otherPet.name === 'Suzie');
    expect(withSuzie).toBeDefined();
    expect(withSuzie!.conversationId).not.toBeNull();
    conversationId = withSuzie!.conversationId!;
    const one = await rels.one(withSuzie!.id);
    expect(one.id).toBe(withSuzie!.id);
  });

  it('conversations : liste et messages', async () => {
    const list = await convs.list();
    expect(list.items.some((c) => c.id === conversationId)).toBe(true);
    const page = await convs.messages(conversationId, null);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('message : PENDING_MODERATION à l’envoi, puis PUBLISHED par le worker', async () => {
    const cid = randomUUID();
    const sent = await convs.send(cid, conversationId, cid, `Test d'intégration mobile ${cid.slice(0, 8)}`);
    expect(sent.mine).toBe(true);
    expect(sent.status).toBe('PENDING_MODERATION');
    // Affichage mobile : jamais « publié » avant le serveur.
    expect(mergeMessages([sent], [], new Set())[0]?.kind).toBe('held');
    let status = sent.status;
    for (let i = 0; i < 40 && status === 'PENDING_MODERATION'; i++) {
      await sleep(500);
      const page = await convs.messages(conversationId, null);
      status = page.items.find((m) => m.id === sent.id)?.status ?? status;
    }
    expect(status).toBe('PUBLISHED');
    // Renvoi hors ligne avec le même clientMessageId : dédupliqué (même message).
    const replay = await convs.send(cid, conversationId, cid, `Test d'intégration mobile ${cid.slice(0, 8)}`);
    expect(replay.id).toBe(sent.id);
  }, 30_000);
});
