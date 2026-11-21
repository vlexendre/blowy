/**
 * Chantier « plateforme » : passerelle d'IA (budgets, plafond, interrupteur, compteur), minimoas du chat
 * (accord de lecture, rôles, plafonds, repli), notifications (réglages, heures calmes, plafond, langue, jetons
 * invalides), minuteur (secret, idempotence) et adaptateurs réels contre des réponses HTTP enregistrées.
 */
import type { ApiClient } from '@blowy/api-client';
import { CHAT_AI_SYSTEM, chatConfidentialityText, notificationText, surpriseOf } from '@blowy/content';
import type { Message } from '@blowy/contract';
import { DEFAULT_AI_PRICES, parseAiBudgets } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PlateformeEnv } from '../src/config/plateforme.env';
import { AI_GATEWAY, type AiGateway, type AiRequest } from '../src/integrations/ai/ai-gateway';
import { AiUsage } from '../src/integrations/ai/ai-usage.service';
import { AnthropicModel, ANTHROPIC_URL } from '../src/integrations/ai/anthropic-model';
import { MemoryAiUsageStore } from '../src/integrations/ai/memory-usage-store';
import { MemoryModel } from '../src/integrations/ai/memory-model';
import { MeteredAiGateway } from '../src/integrations/ai/metered-gateway';
import { AI_MODEL } from '../src/integrations/plateforme/plateforme.module';
import { EXPO_RECEIPTS_URL, EXPO_SEND_URL, ExpoPusher } from '../src/integrations/push/expo-pusher';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import { DAILY_PUSH_SOURCE, type DailyPushSource } from '../src/modules/notifications/ports';
import { MemoryDb } from '../src/persistence/memory-db';
import { Background } from '../src/shared/background';
import { MemoryCache } from '../src/shared/cache';
import { MEMORY_DB } from '../src/shared/tokens';
import { FakeClock, START, type TestWorld, onboardBody, startWorld } from './helpers';

const SECRET = 'un-secret-de-test-assez-long-pour-passer';

// ── Passerelle d'IA ────────────────────────────────────────────────────────

const aiConfig = (over: Partial<PlateformeEnv['ai']> = {}): PlateformeEnv['ai'] => ({
  provider: 'memory',
  apiKey: null,
  models: { small: 'claude-haiku-5-5', medium: 'claude-sonnet-5-5' },
  prices: DEFAULT_AI_PRICES,
  killSwitch: false,
  dailyCeilingMicros: 1_000_000,
  userBudgets: parseAiBudgets('chat_remark=2'),
  eurPerUsd: 0.9,
  processor: { name: 'Anthropic', country: 'US' },
  ...over,
});

const request = (over: Partial<AiRequest> = {}): AiRequest => ({
  feature: 'chat_remark',
  userId: 'u1',
  system: 'consigne',
  prompt: 'Rôle : remarque.',
  maxTokens: 60,
  tier: 'small',
  locale: 'fr',
  ...over,
});

function gateway(over: Partial<PlateformeEnv['ai']> = {}, model: MemoryModel | null = new MemoryModel()) {
  const clock = new FakeClock(START);
  const db = new MemoryDb();
  const store = new MemoryAiUsageStore(db);
  return { gw: new MeteredAiGateway(model, aiConfig(over), store, new MemoryCache(clock), clock), model, store, clock };
}

