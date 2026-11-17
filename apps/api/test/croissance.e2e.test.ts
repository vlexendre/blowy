import { randomUUID } from 'node:crypto';
import { type ApiClient, createAdminClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, errorCode, onboardBody, startWorld } from './helpers';

type P = { id: string; api: ApiClient };

/** Croissance (docs/VIRALITE.md) : lien de groupe, « 3 mots », codes et parrainage, entonnoir. En mémoire. */
describe('croissance', () => {
  let w: TestWorld;
  let db: MemoryDb;
  let pusher: MemoryPusher;
  const admin = () => createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:ops@minimoa.app` });
  const person = async (name: string, extra: Parameters<typeof onboardBody>[0] = {}): Promise<P> => {
    const p = w.client();
    await p.api.me.onboard(onboardBody({ displayName: name, ...extra }));
    return p;
  };

  beforeAll(async () => {
    w = await startWorld({ ADMIN_EMAILS: 'ops@minimoa.app' });
    db = w.app.get<MemoryDb>(MEMORY_DB);
    pusher = w.app.get<MemoryPusher>(PUSHER);
  });
  afterAll(() => w.close());

  describe('lien d’invitation de groupe', () => {
    let alix: P;
    let bao: P;
    let groupId = '';
    let code = '';

    it('un groupe se crée sans invitation ; chaque membre obtient le même lien, seul le créateur le change', async () => {
      alix = await person('Alix', { habits: [{ habitId: 'marcher' }] });
      const g = await alix.api.groups.create({ name: 'Marche du matin', kind: 'habit', habitId: 'marcher', memberIds: [] });
      groupId = g.id;
      expect(g.status).toBe('forming');
      const link = await alix.api.groups.link(groupId);
      expect(link.canReset).toBe(true);
      expect(link.code).toMatch(/^[A-Z0-9]{8}$/);
      expect((await alix.api.groups.link(groupId)).code).toBe(link.code);
      code = link.code;
      // Quelqu'un qui n'est pas membre n'obtient rien.
      const outsider = await person('Oscar');
      expect(await errorCode(outsider.api.groups.link(groupId))).toBe('forbidden');
    });

    it('la page publique montre nom, habitude, jours et nombre de membres, jamais de prénom', async () => {
      const page = await w.anonymous.groups.preview(code);
      expect(page).toMatchObject({ name: 'Marche du matin', kind: 'habit', memberCount: 1, missing: 2, full: false, daysKept: 0 });
      expect(page.habitLabel).toBeTruthy();
      expect(page.species).toHaveLength(1);
      expect(JSON.stringify(page)).not.toContain('Alix');
      expect(await errorCode(w.anonymous.groups.preview('ZZZZZZZZ'))).toBe('not_found');
    });

    it('rejoindre par le lien : l’habitude s’ajoute, les membres sont prévenus, la série démarre à 3', async () => {
      await alix.api.notifications.registerDevice({ token: 'ExponentPushToken[alix]', platform: 'ios', timeZone: 'Europe/Paris' });
      bao = await person('Bao');
      const joined = await bao.api.groups.join(code.toLowerCase());
      expect(joined.memberCount).toBe(2);
      expect((await bao.api.rituals.habits()).habits.map((h) => h.habitId)).toContain('marcher');
      const push = pusher.outbox.find((m) => m.to === 'ExponentPushToken[alix]');
      expect(push?.title).toContain('Bao');
      expect(push?.data).toMatchObject({ kind: 'group_joined', url: `blowy://groupe/${groupId}` });
      // Rejoindre deux fois ne change rien.
      expect((await bao.api.groups.join(code)).memberCount).toBe(2);
      const cyd = await person('Cyd');
      expect((await cyd.api.groups.join(code)).status).toBe('active');
      const msgs = await alix.api.groups.messages(groupId);
      expect(msgs.messages.map((m) => m.body).at(-1)).toBe('Vous êtes 3. Le groupe démarre.');
    });

    it('bloqué avec un membre ou groupe plein : refusé ; un nouveau code invalide l’ancien', async () => {
      const dani = await person('Dani');
      const daniLink = (await dani.api.me.get()).inviteCode;
      await alix.api.invites.accept(daniLink);
      await alix.api.safety.block(dani.id);
      expect(await errorCode(dani.api.groups.join(code))).toBe('not_found');
      // Seul le créateur change le lien.
      expect(await errorCode(bao.api.groups.resetLink(groupId))).toBe('forbidden');
      const fresh = await alix.api.groups.resetLink(groupId);
      expect(fresh.code).not.toBe(code);
      expect(await errorCode(w.anonymous.groups.preview(code))).toBe('not_found');
      code = fresh.code;
      // Huit membres au plus.
      for (const n of ['E', 'F', 'G', 'H', 'I']) await (await person(`P${n}`)).api.groups.join(code);
      expect((await w.anonymous.groups.preview(code)).full).toBe(true);
      const late = await person('Tard');
      expect(await apiError(late.api.groups.join(code))).toMatchObject({ code: 'forbidden' });
    });
  });

  describe('« 3 mots » : résultat à partir de 3 votes', () => {
    it('les mots les plus choisis, jamais avant 3 votes ; les visites et votes sont comptés', async () => {
      const lea = await person('Léa');
      const me = await lea.api.me.get();
      const before = await lea.api.words.mine();
      expect(before).toMatchObject({ code: me.wordsCode, votes: 0, top: [], minVotes: 3 });
      const vote = (words: string[], ip: string) =>
        fetch(`${w.baseUrl}/v1/words/${me.wordsCode}`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': ip }, body: JSON.stringify({ words }) });
      await w.anonymous.words.get(me.wordsCode);
      expect((await vote(['drole', 'doux', 'curieux'], 'a')).ok).toBe(true);
      await vote(['drole', 'doux', 'calme'], 'b');
      expect((await lea.api.words.mine()).top).toEqual([]);
      await vote(['drole', 'taquin', 'calme'], 'c');
      const after = await lea.api.words.mine();
      expect(after.votes).toBe(3);
      // Égalité (doux, calme : 2 chacun) : l'ordre de la liste.
      expect(after.top).toEqual(['drole', 'calme', 'doux']);
      const counters = [...db.growthCounters.entries()].map(([k, n]) => [k.split('|')[1], n] as const);
      expect(counters.find(([m]) => m === 'visit_m')?.[1]).toBeGreaterThanOrEqual(1);
      expect(counters.find(([m]) => m === 'words_vote')?.[1]).toBe(3);
    });
  });

  describe('codes, source d’arrivée et parrainage', () => {
    it('un code de créateur se gère dans l’administration et se reconnaît (page /c comptée)', async () => {
      const a = admin();
      const list = await a.createCreator('nino10', 'Nino le créateur');
      expect(list.items.find((c) => c.code === 'NINO10')).toMatchObject({ active: true, visits: 0, onboarded: 0 });
      expect(await errorCode(a.createCreator('NINO10', 'Doublon'))).toBe('conflict');
      expect(await w.anonymous.growth.code('nino10', true)).toEqual({ kind: 'creator', code: 'NINO10', label: 'Nino le créateur' });
      expect(await errorCode(w.anonymous.growth.code('INCONNU'))).toBe('not_found');
      await a.updateCreator('NINO10', { active: false });
      expect(await errorCode(w.anonymous.growth.code('NINO10'))).toBe('not_found');
      await a.updateCreator('NINO10', { active: true });
      // Un compte qui n'est pas dans ADMIN_EMAILS : refusé.
      const other = createAdminClient({ baseUrl: w.baseUrl, getToken: () => `test:${randomUUID()}:x@y.fr` });
      expect(await errorCode(other.creators())).toBe('forbidden');
    });

    it('à l’inscription : la source du lien ouvert ou du code tapé ; un code inconnu devient « store »', async () => {
      const viaCreator = await person('Mia', { attribution: { source: 'creator', ref: 'nino10' } });
      expect(db.acquisitions.get(viaCreator.id)).toMatchObject({ source: 'creator', ref: 'NINO10', referredBy: null, cohortOn: '2026-11-11' });
      const unknown = await person('Noa', { attribution: { source: 'creator', ref: 'PERSONNE' } });
      expect(db.acquisitions.get(unknown.id)?.source).toBe('store');
      const plain = await person('Rui');
      expect(db.acquisitions.get(plain.id)?.source).toBe('store');
      expect((await admin().creators()).items.find((c) => c.code === 'NINO10')).toMatchObject({ visits: 1, onboarded: 1 });
    });

    it('invitation ou lien « 3 mots » : les deux personnes gagnent l’objet « Parrain » (sans achat)', async () => {
      const host = await person('Sasha');
      const hostMe = await host.api.me.get();
      expect((await host.api.pet.wardrobe()).items.find((i) => i.id === 'parrain')).toMatchObject({ state: 'locked', goal: { stat: 'referrals', have: 0, need: 1 } });
      expect(await w.anonymous.growth.code(hostMe.inviteCode)).toMatchObject({ kind: 'invite', label: 'Sasha' });
      const guest = await person('Tom', { inviteCode: hostMe.inviteCode });
      expect(db.acquisitions.get(guest.id)).toMatchObject({ source: 'invite', referredBy: host.id });
      expect((await guest.api.pet.wardrobe()).items.find((i) => i.id === 'parrain')?.state).toBe('owned');
      expect((await host.api.pet.wardrobe()).items.find((i) => i.id === 'parrain')?.state).toBe('owned');
      const voter = await person('Uma', { attribution: { source: 'words', ref: hostMe.wordsCode } });
      expect(db.acquisitions.get(voter.id)).toMatchObject({ source: 'words', referredBy: host.id });
      // Son propre code ne fait pas de soi un parrain.
      const self = w.client();
      await self.api.me.onboard(onboardBody({ displayName: 'Vic' }));
      expect(db.acquisitions.get(self.id)?.referredBy ?? null).toBeNull();
    });
  });

  describe('entonnoir', () => {
    it('premier lancement, inscription, partages, premier lien et J1 / J7 ; tableau par source et facteur K', async () => {
      await w.anonymous.growth.firstOpen({ source: 'creator', ref: 'NINO10' });
      await w.anonymous.growth.firstOpen({ source: 'store' });
      const fresh = w.client();
      await fresh.api.growth.signup({ source: 'creator', ref: 'NINO10' });
      await fresh.api.me.onboard(onboardBody({ displayName: 'Zoé', attribution: { source: 'creator', ref: 'NINO10' } }));
      await fresh.api.growth.share('invite');
      await fresh.api.growth.share('words');
      expect(await errorCode(w.anonymous.growth.share('invite'))).toBe('unauthorized');
      const zoeCode = (await fresh.api.me.get()).inviteCode;
      const friend = await person('Yan');
      await friend.api.invites.accept(zoeCode);
      expect(db.growthEvents.filter((e) => e.userId === fresh.id).map((e) => e.kind)).toEqual(['onboarded', 'first_link']);
      // Le lendemain, puis 7 jours après : J1 et J7, une fois chacun.
      w.clock.advanceDays(1);
      await fresh.api.me.get();
      await fresh.api.me.get();
      w.clock.advanceDays(6);
      await fresh.api.me.get();
      const kinds = db.growthEvents.filter((e) => e.userId === fresh.id).map((e) => e.kind);
      expect(kinds).toEqual(['onboarded', 'first_link', 'active_d1', 'active_d7']);

      const report = await admin().growth();
      expect(report.weeks).toHaveLength(12);
      const week = '2026-11-09';
      const creator = report.funnel.find((r) => r.week === week && r.source === 'creator')?.counts;
      expect(creator).toMatchObject({ visit: 1, first_open: 1, signup: 1, onboarded: 2, first_link: 1, active_d1: 1, active_d7: 1 });
      const all = report.funnel.find((r) => r.week === week && r.source === 'all')?.counts;
      expect(all?.first_open).toBe(2);
      const k = report.k.find((r) => r.week === week);
      expect(k?.shares).toBe(2);
      expect(k?.referred).toBeGreaterThanOrEqual(2);
      const loop = report.words.find((r) => r.week === week);
      expect(loop).toMatchObject({ votes: 3, joined: 1 });
      expect(loop?.loopRate).toBeCloseTo(1 / 3);
      // Le groupe du début : 8 membres 7 jours après sa création → viable.
      const groups = report.groups.find((r) => r.week === week);
      expect(groups?.viable).toBeGreaterThanOrEqual(1);
    });

    it('un compte supprimé laisse des étapes anonymes, plus sa source', async () => {
      const gone = await person('Ana');
      expect(db.acquisitions.has(gone.id)).toBe(true);
      await gone.api.me.remove();
      expect(db.acquisitions.has(gone.id)).toBe(false);
      expect(db.growthEvents.some((e) => e.userId === gone.id)).toBe(false);
      expect(db.growthEvents.some((e) => e.userId === null && e.kind === 'onboarded')).toBe(true);
    });
  });
});
