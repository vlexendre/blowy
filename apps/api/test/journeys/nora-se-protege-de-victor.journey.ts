/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 4 — Sécurité. Victor devient insistant avec Nora ; elle signale puis bloque. Victor
 * ne doit plus rien voir d'elle (profil, chats, WS, propositions). Paul, un inconnu, essaie
 * d'accéder aux objets des autres par identifiant (IDOR). Clara signale un profil qu'elle pense
 * mineur ; un vrai mineur essaie de s'inscrire.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { attempt, cast, Person } from './support/actor.js';
import { look, synthImage, upload } from './support/media.js';
import { Observers } from './support/observers.js';
import { story } from './support/story.js';
import { HOUR, startWorld, type World } from './support/world.js';

let w: World;
let nora: Person;
let victor: Person;
let paul: Person;
let clara: Person;
let relId = '';
let convId = '';
let pendingId = '';
let noraPhoto = '';
let victorCursor: string | null = null;
const S = story('securite', 'Sécurité : harcèlement → signalement → blocage ; IDOR ; mineur');

beforeAll(async () => {
  w = await startWorld('J_SECURITE');
});
afterAll(async () => w?.close());

async function match(a: Person, b: Person) {
  const feed = await a.client.matching.requestOnboardingBatch();
  const p = feed.items.find((i) => i.otherPet.id === b.petId);
  if (!p) throw new Error(`pas de proposition ${a.name}→${b.name}`);
  await a.client.matching.accept(p.id);
  const r = await b.client.matching.accept(p.id);
  return r.relationshipId!;
}