describe('passerelle d’IA', () => {
  it('interrupteur et absence de modèle : refus « disabled », aucun appel, refus comptés', async () => {
    const off = gateway({ killSwitch: true });
    expect(await off.gw.complete(request())).toEqual({ ok: false, reason: 'disabled' });
    expect(off.model?.calls).toHaveLength(0);
    const none = gateway({}, null);
    expect(await none.gw.complete(request())).toEqual({ ok: false, reason: 'disabled' });
    const [row] = await off.store.list('2026-11-11', '2026-11-11');
    expect(row).toMatchObject({ calls: 0, declined: 1, costMicros: 0 });
  });

  it('budget par personne et par fonction, remis à zéro le lendemain', async () => {
    const { gw, model, clock } = gateway();
    expect((await gw.complete(request())).ok).toBe(true);
    expect((await gw.complete(request())).ok).toBe(true);
    expect(await gw.complete(request())).toEqual({ ok: false, reason: 'budget' });
    // Autre personne, autre fonction : budgets séparés.
    expect((await gw.complete(request({ userId: 'u2' }))).ok).toBe(true);
    expect((await gw.complete(request({ feature: 'habit_proof' }))).ok).toBe(true);
    expect(model?.calls).toHaveLength(4);
    clock.advanceDays(1);
    expect((await gw.complete(request())).ok).toBe(true);
  });

  it('plafond global du jour : plus aucun appel une fois atteint', async () => {
    // Chaque appel coûte quelques µ$ ; plafond à 1 µ$ : le premier passe, le suivant est refusé.
    const { gw, model } = gateway({ dailyCeilingMicros: 1, userBudgets: parseAiBudgets('chat_remark=100') });
    expect((await gw.complete(request())).ok).toBe(true);
    expect(await gw.complete(request({ userId: 'u9' }))).toEqual({ ok: false, reason: 'budget' });
    expect(model?.calls).toHaveLength(1);
  });

  it('compteur : appels, jetons, coût estimé ; une panne rend « error » et compte une erreur', async () => {
    const { gw, model, store } = gateway({ userBudgets: parseAiBudgets('chat_remark=10') });
    model?.respondWith(() => 'Une réplique.');
    expect(await gw.complete(request({ prompt: 'x'.repeat(400) }))).toEqual({ ok: true, text: 'Une réplique.' });
    model?.failWith(true);
    expect(await gw.complete(request())).toEqual({ ok: false, reason: 'error' });
    const [row] = await store.list('2026-11-11', '2026-11-11');
    // 400 caractères + consigne ≈ 102 jetons d'entrée, 4 de sortie ; Haiku 5.5 : 0,10 $ / 0,50 $ le million.
    expect(row).toMatchObject({ feature: 'chat_remark', tier: 'small', calls: 2, errors: 1, declined: 0, inputTokens: 102, outputTokens: 4 });
    expect(row?.costMicros).toBe(Math.ceil(102 * 0.1 + 4 * 0.5));
  });

  it('bornes : max_tokens plafonné par palier, modèle choisi par palier', async () => {
    const { gw, model } = gateway();
    await gw.complete(request({ maxTokens: 5000, tier: 'medium' }));
    expect(model?.calls[0]).toMatchObject({ model: 'claude-sonnet-5-5', maxTokens: 800 });
  });
});

// ── Adaptateurs réels contre des réponses enregistrées ─────────────────────

type Call = { url: string; init: RequestInit };
function fakeFetch(responses: { status: number; body: unknown }[]): { fetch: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const r = responses.shift() ?? { status: 500, body: {} };
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { fetch: f, calls };
}

describe('adaptateur Anthropic (HTTP simulé, forme de l’API Messages)', () => {
  it('en-têtes, consigne mise en cache, image en base64, lecture des jetons', async () => {
    const { fetch: f, calls } = fakeFetch([
      {
        status: 200,
        body: {
          id: 'msg_01',
          type: 'message',
          role: 'assistant',
          model: 'claude-haiku-5-5',
          content: [{ type: 'text', text: 'oui' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 420, output_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 600 },
        },
      },
    ]);
    const reply = await new AnthropicModel('sk-test', f).complete({ model: 'claude-haiku-5-5', system: 'consigne', prompt: 'question', image: { base64: 'AAAA', mediaType: 'image/jpeg' }, maxTokens: 20 });
    expect(reply).toEqual({ text: 'oui', usage: { input: 420, output: 2, cacheWrite: 0, cacheRead: 600 } });
    const call = calls[0];
    expect(call?.url).toBe(ANTHROPIC_URL);
    expect(call?.init.headers).toMatchObject({ 'x-api-key': 'sk-test', 'anthropic-version': '2023-06-01' });
    expect(JSON.parse(String(call?.init.body))).toEqual({
      model: 'claude-haiku-5-5',
      max_tokens: 20,
      system: [{ type: 'text', text: 'consigne', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } }, { type: 'text', text: 'question' }] }],
    });
  });

  it('erreur HTTP : exception (la passerelle la traduit en « error »)', async () => {
    const { fetch: f } = fakeFetch([{ status: 529, body: { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } } }]);
    await expect(new AnthropicModel('k', f).complete({ model: 'm', system: 's', prompt: 'p', maxTokens: 5 })).rejects.toThrow('overloaded_error');
  });
});

