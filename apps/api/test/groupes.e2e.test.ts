import { randomUUID } from 'node:crypto';
import { type ApiClient, createAdminClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GroupJobs } from '../src/modules/groups/application/group.jobs';
import { HabitSharing } from '../src/modules/groups/sharing/habit-sharing';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, errorCode, onboardBody, startWorld } from './helpers';

type P = { id: string; api: ApiClient };

/** Habitudes partagées, rigueur et groupes (spéc §25 et §26), en mémoire. */
describe('groupes et habitudes partagées', () => {
  let w: TestWorld;
  let db: MemoryDb;
  let a: P;
  let b: P;
  let c: P;
  let d: P;
  const jobs = (): GroupJobs => w.app.get(GroupJobs);
  const habitRef = async (p: P, habitId: string): Promise<string> =>
    (await p.api.rituals.habits()).habits.find((h) => h.habitId === habitId)?.ref ?? '';

  beforeAll(async () => {
    w = await startWorld({ ADMIN_EMAILS: 'ops@blowy.app' });
    db = w.app.get<MemoryDb>(MEMORY_DB);
    const people: P[] = [];
    for (const name of ['Alix', 'Bao', 'Cyd', 'Dani']) {
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: name, habits: [{ habitId: 'marcher' }] }));
      people.push(p);
    }
    [a, b, c, d] = people as [P, P, P, P];
    const code = (await a.api.me.get()).inviteCode;
    for (const p of [b, c, d]) await p.api.invites.accept(code);
  });
  afterAll(() => w.close());

  it('les habitudes choisies à l’inscription sont suivies ; rigueur « trop tôt pour le dire » au début', async () => {
    const list = await a.api.rituals.habits();
    expect(list.habits.map((h) => h.habitId)).toEqual(['marcher']);
    expect(list.habits[0]?.rhythm).toBe('daily');
    expect(list.rigour).toEqual({ value: null, tooEarly: true, dueDays: 0 });
    expect(list.shared).toBe(true);
    expect((await a.api.me.get()).showHabits).toBe(true);
    // Une habitude inconnue est refusée avant de rien écrire.
    const x = w.client();
    expect(await errorCode(x.api.me.onboard(onboardBody({ habits: [{ habitId: 'voler' }] })))).toBe(
      'invalid',
    );
    expect(await errorCode(x.api.me.get())).toBe('not_onboarded');
  });

  it('habitudes communes sur un lien, jamais quand l’un a coupé le réglage', async () => {
    const link = (await a.api.links.list()).find((l) => l.other.id === b.id);
    const full = await a.api.links.get(link?.id ?? '');
    expect(full.sharedHabits?.habits.map((h) => h.habitId)).toEqual(['marcher']);
    expect(full.sharedHabits?.habits[0]?.theirs.rigour.tooEarly).toBe(true);
    await b.api.me.update({ showHabits: false });
    expect((await a.api.links.get(link?.id ?? '')).sharedHabits).toBeUndefined();
    await b.api.me.update({ showHabits: true });
  });

  let g1 = '';
  it('créer un groupe d’habitude : invitations, il démarre à 3 membres', async () => {
    expect(
      await errorCode(
        a.api.groups.create({ name: 'Marche', kind: 'habit', habitId: 'marcher', memberIds: [b.id] }),
      ),
    ).toBe('invalid');
    const created = await a.api.groups.create({
      name: 'Les marcheurs',
      kind: 'habit',
      habitId: 'marcher',
      memberIds: [b.id, c.id],
    });
    g1 = created.id;
    expect(created.status).toBe('forming');
    expect(created.invited).toBe(2);
    const inv = (await b.api.groups.list()).invitations;
    expect(inv).toHaveLength(1);
    expect(inv[0]?.invitedBy.id).toBe(a.id);
    expect(inv[0]?.transparency).toContain('tenu, joker ou manqué');
    await b.api.groups.accept(g1);
    const started = await c.api.groups.accept(g1);
    expect(started.status).toBe('active');
    expect(started.members.map((m) => m.person.displayName).sort()).toEqual(['Alix', 'Bao', 'Cyd']);
    expect(started.habit?.lives).toBe(5);
    // Ce qu'un lien voit, rien de plus : ni position, ni âge, ni vision.
    const raw = JSON.stringify(started);
    for (const leak of ['birthdate', 'latitude', 'lat"', 'vision', 'compatibility', '1997'])
      expect(raw).not.toContain(leak);
    expect(started.members.every((m) => m.person.face === 'hidden' && m.person.avatarUrl === null)).toBe(
      true,
    );
    const msgs = await a.api.groups.messages(g1);
    expect(msgs.messages.map((m) => m.body).at(-1)).toBe('Vous êtes 3. Le groupe démarre.');
  });

  it('un jour : à jour par l’habitude ou un joker posé jusqu’au lendemain midi ; le minuteur juge une fois', async () => {
    // Jeudi 12 : Alix et Bao marchent, Cyd non.
    w.clock.advanceDays(1);
    await a.api.rituals.habitDone(await habitRef(a, 'marcher'));
    await b.api.rituals.habitDone(await habitRef(b, 'marcher'));
    // Vendredi 13, 9 h : rien n'est encore jugé ; Cyd voit qu'il peut poser un joker pour hier.
    w.clock.advanceHours(22);
    expect(await jobs().runDue(w.clock.now())).toBe(0);
    const before = await c.api.groups.get(g1);
    expect(before.members.find((m) => m.me)?.yesterday).toBe('pending');
    expect(before.jokers).toMatchObject({ left: 1, perWeek: 1, canPlaceFor: '2026-11-12' });
    const action = await c.api.groups.joker(g1, '2026-11-12');
    expect(action.messages[0]?.body).toBe('Cyd pose un joker.');
    expect(action.group.jokers?.left).toBe(0);
    // Le joker vient de la même réserve que la série du défi.
    expect(db.ritualStates.get(c.id)?.streak.jokerDays).toContain('2026-11-12');
    // 13 h : la veille est jugée, une seule fois.
    w.clock.advanceHours(4);
    expect(await jobs().runDue(w.clock.now())).toBe(1);
    expect(await jobs().runDue(w.clock.now())).toBe(0);
    const after = await a.api.groups.get(g1);
    expect(after.habit).toMatchObject({ streak: 1, lives: 5 });
    expect(after.week.find((d) => d.day === '2026-11-12')?.outcome).toBe('kept');
    // Après midi, plus de joker pour hier ; et plus aucun joker cette semaine.
    expect(await apiError(c.api.groups.joker(g1, '2026-11-12'))).toMatchObject({ code: 'invalid' });
    expect(await errorCode(c.api.groups.joker(g1, '2026-11-13'))).toBe('forbidden');
  });

  it('un membre manque un jour : une vie de moins, série à zéro ; à zéro vie le groupe s’endort, un membre le réveille', async () => {
    await a.api.rituals.habitDone(await habitRef(a, 'marcher'));
    await b.api.rituals.habitDone(await habitRef(b, 'marcher'));
    w.clock.advanceDays(1); // samedi 14, 13 h
    expect(await jobs().runDue(w.clock.now())).toBe(1);
    const lost = await a.api.groups.get(g1);
    expect(lost.habit).toMatchObject({ lives: 4, streak: 0, bestStreak: 1 });
    expect(lost.week.find((d) => d.day === '2026-11-13')?.outcome).toBe('missed');
    expect(
      (await a.api.groups.messages(g1)).messages.some((m) => m.body === 'Une vie de moins. Il en reste 4.'),
    ).toBe(true);
    // Dernière vie : le prochain jour manqué l'endort.
    const row = db.groups.get(g1);
    if (row) db.groups.set(g1, { ...row, lives: 1 });
    w.clock.advanceDays(1);
    await jobs().runDue(w.clock.now());
    const asleep = await b.api.groups.get(g1);
    expect(asleep.status).toBe('asleep');
    expect(asleep.canWake).toBe(true);
    expect(await jobs().runDue(w.clock.now())).toBe(0);
    expect(await errorCode(b.api.groups.joker(g1, '2026-11-15'))).toBe('conflict');
    const woke = await b.api.groups.wake(g1);
    expect(woke.group).toMatchObject({ status: 'active', canWake: false });
    expect(woke.group.habit).toMatchObject({ lives: 5, streak: 0 });
    expect(woke.messages[0]?.body).toBe('Bao réveille le groupe. Cinq vies, on repart.');
  });

  it('filtre des contenus : nom et messages du groupe', async () => {
    expect(await errorCode(a.api.groups.rename(g1, 'connard'))).toBe('content_refused');
    expect(await errorCode(a.api.groups.send(g1, 'je vais te tuer'))).toBe('content_refused');
    expect(db.reports.some((r) => r.groupId === g1 && r.source === 'filter')).toBe(true);
    const sent = await a.api.groups.send(g1, 'On marche demain matin ?');
    expect(sent.messages[0]).toMatchObject({ author: 'me', body: 'On marche demain matin ?' });
    const seen = (await b.api.groups.messages(g1)).messages.at(-1);
    expect(seen).toMatchObject({ author: 'member', authorName: 'Alix' });
    expect((await b.api.groups.list()).groups.find((g) => g.id === g1)?.unread).toBe(1);
    await b.api.groups.read(g1);
    expect((await b.api.groups.list()).groups.find((g) => g.id === g1)?.unread).toBe(0);
    // Signaler un message : le bureau des signalements, avec le groupe.
    await b.api.groups.report(g1, { reason: 'harcelement', messageId: sent.messages[0]?.id });
    expect(
      db.reports.some(
        (r) =>
          r.groupId === g1 &&
          r.reporter === b.id &&
          r.targetUser === a.id &&
          r.groupMessageId === sent.messages[0]?.id,
      ),
    ).toBe(true);
  });

  it('limite : 2 groupes sans Minimoa+', async () => {
    const created = await a.api.groups.create({ name: 'Les potes', kind: 'free', memberIds: [b.id, d.id] });
    expect(created.habit).toBeNull();
    const list = await a.api.groups.list();
    expect(list).toMatchObject({ limit: 2, used: 2, canCreate: false });
    expect(
      await apiError(a.api.groups.create({ name: 'Encore', kind: 'free', memberIds: [b.id, c.id] })),
    ).toMatchObject({ code: 'forbidden' });
  });

  it('Audience : deux personnes bloquées ne sont jamais dans le même groupe ; bloquer un membre fait partir celui qui bloque', async () => {
    const g2 = (await a.api.groups.list()).groups.find((g) => g.name === 'Les potes')?.id ?? '';
    await b.api.groups.accept(g2);
    // Dani bloque Bao (membre) : l'invitation de Dani n'arrive plus et ne peut pas être acceptée.
    expect((await d.api.groups.list()).invitations).toHaveLength(1);
    await d.api.safety.block(b.id);
    expect((await d.api.groups.list()).invitations).toHaveLength(0);
    expect(await errorCode(d.api.groups.accept(g2))).toBe('not_found');
    // Bao bloque Alix : Bao quitte les deux groupes partagés.
    await b.api.safety.block(a.id);
    expect((await b.api.groups.list()).groups).toHaveLength(0);
    const g1View = await a.api.groups.get(g1);
    expect(g1View.members.map((m) => m.person.id)).not.toContain(b.id);
    expect(await errorCode(b.api.groups.messages(g1))).toBe('forbidden');
  });

  it('administration : le signalement porte le groupe ; voir et fermer un groupe', async () => {
    const admin = createAdminClient({
      baseUrl: w.baseUrl,
      getToken: () => `test:${randomUUID()}:ops@blowy.app`,
    });
    const reports = await admin.reports({ status: 'open' });
    const item = reports.items.find((r) => r.groupId === g1 && r.reporter?.id === b.id);
    expect(item?.hasMessage).toBe(true);
    const detail = await admin.report(item?.id ?? '');
    expect(detail.context.find((m) => m.reported)?.body).toBe('On marche demain matin ?');
    expect(await admin.group(g1)).toMatchObject({ id: g1, status: 'active', kind: 'habit' });
    expect(await admin.closeGroup(g1, 'Signalé plusieurs fois.')).toMatchObject({
      status: 'closed',
      closedReason: 'Signalé plusieurs fois.',
    });
    expect(await errorCode(a.api.groups.send(g1, 'Encore là ?'))).toBe('forbidden');
    expect((await a.api.groups.messages(g1)).messages.at(-1)?.body).toBe(
      'Ce groupe a été fermé par la modération.',
    );
    // Un compte qui n'est pas dans ADMIN_EMAILS : refusé.
    const other = createAdminClient({
      baseUrl: w.baseUrl,
      getToken: () => `test:${randomUUID()}:x@blowy.app`,
    });
    expect(await errorCode(other.group(g1))).toBe('forbidden');
  });
});

