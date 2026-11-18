/**
 * Garde-fous contre les ajouts en masse : on ne salue que quelqu'un que l'app a montré, plafond de coucous par jour
 * (plus haut avec Minimoa+), coucous en attente, e-mails de signe plafonnés, repérage pour la modération, et les
 * autres ajouts (invitations par lien, signalements).
 */
import type { ApiClient } from '@blowy/api-client';
import { WAVE_DAILY_PLUS, WAVE_EMAILS_PER_RECIPIENT_PER_DAY, WAVE_MAX_PENDING, INVITE_ACCEPTS_PER_DAY, REPORTS_PER_DAY } from '@blowy/domain';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, errorCode, onboardBody, startWorld } from './helpers';

type Person = { id: string; api: ApiClient };

/** Lyon : hors de la zone de recherche d'une personne à Paris. */
const LYON = { latitude: 45.764, longitude: 4.8357 };

describe('anti-spam des coucous', () => {
  let world: TestWorld;
  let db: MemoryDb;
  let n = 0;

  beforeEach(async () => {
    world = await startWorld();
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterEach(() => world.close());

  const join = async (overrides: Parameters<typeof onboardBody>[0] = {}, email?: string): Promise<Person> => {
    n += 1;
    const p = email ? world.client(undefined, email) : world.client();
    await p.api.me.onboard(onboardBody({ displayName: `Personne${n}`, ...overrides }));
    return p;
  };
  const crowd = async (count: number): Promise<Person[]> => {
    const out: Person[] = [];
    for (let i = 0; i < count; i++) out.push(await join());
    return out;
  };
  const setPlus = (p: Person) => {
    const profile = db.profiles.get(p.id);
    if (!profile) throw new Error('profil introuvable');
    db.profiles.set(p.id, { ...profile, plusUntil: '2030-01-01T00:00:00.000Z' });
  };
  /** Salue chacun dans l'ordre jusqu'au premier refus ; rend le nombre de coucous passés et le refus. */
  const waveUntilRefused = async (from: Person, targets: readonly Person[]): Promise<{ sent: number; refusal: { code: string; message: string } | null }> => {
    let sent = 0;
    for (const t of targets) {
      try {
        await from.api.encounters.wave(t.id);
        sent += 1;
      } catch (err) {
        return { sent, refusal: { code: String((err as { code: string }).code), message: (err as Error).message } };
      }
    }
    return { sent, refusal: null };
  };

  it('un coucou vers une personne que l’app ne t’a pas montrée est introuvable ; avec Minimoa+, la carte montre partout', async () => {
    const far = await join({ location: LYON });
    const me = await join();
    expect((await me.api.encounters.list()).suggestions.map((s) => s.user.id)).not.toContain(far.id);
    const refused = await apiError(me.api.encounters.wave(far.id));
    expect(refused.code).toBe('not_found');
    expect(refused.message).toBe('Cette personne est introuvable.');
    // Rien n'a été écrit, rien n'est parti.
    expect([...db.encounters.values()].some((e) => e.toUser === far.id)).toBe(false);

    // Minimoa+ peut regarder la carte n'importe où : la personne de Lyon peut y être montrée.
    setPlus(me);
    await me.api.encounters.wave(far.id);

    // Répondre à quelqu'un qui t'a salué reste toujours possible (même de loin) : c'est accepter.
    const lyonnaise = await join({ location: LYON });
    setPlus(lyonnaise);
    const parisien = await join();
    await lyonnaise.api.encounters.wave(parisien.id);
    await parisien.api.encounters.wave(lyonnaise.id);
    expect((await parisien.api.links.list()).some((l) => l.other.id === lyonnaise.id)).toBe(true);
  });

  it('plafond du jour : gratuit, puis plus haut avec Minimoa+ ; le lendemain ça repart', async () => {
    const targets = await crowd(40);
    const free = await join();
    const plus = await join();
    setPlus(plus);

    const freeStart = (await free.api.encounters.list()).waves;
    const plusStart = (await plus.api.encounters.list()).waves;
    expect(freeStart).toMatchObject({ left: 10, blocked: null });
    expect(plusStart).toMatchObject({ left: WAVE_DAILY_PLUS, blocked: null });

    const first = await waveUntilRefused(free, targets);
    expect(first.sent).toBe(freeStart?.left);
    expect(first.refusal?.code).toBe('wave_limit');
    expect(first.refusal?.message).toBe('Tu as fait signe à beaucoup de monde aujourd’hui. Reviens demain.');
    const blocked = (await free.api.encounters.list()).waves;
    expect(blocked).toEqual({ left: 0, blocked: 'daily', message: 'Tu as fait signe à beaucoup de monde aujourd’hui. Reviens demain.' });
    // Un coucou déjà envoyé reste idempotent, même au plafond.
    await free.api.encounters.wave(targets[0]?.id ?? '');

    const plusRun = await waveUntilRefused(plus, targets);
    expect(plusRun.sent).toBe(WAVE_DAILY_PLUS);
    expect(plusRun.refusal?.code).toBe('wave_limit');

    world.clock.advanceDays(1);
    expect((await free.api.encounters.list()).waves?.blocked).toBeNull();
    expect(await free.api.encounters.wave(targets[first.sent]?.id ?? '')).toEqual({ ok: true });
  });

  it(`au plus ${WAVE_MAX_PENDING} coucous en attente : il faut des réponses (ou que les anciens expirent)`, async () => {
    const targets = await crowd(WAVE_MAX_PENDING + 3);
    const me = await join();
    let total = 0;
    let last: { code: string; message: string } | null = null;
    for (let day = 0; day < 6 && total < WAVE_MAX_PENDING; day++) {
      const run = await waveUntilRefused(me, targets.slice(total));
      total += run.sent;
      last = run.refusal;
      world.clock.advanceDays(1);
    }
    expect(total).toBe(WAVE_MAX_PENDING);
    const next = targets[total];
    if (!next) throw new Error('personne de plus');
    const refusal = await apiError(me.api.encounters.wave(next.id));
    expect(refusal.code).toBe('wave_limit');
    expect(refusal.message).toMatch(/attendent encore une réponse/);
    expect(last).not.toBeNull();
    expect((await me.api.encounters.list()).waves?.blocked).toBe('pending');

    // Une réponse (même un non) libère une place.
    const answered = targets[0];
    if (!answered) throw new Error('personne');
    const incoming = (await answered.api.encounters.list()).incoming.find((i) => i.from.id === me.id);
    await answered.api.encounters.decline(incoming?.id ?? '');
    expect((await me.api.encounters.list()).waves).toMatchObject({ left: 1, blocked: null });
    await me.api.encounters.wave(next.id);

    // Les coucous restés sans réponse plus de 14 jours ne comptent plus.
    world.clock.advanceDays(15);
    expect((await me.api.encounters.list()).waves?.blocked).toBeNull();
  });

  it(`e-mails de signe : ${WAVE_EMAILS_PER_RECIPIENT_PER_DAY} par jour et par destinataire au plus, le reste dans l'app`, async () => {
    const star = await join({}, 'star@example.com');
    const fans = await crowd(6);
    const before = world.outbox.filter((m) => m.to === 'star@example.com').length;
    for (const fan of fans) await fan.api.encounters.wave(star.id);
    expect(world.outbox.filter((m) => m.to === 'star@example.com').length - before).toBe(WAVE_EMAILS_PER_RECIPIENT_PER_DAY);
    // Tous les coucous sont bien là, dans l'app.
    expect((await star.api.encounters.list()).incoming).toHaveLength(6);
    // Le lendemain, de nouveau quelques e-mails.
    world.clock.advanceDays(1);
    const late = await join();
    await late.api.encounters.wave(star.id);
    expect(world.outbox.filter((m) => m.to === 'star@example.com').length - before).toBe(WAVE_EMAILS_PER_RECIPIENT_PER_DAY + 1);
  });

  it('beaucoup de refus après ses coucous : signalé une fois à la modération, sans suspension', async () => {
    const targets = await crowd(12);
    const spammer = await join();
    let sent = 0;
    for (let day = 0; day < 4 && sent < 9; day++) {
      sent += (await waveUntilRefused(spammer, targets.slice(sent, 9))).sent;
      world.clock.advanceDays(1);
    }
    expect(sent).toBe(9);
    for (const t of targets.slice(0, 9)) {
      const incoming = (await t.api.encounters.list()).incoming.find((i) => i.from.id === spammer.id);
      await t.api.encounters.decline(incoming?.id ?? '');
    }
    const flagged = db.reports.filter((r) => r.targetUser === spammer.id && r.category === 'wave_spam');
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ source: 'filter', reporter: null });
    expect(flagged[0]?.details).toMatch(/Beaucoup de refus/);
    // Pas de suspension : le compte peut toujours écrire.
    expect(db.suspensions.size).toBe(0);
    expect((await spammer.api.encounters.list()).waves).toBeDefined();
  });
});