describe('adaptateur Expo push (HTTP simulé)', () => {
  const msg = (to: string) => ({ to, title: 't', body: 'b', data: { kind: 'waved' as const, url: 'blowy://rencontres' } });

  it('lots de 100, tickets dans l’ordre, jeton désinscrit repéré, une seule nouvelle tentative sur 429', async () => {
    const tickets = (n: number, offset: number) => Array.from({ length: n }, (_, i) => ({ status: 'ok', id: `t${offset + i}` }));
    const second = tickets(50, 100);
    second[3] = { status: 'error', message: '"x" is not a registered push notification recipient', details: { error: 'DeviceNotRegistered' } } as never;
    const { fetch: f, calls } = fakeFetch([
      { status: 200, body: { data: tickets(100, 0) } },
      { status: 429, body: { errors: [{ code: 'TOO_MANY_REQUESTS' }] } },
      { status: 200, body: { data: second } },
    ]);
    const pusher = new ExpoPusher('jeton-acces', f, async () => undefined);
    const out = await pusher.send(Array.from({ length: 150 }, (_, i) => msg(`ExponentPushToken[${i}]`)));
    expect(out).toHaveLength(150);
    expect(out[0]).toEqual({ status: 'ok', id: 't0' });
    expect(out[103]).toEqual({ status: 'error', invalidToken: true, message: 'DeviceNotRegistered' });
    expect(calls.map((c) => c.url)).toEqual([EXPO_SEND_URL, EXPO_SEND_URL, EXPO_SEND_URL]);
    expect(JSON.parse(String(calls[0]?.init.body))).toHaveLength(100);
    expect(JSON.parse(String(calls[2]?.init.body))).toHaveLength(50);
    expect(calls[0]?.init.headers).toMatchObject({ authorization: 'Bearer jeton-acces', 'content-type': 'application/json' });
  });

  it('reçus : DeviceNotRegistered marque le jeton invalide', async () => {
    const { fetch: f, calls } = fakeFetch([
      { status: 200, body: { data: { a: { status: 'ok' }, b: { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } } } } },
    ]);
    const r = await new ExpoPusher(null, f).receipts(['a', 'b', 'c']);
    expect(calls[0]?.url).toBe(EXPO_RECEIPTS_URL);
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ ids: ['a', 'b', 'c'] });
    expect(r.get('a')).toEqual({ ok: true, invalidToken: false });
    expect(r.get('b')).toEqual({ ok: false, invalidToken: true });
    expect(r.has('c')).toBe(false);
  });
});

// ── Monde complet (API en mémoire) ─────────────────────────────────────────

interface Person {
  id: string;
  api: ApiClient;
}

async function pair(world: TestWorld, names: [string, string]): Promise<{ a: Person; b: Person; linkId: string }> {
  const a = world.client();
  const b = world.client();
  const me = await a.api.me.onboard(onboardBody({ displayName: names[0] }));
  await b.api.me.onboard(onboardBody({ displayName: names[1], inviteCode: me.inviteCode, pet: { name: 'Gaston', species: 'gaston' } }));
  const [link] = await a.api.links.list();
  if (!link) throw new Error('lien manquant');
  return { a, b, linkId: link.id };
}

const petLines = (messages: readonly Message[]) => messages.filter((m) => m.author === 'my_pet' || m.author === 'other_pet');

async function allMessages(api: ApiClient, linkId: string): Promise<Message[]> {
  const out: Message[] = [];
  let before: string | undefined;
  for (;;) {
    const page = await api.links.messages(linkId, before);
    out.unshift(...page.messages);
    if (!page.nextBefore) return out;
    before = page.nextBefore;
  }
}