describe('« la tenir ensemble »', () => {
  let w: TestWorld;
  const people: P[] = [];
  beforeAll(async () => {
    w = await startWorld();
    for (const name of ['Eli', 'Fé', 'Gus', 'Hoa']) {
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: name, habits: [{ habitId: 'sport' }] }));
      people.push(p);
    }
  });
  afterAll(() => w.close());

  it('seul un nombre est rendu, au moins 2 ; mode discret et réglage coupé ne comptent pas', async () => {
    const [e, , , h] = people as [P, P, P, P];
    const s = await e.api.groups.together();
    expect(s.suggestions).toHaveLength(1);
    expect(s.suggestions[0]).toMatchObject({ habitId: 'sport', count: 3, proposed: false });
    expect(s.suggestions[0]?.text).toBe(
      '3 personnes près de toi tiennent la même habitude : Faire du sport. La tenir ensemble ?',
    );
    const raw = JSON.stringify(s);
    for (const p of people.slice(1)) expect(raw).not.toContain(p.id);
    for (const leak of ['lat', 'lng', 'km', 'Fé', 'Gus', 'Hoa']) expect(raw).not.toContain(leak);
    await h.api.me.update({ discreet: true });
    expect((await e.api.groups.together()).suggestions[0]?.count).toBe(2);
    await h.api.me.update({ discreet: false, showHabits: false });
    expect((await e.api.groups.together()).suggestions[0]?.count).toBe(2);
    expect((await h.api.groups.together()).suggestions).toHaveLength(0);
  });

  it('compté autour de la zone du domicile gardée par le serveur : un centre envoyé par l’app est ignoré', async () => {
    const [e] = people as [P, P, P, P];
    const far = w.client();
    await far.api.me.onboard(
      onboardBody({
        displayName: 'Ivo',
        habits: [{ habitId: 'sport' }],
        location: { latitude: 45.764, longitude: 4.8357 },
      }),
    );
    const token = `test:${e.id}`;
    const plain = await (
      await fetch(`${w.baseUrl}/v1/together`, { headers: { authorization: `Bearer ${token}` } })
    ).json();
    const moved = await (
      await fetch(`${w.baseUrl}/v1/together?lat=45.764&lng=4.8357&radiusKm=50`, {
        headers: { authorization: `Bearer ${token}` },
      })
    ).json();
    expect(moved).toEqual(plain);
    expect(JSON.stringify(plain)).not.toContain(far.id);
    // Une personne à Lyon ne compte pas pour Paris, et Lyon seule n'a personne.
    expect((await far.api.groups.together()).suggestions).toHaveLength(0);
  });

  it('habitudes d’une autre personne : seulement pour un lien, un coucou ou une personne présentée, jamais un identifiant quelconque', async () => {
    const [e, f] = people as [P, P, P, P];
    const sharing = w.app.get(HabitSharing);
    expect((await sharing.sharedWith(e.id, [f.id])).size).toBe(0);
    expect(
      (await sharing.sharedWith(e.id, [f.id], new Set([f.id]))).get(f.id)?.habits.map((h) => h.habitId),
    ).toEqual(['sport']);
    // Un coucou suffit (la rencontre est entre elles).
    await e.api.encounters.wave(f.id);
    expect((await sharing.sharedWith(f.id, [e.id])).get(e.id)?.habits).toHaveLength(1);
  });

  it('dire oui : on attend ; au troisième oui le groupe démarre, et seulement entre eux', async () => {
    const [e, f, g, h] = people as [P, P, P, P];
    expect(await e.api.groups.proposeTogether('sport')).toMatchObject({ status: 'waiting', groupId: null });
    expect((await e.api.groups.together()).suggestions[0]?.proposed).toBe(true);
    expect((await f.api.groups.proposeTogether('sport')).status).toBe('waiting');
    expect((await e.api.groups.list()).groups).toHaveLength(0);
    const started = await g.api.groups.proposeTogether('sport');
    expect(started.status).toBe('started');
    const group = await e.api.groups.get(started.groupId ?? '');
    expect(group.members.map((m) => m.person.displayName).sort()).toEqual(['Eli', 'Fé', 'Gus']);
    expect(group).toMatchObject({ kind: 'habit', status: 'active', name: 'Faire du sport' });
    expect(await errorCode(h.api.groups.get(started.groupId ?? ''))).toBe('forbidden');
  });
});