describe('anti-spam des autres ajouts', () => {
  let world: TestWorld;
  beforeEach(async () => {
    world = await startWorld();
  });
  afterEach(() => world.close());

  it(`signalements : ${REPORTS_PER_DAY} par jour au plus (bloquer reste possible)`, async () => {
    const me = world.client();
    await me.api.me.onboard(onboardBody());
    const others: Person[] = [];
    for (let i = 0; i <= REPORTS_PER_DAY; i++) {
      const p = world.client();
      await p.api.me.onboard(onboardBody({ displayName: `Signalée${i}` }));
      others.push(p);
    }
    for (const p of others.slice(0, REPORTS_PER_DAY)) await me.api.safety.report({ userId: p.id, reason: 'autre' });
    const last = others[REPORTS_PER_DAY];
    if (!last) throw new Error('personne');
    const refused = await apiError(me.api.safety.report({ userId: last.id, reason: 'autre' }));
    expect(refused.code).toBe('rate_limited');
    expect(refused.message).toMatch(/beaucoup de signalements/);
    await me.api.safety.block(last.id);
    world.clock.advanceDays(1);
    await me.api.safety.report({ userId: last.id, reason: 'autre' });
  });

  it(`invitations par lien : ${INVITE_ACCEPTS_PER_DAY} nouveaux liens par jour au plus`, async () => {
    const me = world.client();
    await me.api.me.onboard(onboardBody());
    const codes: string[] = [];
    for (let i = 0; i <= INVITE_ACCEPTS_PER_DAY; i++) {
      const p = world.client();
      await p.api.me.onboard(onboardBody({ displayName: `Hôte${i}`, location: LYON }));
      codes.push((await p.api.me.get()).inviteCode);
    }
    for (const code of codes.slice(0, INVITE_ACCEPTS_PER_DAY)) await me.api.invites.accept(code);
    expect(await errorCode(me.api.invites.accept(codes[INVITE_ACCEPTS_PER_DAY] ?? ''))).toBe('rate_limited');
    world.clock.advanceDays(1);
    await me.api.invites.accept(codes[INVITE_ACCEPTS_PER_DAY] ?? '');
  });
});