describe('minimoas dans le chat', () => {
  let world: TestWorld;
  let model: MemoryModel;
  let background: Background;

  beforeAll(async () => {
    world = await startWorld({ INTERNAL_TICK_SECRET: SECRET });
    model = world.app.get<MemoryModel>(AI_MODEL);
    background = world.app.get(Background);
  });
  afterAll(() => world.close());

  async function talk(a: Person, b: Person, linkId: string, n: number, text = (i: number) => `message ${i}`): Promise<void> {
    for (let i = 0; i < n; i++) await (i % 2 === 0 ? a : b).api.links.send(linkId, { body: text(i) });
    await background.settle();
  }

  it('brise-glace au début du lien, tiré des points communs ; accord pas encore demandé', async () => {
    const { a, linkId } = await pair(world, ['Alice', 'Bob']);
    const lines = petLines(await allMessages(a.api, linkId));
    expect(lines).toHaveLength(1);
    expect(lines[0]?.petRole).toBe('icebreaker');
    const settings = await a.api.minimoas.get(linkId);
    expect(settings).toMatchObject({ consent: { mine: null, reading: false }, muted: false, interventionsToday: 1, maxPerDay: 3 });
    expect(settings.consent.text).toBe(chatConfidentialityText('fr'));
    expect(settings.consent.text).toBe(
      'Personne chez Minimoa ne lit tes conversations, sauf un message signalé et les quelques messages autour, pour la modération. Si vous l’activez l’un et l’autre, une IA lit vos derniers messages pour que vos minimoas puissent y réagir. Cette IA est fournie par Anthropic (États-Unis), notre prestataire, qui reçoit ces messages pour nous. Tu peux retirer ton accord quand tu veux.',
    );
  });

  it('sans IA : la remarque au rythme est une question surprise, et deux réponses pareilles font un point commun', async () => {
    const { a, b, linkId } = await pair(world, ['Eva', 'Fred']);
    await talk(a, b, linkId, 12);
    const asked = petLines(await allMessages(a.api, linkId)).filter((m) => m.petRole === 'remark').at(-1);
    const found = surpriseOf(asked?.body ?? '');
    expect(found).not.toBeNull();
    if (!found) return;
    // Le lendemain (le plafond d'interventions du jour est atteint) : les deux répondent le premier choix.
    world.clock.advanceDays(1);
    await a.api.links.send(linkId, { body: `Je dirais ${found.question.a.words[0]} !` });
    await b.api.links.send(linkId, { body: `${found.question.a.words[0]}, clairement` });
    await background.settle();
    const verdict = petLines(await allMessages(a.api, linkId)).at(-1);
    expect(verdict?.body).toBe(found.lines.common(found.question.a.label, 1));
  });

  it('matrice d’accord : aucun, un seul → jamais de lecture ; les deux → une lecture par déclencheur, fenêtre anonymisée', async () => {
    const { a, b, linkId } = await pair(world, ['Chloé', 'Dan']);
    const before = model.calls.length;

    // Plus de remarques des minimoas (21 nov. 2026) : 12 messages → seulement des questions surprise, sans appel au modèle.
    await talk(a, b, linkId, 12);
    expect(model.calls.length).toBe(before);
    const interventions = (messages: readonly Message[]) => petLines(messages).filter((m) => m.petRole !== 'event');
    const shown = interventions(await allMessages(a.api, linkId));
    expect(shown[0]?.petRole).toBe('icebreaker');
    for (const m of shown.slice(1)) expect(surpriseOf(m.body ?? '')).not.toBeNull();

    // Les deux d'accord : le modèle ne lit plus pour écrire des remarques (seuls les garde-fous le font).
    await a.api.minimoas.update(linkId, { consent: true });
    await b.api.minimoas.update(linkId, { consent: true });
    expect((await b.api.minimoas.get(linkId)).consent).toMatchObject({ mine: true, reading: true });
    world.clock.advanceDays(1);
    await talk(a, b, linkId, 12, (i) => `on parle du resto ${i}, Chloé`);
    expect(model.calls.length).toBe(before);
  });

  it('au plus 3 interventions par jour et par lien, quel que soit le nombre de messages', async () => {
    const { a, b, linkId } = await pair(world, ['Emma', 'Farid']);
    world.clock.advanceDays(1);
    const startCount = petLines(await allMessages(a.api, linkId)).length;
    for (let round = 0; round < 3; round++) {
      await talk(a, b, linkId, 20);
      world.clock.advanceMinutes(2);
    }
    const added = petLines(await allMessages(a.api, linkId)).slice(startCount).filter((m) => m.petRole !== 'event');
    expect(added).toHaveLength(3);
    expect((await a.api.minimoas.get(linkId)).interventionsToday).toBe(3);
  });

  it('couper les minimoas d’un lien : plus aucune intervention ; liste « Moi » paginée', async () => {
    const { a, b, linkId } = await pair(world, ['Gaby', 'Hugo']);
    await b.api.minimoas.update(linkId, { muted: true });
    world.clock.advanceDays(1);
    // Coupés : plus aucune intervention ; les annonces du lien (niveau, vies) restent.
    const interventions = async () => petLines(await allMessages(a.api, linkId)).filter((m) => m.petRole !== 'event');
    const count = (await interventions()).length;
    await talk(a, b, linkId, 12);
    expect(await interventions()).toHaveLength(count);
    const mine = await b.api.minimoas.mine();
    expect(mine.items.find((i) => i.linkId === linkId)).toMatchObject({ muted: true });
    expect(mine.text).toBe(chatConfidentialityText('fr'));
  });

  it('garde-fou : heuristique locale puis modèle ; visible par la seule personne concernée ; repli sur la règle en cas de panne', async () => {
    const { a, b, linkId } = await pair(world, ['Inès', 'Jules']);
    await a.api.minimoas.update(linkId, { consent: true });
    await b.api.minimoas.update(linkId, { consent: true });
    world.clock.advanceDays(1);
    const before = model.calls.length;
    await a.api.links.send(linkId, { body: 'on se voit samedi ?' });
    await a.api.links.send(linkId, { body: 'TU ME SAOULES VRAIMENT !!!' });
    await a.api.links.send(linkId, { body: 't’es qu’un connard' });
    await background.settle();
    expect(model.calls.length).toBe(before + 1);
    expect(model.calls.at(-1)?.prompt).toMatch(/Rôle\s: garde-fou/);
    const forA = petLines(await allMessages(a.api, linkId)).filter((m) => m.petRole === 'guard');
    const forB = petLines(await allMessages(b.api, linkId)).filter((m) => m.petRole === 'guard');
    expect(forA).toHaveLength(1);
    expect(forA[0]?.author).toBe('my_pet');
    expect(forB).toHaveLength(0);

    // Le lendemain, modèle en panne : la ligne de règle remplace la réponse.
    world.clock.advanceDays(1);
    model.failWith(true);
    try {
      await b.api.links.send(linkId, { body: 'J’EN AI MARRE DE TOI !!!' });
      await b.api.links.send(linkId, { body: 'débile' });
      await background.settle();
    } finally {
      model.failWith(false);
    }
    const guardsB = petLines(await allMessages(b.api, linkId)).filter((m) => m.petRole === 'guard');
    expect(guardsB).toHaveLength(1);
    expect(guardsB[0]?.body).toBeTruthy();
  });

  it('relance après 72 h de silence par le minuteur (règle sans accord), une seule par silence', async () => {
    const { a, linkId } = await pair(world, ['Kim', 'Léo']);
    world.clock.advanceHours(73);
    const tick = () => fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': SECRET } }).then((r) => r.json() as Promise<{ ran: boolean }>);
    expect((await tick()).ran).toBe(true);
    const nudges = () => allMessages(a.api, linkId).then((m) => petLines(m).filter((x) => x.petRole === 'nudge'));
    expect(await nudges()).toHaveLength(1);
    expect((await nudges())[0]?.body).toMatch(/3 jours/);
    world.clock.advanceMinutes(5);
    await tick();
    expect(await nudges()).toHaveLength(1);
  });

  it('santé du lien pour le bilan de la semaine (sans lire le contenu)', async () => {
    const { a, b, linkId } = await pair(world, ['Mia', 'Noé']);
    const minimoas = world.app.get((await import('../src/modules/links/minimoas/chat-minimoas')).ChatMinimoas);
    expect(await minimoas.linkHealth(a.id)).toEqual([expect.objectContaining({ linkId, otherName: 'Noé', key: 'new' })]);
    for (let day = 0; day < 8; day++) {
      world.clock.advanceDays(1);
      await talk(a, b, linkId, 2);
    }
    // Huit jours où les deux écrivent : « vous vous écrivez presque tous les jours ».
    const [health] = await minimoas.linkHealth(b.id);
    expect(health).toMatchObject({ otherName: 'Mia', key: 'together' });
    expect(health?.line).toBe('Avec Mia : vous vous écrivez presque tous les jours. Ça se voit.');
  });
});