describe('Sécurité', () => {
  S.step('Nora et Victor se rencontrent et discutent ; tous deux suivent la conversation en direct', async () => {
    [nora, victor] = await cast(w, [
      { key: 'nora', displayName: 'Nora', gender: 'WOMAN', seeking: ['MAN'], species: 'NINO' },
      { key: 'victor', displayName: 'Victor', gender: 'MAN', seeking: ['WOMAN'], species: 'GASTON' },
    ]);
    relId = await match(nora, victor);
    convId = (await nora.client.relationships.get(relId)).conversationId!;
    for (const p of [nora, victor]) {
      await p.device(`${p.spec.key}-phone`);
      expect(await p.phone.join(`relationship:${relId}`)).toBe(true);
      expect(await p.phone.join(`conversation:${convId}`)).toBe(true);
    }
    await victor.say(convId, 'Salut Nora', 'v-0001');
    await w.drain();
    await nora.say(convId, 'Salut !', 'n-0001');
    await w.drain();
    noraPhoto = (await upload(nora, { purpose: 'PROFILE_PHOTO', bytes: await synthImage() })).id;
  });

  S.step('Victor insiste (messages en rafale) ; Nora signale le harcèlement — Victor n’en sait rien', async () => {
    for (let i = 0; i < 4; i++) await victor.say(convId, `Pourquoi tu réponds pas ?? ${i}`, `v-spam-${i}`);
    await w.drain();
    const r = await nora.call('POST', '/v1/reports', { target: { relationshipId: relId }, category: 'HARASSMENT', note: 'il insiste' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await w.drain();
    expect((await victor.client.relationships.get(relId)).status).toBe('ACTIVE');
    expect(JSON.stringify(victor.phone.events)).not.toMatch(/report|HARASSMENT|il insiste/);
    const caseRow = await w.db.moderationCase.findFirst({ where: { subjectUserId: victor.userId } });
    expect(caseRow).toBeTruthy();
  });

  S.step('Victor envoie encore un message (en modération) juste avant que Nora bloque', async () => {
    const m = await victor.say(convId, 'Réponds-moi maintenant', 'v-late-1');
    pendingId = m.data.id;
    expect(m.data.status).toBe('PENDING_MODERATION');
    const s = await victor.phone.emit<any>('resync', { room: `conversation:${convId}`, sinceCursor: null });
    victorCursor = s !== 'TIMEOUT' && s.events?.length ? s.events.at(-1).projectionCursor : null;
  });

  S.step('Nora bloque Victor : relation terminée sans message de départ, sa fiabilité intacte', async () => {
    const r = await nora.call('POST', '/v1/blocks', { target: { relationshipId: relId } });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await w.drain();
    expect((await nora.client.me.get()).reliability).toBe(100);
    const blocks = await nora.call('GET', '/v1/blocks');
    expect(blocks.data.items).toHaveLength(1);
    const sys = await w.db.message.count({ where: { conversationId: convId, kind: 'SYSTEM', systemTemplate: { startsWith: 'system.leave' } } });
    expect(sys).toBe(0);
  });

  S.step('Le message en attente de Victor n’arrive jamais chez Nora (résultat de modération tardif ignoré)', async () => {
    await w.drain();
    const m = await w.db.message.findUnique({ where: { id: pendingId } });
    expect(m?.status).not.toBe('PUBLISHED');
    const obs = new Observers([nora, victor]);
    expect(obs.whoSaw('Réponds-moi maintenant')).not.toContain('Nora');
  });

  S.step('Victor ne voit plus rien : relation, conversation, pet, photo de Nora → introuvables', async () => {
    const list = await victor.client.relationships.list();
    expect(list.items.some((x) => x.id === relId)).toBe(false);
    const ended = await victor.client.relationships.list(true);
    const v = ended.items.find((x) => x.id === relId);
    if (v) expect(JSON.stringify(v)).not.toMatch(/BLOCK|REPORT/);
    expect((await victor.call('GET', `/v1/conversations/${convId}/messages`)).status).toBe(404);
    expect((await victor.say(convId, 'allo ?', 'v-after-block')).ok).toBe(false);
    expect((await victor.call('GET', `/v1/pets/${nora.petId}`)).status).toBe(404);
    expect((await look(victor, noraPhoto, 'thumbnail', relId)).status).toBe(404);
    expect((await victor.call('GET', `/v1/media/${noraPhoto}`)).status).toBe(404);
    // Victor peut encore signaler (la sécurité ne dépend pas du sens du blocage) : on observe seulement.
    const back = await victor.call('POST', '/v1/reports', { target: { relationshipId: relId }, category: 'OTHER' });
    S.note(`Après blocage, Victor qui tente de signaler Nora via l’ancienne relation reçoit ${back.status}.`);
  });

  S.step('WebSocket : la socket de Victor est retirée des rooms ; rejoindre ou resynchroniser est refusé', async () => {
    expect(victor.phone.revoked).toEqual(expect.arrayContaining([`conversation:${convId}`]));
    expect(await victor.phone.emit('join', { room: `conversation:${convId}` })).toEqual({ ok: false, code: 'NOT_FOUND' });
    expect(await victor.phone.emit('join', { room: `relationship:${relId}` })).toEqual({ ok: false, code: 'NOT_FOUND' });
    const rs = await victor.phone.emit<any>('resync', { room: `conversation:${convId}`, sinceCursor: victorCursor });
    expect(rs.ok).toBe(false);
    // Un nouveau téléphone de Victor ne récupère rien non plus.
    const d2 = await victor.device('victor-tablet');
    expect(await d2.join(`conversation:${convId}`)).toBe(false);
    d2.disconnect();
  });

  S.step('Nora continue sa vie : nouvelle proposition possible, Victor ne lui est plus jamais proposé (ni elle à lui)', async () => {
    const f1 = await victor.client.matching.requestOnboardingBatch();
    expect(JSON.stringify(f1)).not.toContain(nora.petId);
    const f2 = await nora.client.matching.requestOnboardingBatch();
    expect(JSON.stringify(f2)).not.toContain(victor.petId);
  });
  S.absent('Carte Blowy+ : Victor ne voit plus Nora sur la carte', 'aucune route de carte (§11) — rien à vérifier côté API');

  S.step('IDOR : Paul (inconnu) tente d’atteindre la relation, la conversation, le pet, la photo et les commandes de Nora', async () => {
    [paul, clara] = await cast(w, [
      { key: 'paul', displayName: 'Paul', gender: 'MAN', seeking: ['WOMAN'] },
      { key: 'clara', displayName: 'Clara', gender: 'WOMAN', seeking: ['MAN'] },
    ]);
    const tries = await Promise.all([
      paul.call('GET', `/v1/relationships/${relId}`),
      paul.call('GET', `/v1/conversations/${convId}/messages`),
      paul.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'paul-idor-01', body: 'coucou' }),
      paul.call('POST', `/v1/conversations/${convId}/read`, { seq: 1 }),
      paul.call('GET', `/v1/pets/${nora.petId}`),
      paul.call('GET', `/v1/media/${noraPhoto}`),
      paul.call('POST', `/v1/media/${noraPhoto}/access-tokens`, { variant: 'thumbnail', relationshipId: relId }),
      paul.call('POST', `/v1/media/${noraPhoto}/share`, { relationshipId: relId, shared: true }),
      paul.call('POST', `/v1/relationships/${relId}/leave`, { reason: 'CLEAN_LEAVE' }),
      paul.call('POST', '/v1/blocks', { target: { relationshipId: relId } }),
      paul.call('POST', '/v1/reports', { target: { petId: nora.petId }, category: 'OTHER' }),
      paul.call('GET', `/v1/conversations/${convId}/signal`),
    ]);
    const leaks = tries.map((t, i) => [i, t.status] as const).filter(([, s]) => s !== 404);
    expect(leaks, `réponses non-404 : ${JSON.stringify(leaks)}`).toEqual([]);
    // V5 (§7.7) : gestes, déplacements, révélation photo et vote de branche V4 retirés — 410 identique, rien sur l'objet.
    const retired = await Promise.all([
      paul.call('POST', `/v1/pets/${nora.petId}/actions`, { action: 'FEED' }),
      paul.call('POST', `/v1/pets/${nora.petId}/move`, { destination: 'HOME' }),
      paul.call('GET', `/v1/relationships/${relId}/photo-reveal?scope=PHOTO_REVEAL`),
      paul.call('POST', `/v1/relationships/${relId}/branch/ballot`, { choice: 'PLUS' }),
    ]);
    expect(retired.map((r) => `${r.status} ${r.data?.detailsSafe?.reason}`)).toEqual(Array(4).fill('410 RETIRED_IN_V5'));
    expect((await look(paul, noraPhoto, 'thumbnail', relId)).status).toBe(404);
    const ws = await paul.device('paul-phone');
    expect(await ws.join(`conversation:${convId}`)).toBe(false);
    expect(await ws.join(`user:${nora.userId}`)).toBe(false);
  });

  S.step('IDOR : un identifiant de proposition d’autrui ne peut pas être accepté', async () => {
    const f = await nora.client.matching.feed();
    const pid = f.items[0]?.id;
    if (!pid) return;
    const r = await attempt(() => paul.client.matching.accept(pid));
    if (r.ok) S.note('Paul a pu « accepter » une proposition qui ne le concerne pas.');
    expect(r.status).toBe(404);
  });

  S.step('Mineur : un compte de 17 ans est refusé à l’inscription (âge calculé serveur)', async () => {
    const teen = new Person(w, { key: 'teen', displayName: 'Ado', gender: 'MAN', seeking: ['WOMAN'] });
    await teen.signIn();
    const now = w.clock.now();
    const bd = `${now.getUTCFullYear() - 17}-01-01`;
    const r = await attempt(() => teen.client.me.update({ displayName: 'Ado', gender: 'MAN', birthDate: bd, zoneCode: w.zone, timezone: 'Europe/Paris' } as any));
    expect(r.status).toBe(403);
    expect(r.code).toBe('AGE_RESTRICTED');
    const done = await attempt(() => teen.client.me.completeOnboarding());
    expect(done.ok).toBe(false);
  });

  S.step('Mineur signalé : Clara voit Paul dans ses propositions et le signale « MINOR » → dossier prioritaire, Paul sort du matching en attendant', async () => {
    const f = await clara.client.matching.requestOnboardingBatch();
    const p = f.items.find((i) => i.otherPet.id === paul.petId);
    S.need(p, 'Paul proposé à Clara');
    const r = await clara.call('POST', '/v1/reports', { target: { petId: paul.petId }, category: 'MINOR', note: 'il dit avoir 16 ans' });
    if (!r.ok) S.note(`Clara ne peut PAS signaler un profil qui lui est proposé (pet vu dans la proposition, pas encore de relation) : ${r.status} ${r.code}. Le seul moyen serait d’accepter le match d’abord — signaler un mineur exige donc de « matcher » avec lui.`);
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await w.drain();
    const c = await w.db.moderationCase.findFirst({ where: { subjectUserId: paul.userId, reasonCode: 'REPORT_MINOR' } });
    expect(c?.restricted).toBe(true);
    expect(c?.priority).toBeLessThanOrEqual(1);
    // Paul ne doit plus être proposé tant que le dossier n'est pas traité.
    const nadia = new Person(w, { key: 'nadia', displayName: 'Nadia', gender: 'WOMAN', seeking: ['MAN'] });
    await nadia.onboard();
    const fn = await nadia.client.matching.requestOnboardingBatch();
    const stillProposed = fn.items.some((i) => i.otherPet.id === paul.petId);
    if (stillProposed) S.note('Un profil signalé « mineur » reste proposé à de nouvelles personnes tant qu’un modérateur n’a pas agi (aucune restriction conservatoire automatique).');
    expect(stillProposed).toBe(false);
    const me = await paul.client.me.get();
    expect(JSON.stringify(me)).not.toMatch(/clara|MINOR|report/i);
  });

  S.step('Paul ne peut pas « rajeunir/vieillir » après l’onboarding (date de naissance verrouillée)', async () => {
    const r = await attempt(() => paul.client.me.update({ birthDate: '1990-01-01' } as any));
    expect(r.status).toBe(412);
    const reason = r.code === 'BIRTHDATE_LOCKED' ? r.code : (r.data as any)?.detailsSafe?.reason;
    if (r.code !== 'BIRTHDATE_LOCKED') S.note(`Date de naissance verrouillée : code ${r.code} / detailsSafe ${JSON.stringify((r.data as any)?.detailsSafe)} au lieu du code documenté BIRTHDATE_LOCKED (docs/api/commands.md).`);
    expect(reason).toBe('BIRTHDATE_LOCKED');
  });

  S.step('Une heure plus tard, Victor recrée un compte avec la même clé ? La session révoquée ne revient pas, le blocage tient', async () => {
    await w.advance(HOUR);
    const again = new Person(w, { key: 'victor', displayName: 'Victor', gender: 'MAN', seeking: ['WOMAN'] });
    await again.signIn('victor-new-phone');
    expect(again.userId).toBe(victor.userId); // même identité locale → même compte, blocage conservé
    expect((await again.call('GET', `/v1/conversations/${convId}/messages`)).status).toBe(404);
  });
});