describe('notifications', () => {
  let world: TestWorld;
  let pusher: MemoryPusher;
  let notifier: Notifier;
  let db: MemoryDb;

  beforeAll(async () => {
    world = await startWorld({ INTERNAL_TICK_SECRET: SECRET });
    pusher = world.app.get<MemoryPusher>(PUSHER);
    notifier = world.app.get<Notifier>(NOTIFIER);
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterAll(() => world.close());

  const sentTo = (token: string) => pusher.outbox.filter((m) => m.to === token);
  const tick = () => fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': SECRET } });

  it('message : push à l’autre, sans contenu, lien profond ; délai de 5 min par lien ; réglage coupé', async () => {
    const { a, b, linkId } = await pair(world, ['Alice', 'Bob']);
    const token = 'ExponentPushToken[bob-1]';
    const settings = await b.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
    expect(settings).toMatchObject({ hasDevice: true, morningHour: 9, timeZone: 'Europe/Paris', dailyCap: 3, quietHours: { start: 22, end: 8 } });
    expect(settings.kinds.message).toBe(true);
    expect(settings.labels.message).toBe('Messages');

    await a.api.links.send(linkId, { body: 'mon secret' });
    const [push] = sentTo(token);
    expect(push).toMatchObject({ title: 'Alice', body: 'Alice t’a écrit.', data: { kind: 'message', url: `blowy://link/${linkId}`, linkId } });
    expect(JSON.stringify(push)).not.toContain('mon secret');

    await a.api.links.send(linkId, { body: 'encore' });
    expect(sentTo(token)).toHaveLength(1);
    world.clock.advanceMinutes(6);
    await a.api.links.send(linkId, { body: 'et encore' });
    expect(sentTo(token)).toHaveLength(2);

    await b.api.notifications.updateSettings({ kinds: { message: false } });
    world.clock.advanceMinutes(6);
    await a.api.links.send(linkId, { body: 'coupé' });
    expect(sentTo(token)).toHaveLength(2);
    expect((await b.api.notifications.settings()).kinds.message).toBe(false);
  });

  it('plafond de 3 par jour hors messages ; les messages n’y comptent pas', async () => {
    const c = world.client();
    await c.api.me.onboard(onboardBody({ displayName: 'Carla' }));
    const token = 'ExponentPushToken[carla]';
    await c.api.notifications.registerDevice({ token, platform: 'android', timeZone: 'Europe/Paris' });
    await notifier.notify(c.id, 'waved', { name: 'P0', minimoa: 'Pia' });
    await notifier.notify(c.id, 'words_received');
    await notifier.notify(c.id, 'group_invite', { name: 'P1', group: 'Run', groupId: '00000000-0000-4000-8000-0000000000a1' });
    await notifier.notify(c.id, 'group_invite', { name: 'P2', group: 'Yoga', groupId: '00000000-0000-4000-8000-0000000000a2' });
    expect(sentTo(token)).toHaveLength(3);
    await notifier.notify(c.id, 'message', { name: 'Zoé', linkId: '00000000-0000-4000-8000-000000000001' });
    expect(sentTo(token)).toHaveLength(4);
    expect(sentTo(token)[0]).toMatchObject({ title: 'P0 te fait signe', data: { kind: 'waved', url: 'blowy://rencontres' } });
  });

  it('heures calmes dans le fuseau de la personne : report au matin (regroupé) ou abandon', async () => {
    const d = world.client();
    await d.api.me.onboard(onboardBody({ displayName: 'Dora' }));
    const token = 'ExponentPushToken[dora]';
    // New York : à 10 h UTC il est 5 h du matin → heures calmes.
    await d.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'America/New_York' });
    await notifier.notify(d.id, 'message', { name: 'Zoé', linkId: '00000000-0000-4000-8000-000000000002' });
    await notifier.notify(d.id, 'waved', { name: 'Zoé', minimoa: 'Pia' });
    await notifier.notify(d.id, 'waved', { name: 'Zoé', minimoa: 'Pia' });
    await notifier.notify(d.id, 'needs_out', { minimoa: 'Pia' });
    expect(sentTo(token)).toHaveLength(0);
    // Un report pour les messages de la nuit, un pour les signes ; le rappel est abandonné.
    expect(db.notificationLog.filter((l) => l.userId === d.id && l.status === 'deferred')).toHaveLength(2);
    await tick();
    expect(sentTo(token)).toHaveLength(0);
    world.clock.advanceHours(3); // 8 h à New York
    await tick();
    // Paquet du matin : un seul push, le message en tête, les signes comptés.
    expect(sentTo(token)).toHaveLength(1);
    expect(sentTo(token)[0]).toMatchObject({ title: 'Zoé', body: 'Zoé t’a écrit. Et 1 autre nouvelle t’attend dans l’app.', data: { kind: 'message' } });
    expect(db.notificationLog.filter((l) => l.userId === d.id && l.status === 'deferred')).toHaveLength(0);
    world.clock.advanceMinutes(2);
    await tick();
    expect(sentTo(token)).toHaveLength(1);
  });

  it('langue du profil : chaque notification dans la langue de la personne', async () => {
    expect(notificationText('fr', 'your_turn', { name: 'Léa', count: '4', more: '0' })).toEqual({ title: 'Série avec Léa', body: '4 jours d’affilée. À toi d’écrire avant minuit.' });
    expect(notificationText('fr', 'your_turn', { name: 'Léa', count: '0' })).toEqual({ title: 'Série avec Léa', body: 'Léa t’a écrit aujourd’hui. À toi avant minuit.' });
    expect(notificationText('fr', 'your_turn', { name: 'Léa', count: '4', more: '2' }).body).toBe('À toi d’écrire avant minuit. Et dans 2 autres liens.');
    expect(notificationText('en', 'your_turn', { name: 'Léa', count: '1' })).toEqual({ title: 'Streak with Léa', body: '1 day in a row. Your turn to write before midnight.' });
    expect(notificationText('nl', 'your_turn', { name: 'Léa', count: '0' })).toEqual({ title: 'Reeks met Léa', body: 'Léa schreef je vandaag. Jouw beurt, voor middernacht.' });
    expect(notificationText('nl', 'your_turn', { name: 'Léa', count: '1' }).body).toBe('1 dag op rij. Jouw beurt om te schrijven voor middernacht.');
    const e = world.client();
    await e.api.me.onboard(onboardBody({ displayName: 'Eva', locale: 'pt' }));
    await e.api.notifications.registerDevice({ token: 'ExponentPushToken[eva]', platform: 'ios', timeZone: 'Europe/Lisbon' });
    await notifier.notify(e.id, 'words_received');
    expect(sentTo('ExponentPushToken[eva]')[0]).toMatchObject({ title: '3 palavras para você', data: { url: 'blowy://mots' } });
    expect(sentTo('ExponentPushToken[eva]')[0]?.title).not.toBe(notificationText('fr', 'words_received').title);
  });

  it('jetons invalides : refus immédiat ou au reçu (15 min plus tard) → appareil désactivé', async () => {
    const f = world.client();
    await f.api.me.onboard(onboardBody({ displayName: 'Fanny' }));
    await f.api.notifications.registerDevice({ token: 'ExponentPushToken[invalid-1]', platform: 'ios', timeZone: 'Europe/Paris' });
    await notifier.notify(f.id, 'words_received');
    expect((await f.api.notifications.settings()).hasDevice).toBe(false);

    await f.api.notifications.registerDevice({ token: 'ExponentPushToken[late-invalid-2]', platform: 'ios', timeZone: 'Europe/Paris' });
    world.clock.advanceMinutes(61); // hors de la fenêtre de regroupement
    await notifier.notify(f.id, 'words_received');
    expect(sentTo('ExponentPushToken[late-invalid-2]')).toHaveLength(1);
    expect((await f.api.notifications.settings()).hasDevice).toBe(true);
    world.clock.advanceMinutes(16);
    await tick();
    expect((await f.api.notifications.settings()).hasDevice).toBe(false);
  });

  it('défi du jour à l’heure choisie, une fois par jour ; données compactes pour le widget', async () => {
    const g = world.client();
    await g.api.me.onboard(onboardBody({ displayName: 'Gil' }));
    // Le jour de la création du minimoa, pas de rappel du défi (la première session sert aux gens).
    expect(await world.app.get<DailyPushSource>(DAILY_PUSH_SOURCE, { strict: false }).morning(g.id, world.clock.now())).toBeNull();
    // Minimoa créé la veille : le défi est proposé et rappelé normalement.
    for (const pet of db.pets.values()) {
      if (pet.ownerId === g.id) db.pets.set(pet.id, { ...pet, createdAt: new Date(Date.parse(pet.createdAt) - 86_400_000).toISOString() });
    }
    const today = await g.api.rituals.today(); // ouverture de l'app : personne active pour les rituels
    const token = 'ExponentPushToken[gil]';
    await g.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
    await g.api.notifications.updateSettings({ morningHour: 10 });
    const morning = () => sentTo(token).filter((m) => m.data.kind === 'daily_challenge');
    // Avancer jusqu'au prochain 10 h à Paris.
    const next = db.notificationSettings.get(g.id)?.nextMorningAt;
    expect(next).toBeTruthy();
    while (world.clock.now().toISOString() < (next ?? '')) world.clock.advanceMinutes(30);
    await tick();
    expect(morning()).toHaveLength(1);
    expect(morning()[0]?.data).toMatchObject({ url: 'blowy://pet/defi', state: { challengePending: true } });
    // Seul chemin d'envoi : le minuteur de la plateforme, avec le défi choisi par les rituels.
    expect(morning()[0]?.body).toContain('Nino');
    expect(today.challenge.status).toBe('offered');
    world.clock.advanceMinutes(3);
    await tick();
    expect(morning()).toHaveLength(1);
    world.clock.advanceDays(1);
    await tick();
    expect(morning()).toHaveLength(2);
  });

  it('retirer l’appareil : plus rien ne part', async () => {
    const h = world.client();
    await h.api.me.onboard(onboardBody({ displayName: 'Hana' }));
    await h.api.notifications.registerDevice({ token: 'ExponentPushToken[hana]', platform: 'ios', timeZone: 'Europe/Paris' });
    await h.api.notifications.removeDevice('ExponentPushToken[hana]');
    await notifier.notify(h.id, 'words_received');
    expect(sentTo('ExponentPushToken[hana]')).toHaveLength(0);
  });
});

describe('minuteur', () => {
  it('secret obligatoire, créneau d’une minute traité une seule fois ; sans secret configuré, la route n’existe pas', async () => {
    const world = await startWorld({ INTERNAL_TICK_SECRET: SECRET });
    try {
      const post = (headers: Record<string, string>) => fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers });
      expect((await post({})).status).toBe(401);
      expect((await post({ 'x-tick-secret': 'mauvais' })).status).toBe(401);
      const first = await post({ authorization: `Bearer ${SECRET}` });
      expect(first.status).toBe(200);
      const body = (await first.json()) as { ran: boolean; jobs: { name: string; skipped: boolean; error: string | null }[] };
      expect(body.ran).toBe(true);
      expect(body.jobs.map((j) => j.name)).toContain('notifications');
      expect(body.jobs.every((j) => j.error === null)).toBe(true);
      const again = (await (await post({ 'x-tick-secret': SECRET })).json()) as { ran: boolean; jobs: { skipped: boolean }[] };
      expect(again.ran).toBe(false);
      expect(again.jobs.every((j) => j.skipped)).toBe(true);
      world.clock.advanceMinutes(1);
      expect(((await (await post({ 'x-tick-secret': SECRET })).json()) as { ran: boolean }).ran).toBe(true);
    } finally {
      await world.close();
    }
    const closed = await startWorld();
    try {
      expect((await fetch(`${closed.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': SECRET } })).status).toBe(404);
    } finally {
      await closed.close();
    }
  });

  it('usage de l’IA lisible pour l’administration', async () => {
    const world = await startWorld({ AI_DAILY_CEILING_USD: '2' });
    try {
      const gw = world.app.get<AiGateway>(AI_GATEWAY);
      await gw.complete(request({ userId: '00000000-0000-4000-8000-0000000000aa' }));
      const usage = await world.app.get(AiUsage).summary(7);
      expect(usage).toMatchObject({ provider: 'memory', killSwitch: false, dailyCeilingUsd: 2, eurPerUsd: 0.9 });
      expect(usage.rows[0]).toMatchObject({ feature: 'chat_remark', tier: 'small', calls: 1 });
      expect(usage.todaySpendUsd).toBeGreaterThan(0);
    } finally {
      await world.close();
    }
  });
});
