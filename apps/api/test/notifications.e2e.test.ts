/**
 * Logique des notifications (docs/NOTIFICATIONS.md), de bout en bout en mémoire : rafales regroupées, heures calmes et
 * report au matin, plafonds par priorité, premier plan, personne bloquée ou suspendue, jeton invalide, langue, fin
 * d'essai obligatoire, accord marketing, décroissance, canal (push d'abord, e-mail en repli).
 */
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld } from './helpers';

const SECRET = 'un-secret-de-test-assez-long-pour-passer';

describe('notifications : logique', () => {
  let world: TestWorld;
  let pusher: MemoryPusher;
  let notifier: Notifier;
  let db: MemoryDb;

  beforeEach(async () => {
    world = await startWorld({ INTERNAL_TICK_SECRET: SECRET });
    pusher = world.app.get<MemoryPusher>(PUSHER);
    notifier = world.app.get<Notifier>(NOTIFIER);
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterEach(() => world.close());

  const sentTo = (token: string) => pusher.outbox.filter((m) => m.to === token);
  const tick = () => fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': SECRET } });
  /** Une personne inscrite avec un appareil (Paris par défaut). */
  const person = async (name: string, opts: { locale?: 'fr' | 'en' | 'es' | 'pt' | 'nl'; timeZone?: string; token?: string | null; email?: string } = {}) => {
    const c = world.client(randomUUID(), opts.email);
    await c.api.me.onboard(onboardBody({ displayName: name, ...(opts.locale ? { locale: opts.locale } : {}) }));
    const token = opts.token === null ? null : (opts.token ?? `ExponentPushToken[${name}-${c.id.slice(0, 6)}]`);
    if (token) await c.api.notifications.registerDevice({ token, platform: 'ios', timeZone: opts.timeZone ?? 'Europe/Paris' });
    return { ...c, token: token ?? '' };
  };
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

  it('rafale : 10 signes → un push tout de suite, puis un seul « Bea et 8 autres t’ont fait signe » une heure après', async () => {
    const lou = await person('Lou');
    const names = ['Ava', 'Bea', 'Cy', 'Dan', 'Eli', 'Fay', 'Gus', 'Hal', 'Ida', 'Jo'];
    for (const n of names) {
      const w = await person(n, { token: null });
      await w.api.encounters.wave(lou.id);
    }
    expect(sentTo(lou.token)).toHaveLength(1);
    expect(sentTo(lou.token)[0]).toMatchObject({ title: 'Ava te fait signe', data: { kind: 'waved', url: 'blowy://rencontres' }, categoryId: 'minimoa_mute' });
    expect(db.notificationLog.filter((l) => l.userId === lou.id && l.status === 'deferred')).toHaveLength(1);
    world.clock.advanceMinutes(30);
    await tick();
    expect(sentTo(lou.token)).toHaveLength(1);
    world.clock.advanceMinutes(31);
    await tick();
    expect(sentTo(lou.token)).toHaveLength(2);
    expect(sentTo(lou.token)[1]?.title).toBe('Bea et 8 autres t’ont fait signe');
    // Le paquet compte pour un seul envoi dans le plafond.
    expect(db.notificationLog.filter((l) => l.userId === lou.id && l.status === 'sent')).toHaveLength(2);
    await tick();
    expect(sentTo(lou.token)).toHaveLength(2);
  });

  it('nuit : messages de plusieurs conversations → un seul push à 8 h, vers la liste des chats ; rappel du soir abandonné', async () => {
    const nora = await person('Nora', { timeZone: 'America/New_York' }); // 5 h du matin à New York
    const lea = await person('Léa', { token: null });
    const tom = await person('Tom', { token: null });
    await notifier.notify(nora.id, 'message', { name: 'Léa', linkId: uuid(1), about: lea.id });
    await notifier.notify(nora.id, 'message', { name: 'Tom', linkId: uuid(2), about: tom.id });
    await notifier.notify(nora.id, 'message', { name: 'Léa', linkId: uuid(1), about: lea.id });
    await notifier.notify(nora.id, 'your_turn', { name: 'Léa', linkId: uuid(1), count: '3' });
    expect(sentTo(nora.token)).toHaveLength(0);
    world.clock.advanceHours(3);
    await tick();
    expect(sentTo(nora.token)).toHaveLength(1);
    expect(sentTo(nora.token)[0]).toMatchObject({ title: 'Messages', body: 'Léa et 1 autre t’ont écrit.', data: { kind: 'message', url: 'blowy://chats' } });
    expect(sentTo(nora.token)[0]?.data.linkId).toBeUndefined();
  });

  it('plafonds : 2 rappels de rituels au plus, une place gardée pour les gens ; messages et échéances passent toujours', async () => {
    const rita = await person('Rita');
    await notifier.notify(rita.id, 'daily_challenge', { minimoa: 'Nino' });
    await notifier.notify(rita.id, 'habit_proof', { minimoa: 'Nino' });
    await notifier.notify(rita.id, 'item_unlocked', { minimoa: 'Nino', item: 'cap' });
    expect(sentTo(rita.token).map((m) => m.data.kind)).toEqual(['daily_challenge', 'habit_proof']);
    await notifier.notify(rita.id, 'group_invite', { name: 'Léa', group: 'Run', groupId: uuid(10) });
    await notifier.notify(rita.id, 'waved', { name: 'Tom' });
    expect(sentTo(rita.token)).toHaveLength(3);
    await notifier.notify(rita.id, 'message', { name: 'Léa', linkId: uuid(3) });
    await notifier.notify(rita.id, 'trial_reminder', { endsOn: '2026-11-13T10:00:00Z', price: '5988', currency: 'EUR' });
    expect(sentTo(rita.token).map((m) => m.data.kind)).toEqual(['daily_challenge', 'habit_proof', 'group_invite', 'message', 'trial_reminder']);
    // Le rappel de fin d'essai ne propose pas « Ne plus recevoir ».
    expect(sentTo(rita.token).at(-1)?.categoryId).toBeUndefined();
  });

  it('premier plan : rien pour la conversation ouverte ni pour les rappels ; un message d’ailleurs passe ; en partant, tout repart', async () => {
    const paul = await person('Paul');
    await paul.api.notifications.presence({ foreground: true, linkId: uuid(4) });
    await notifier.notify(paul.id, 'message', { name: 'Léa', linkId: uuid(4) });
    await notifier.notify(paul.id, 'item_unlocked', { minimoa: 'Nino', item: 'cap' });
    await notifier.notify(paul.id, 'waved', { name: 'Tom' });
    expect(sentTo(paul.token)).toHaveLength(0);
    await notifier.notify(paul.id, 'message', { name: 'Tom', linkId: uuid(5) });
    expect(sentTo(paul.token)).toHaveLength(1);
    await paul.api.notifications.presence({ foreground: false });
    await notifier.notify(paul.id, 'waved', { name: 'Zoé' });
    expect(sentTo(paul.token).map((m) => m.title)).toEqual(['Tom', 'Zoé te fait signe']);
    // Signal vieux de plus de 150 s : considéré en arrière-plan.
    await paul.api.notifications.presence({ foreground: true, groupId: uuid(6) });
    world.clock.advanceMinutes(3);
    await notifier.notify(paul.id, 'group_message', { name: 'Léa', group: 'Run', groupId: uuid(6) });
    expect(sentTo(paul.token)).toHaveLength(3);
    expect(sentTo(paul.token)[2]?.data).toMatchObject({ kind: 'group_message', groupId: uuid(6), url: `blowy://groupe/${uuid(6)}` });
  });

  it('personne bloquée ou suspendue : jamais de notification à son sujet ; destinataire suspendu : rien', async () => {
    const bea = await person('Bea');
    const max = await person('Max', { token: null });
    const sam = await person('Sam', { token: null });
    await bea.api.safety.block(max.id);
    await notifier.notify(bea.id, 'message', { name: 'Max', linkId: uuid(7), about: max.id });
    await notifier.notify(bea.id, 'group_message', { name: 'Max', group: 'Run', groupId: uuid(8), about: max.id });
    expect(sentTo(bea.token)).toHaveLength(0);
    db.suspensions.set(sam.id, { userId: sam.id, since: world.clock.now().toISOString(), until: null, reason: 'test', byEmail: 'a@b.c' });
    await notifier.notify(bea.id, 'group_joined', { name: 'Sam', group: 'Run', groupId: uuid(8), about: sam.id, count: '3' });
    expect(sentTo(bea.token)).toHaveLength(0);
    // Compte supprimé (profil introuvable) : rien non plus.
    await notifier.notify(bea.id, 'message', { name: 'Zed', linkId: uuid(13), about: randomUUID() });
    expect(sentTo(bea.token)).toHaveLength(0);
    const ana = await person('Ana', { token: null });
    await notifier.notify(bea.id, 'message', { name: 'Ana', linkId: uuid(9), about: ana.id });
    expect(sentTo(bea.token)).toHaveLength(1);
    db.suspensions.set(bea.id, { userId: bea.id, since: world.clock.now().toISOString(), until: null, reason: 'test', byEmail: 'a@b.c' });
    world.clock.advanceMinutes(1); // cache de la garde de compte (30 s)
    await notifier.notify(bea.id, 'message', { name: 'Ana', linkId: uuid(11) });
    expect(sentTo(bea.token)).toHaveLength(1);
  });

  it('jeton invalide : appareil désactivé, plus rien ne part ni n’attend', async () => {
    const ivy = await person('Ivy', { token: 'ExponentPushToken[invalid-ivy]' });
    await notifier.notify(ivy.id, 'waved', { name: 'Tom' });
    expect((await ivy.api.notifications.settings()).hasDevice).toBe(false);
    await notifier.notify(ivy.id, 'waved', { name: 'Zoé' });
    expect(sentTo(ivy.token)).toHaveLength(0);
    expect(db.notificationLog.filter((l) => l.userId === ivy.id && l.status === 'deferred')).toHaveLength(0);
  });

  it('langue du profil, y compris pour un paquet regroupé', async () => {
    const eva = await person('Eva', { locale: 'pt' });
    for (let i = 0; i < 4; i++) await notifier.notify(eva.id, 'words_received');
    world.clock.advanceMinutes(61);
    await tick();
    expect(sentTo(eva.token).map((m) => m.title)).toEqual(['3 palavras para você', '3 pessoas descreveram você']);
    expect(sentTo(eva.token)[1]?.data.url).toBe('blowy://mots');
    const nl = await person('Noor', { locale: 'nl' });
    await notifier.notify(nl.id, 'new_encounter', { name: 'Léa', linkId: uuid(12), step: 'invite' });
    expect(sentTo(nl.token)[0]).toMatchObject({ title: 'Léa nam je uitnodiging aan', data: { url: `blowy://link/${uuid(12)}` } });
  });

  it('fin d’essai : obligatoire (le réglage ne la coupe pas), envoyée la nuit si l’essai finit avant le matin', async () => {
    const tia = await person('Tia');
    const settings = await tia.api.notifications.updateSettings({ kinds: { trial_reminder: false } });
    expect(settings.kinds.trial_reminder).toBe(true);
    expect(settings.mandatory).toEqual(['trial_reminder']);
    world.clock.advanceHours(12); // 23 h à Paris
    await notifier.notify(tia.id, 'trial_reminder', { endsOn: new Date(world.clock.now().getTime() + 4 * 3_600_000).toISOString(), price: '5988' });
    expect(sentTo(tia.token)).toHaveLength(1);
    const uma = await person('Uma');
    await notifier.notify(uma.id, 'trial_reminder', { endsOn: new Date(world.clock.now().getTime() + 48 * 3_600_000).toISOString(), price: '5988' });
    expect(sentTo(uma.token)).toHaveLength(0);
    world.clock.advanceHours(9);
    await tick();
    expect(sentTo(uma.token)).toHaveLength(1);
  });

  it('marketing : relance Minimoa+ seulement avec l’accord explicite, retirable', async () => {
    const mia = await person('Mia');
    expect((await mia.api.notifications.settings()).marketing).toBe(false);
    await notifier.notify(mia.id, 'plus_account', { step: 'winback', minimoa: 'Nino' });
    expect(sentTo(mia.token)).toHaveLength(0);
    expect((await mia.api.notifications.updateSettings({ marketing: true })).marketing).toBe(true);
    expect(db.notificationSettings.get(mia.id)?.marketingOptInAt).toBe(world.clock.now().toISOString());
    await notifier.notify(mia.id, 'plus_account', { step: 'winback', minimoa: 'Nino' });
    expect(sentTo(mia.token)).toHaveLength(1);
    expect((await mia.api.notifications.updateSettings({ marketing: false })).marketing).toBe(false);
    expect(db.notificationSettings.get(mia.id)?.marketingOptInAt).toBeNull();
    // Paiement refusé : une échéance, toujours envoyée.
    world.clock.advanceDays(1);
    await notifier.notify(mia.id, 'plus_account', { step: 'billing_retry', minimoa: 'Nino' });
    expect(sentTo(mia.token)).toHaveLength(2);
  });

  it('décroissance : sans ouvrir l’app, plus de rappels de rituels après 3 jours ; les gens et les nouvelles passent', async () => {
    const dan = await person('Dan');
    world.clock.advanceDays(4);
    await notifier.notify(dan.id, 'daily_challenge', { minimoa: 'Nino' });
    await notifier.notify(dan.id, 'habit_proof', { minimoa: 'Nino' });
    expect(sentTo(dan.token)).toHaveLength(0);
    await notifier.notify(dan.id, 'minimoa_news', { step: 'absence', days: '3', minimoa: 'Nino' });
    await notifier.notify(dan.id, 'waved', { name: 'Tom' });
    expect(sentTo(dan.token).map((m) => m.data.kind)).toEqual(['minimoa_news', 'waved']);
    // Il rouvre l'app (l'appareil est revu) : les rappels reprennent.
    await dan.api.notifications.registerDevice({ token: dan.token, platform: 'ios', timeZone: 'Europe/Paris' });
    world.clock.advanceDays(1);
    await notifier.notify(dan.id, 'daily_challenge', { minimoa: 'Nino' });
    expect(sentTo(dan.token).at(-1)?.data.kind).toBe('daily_challenge');
  });

  it('canal : nouveau lien par push seulement ; l’e-mail ne part que si la personne ne reçoit pas les push', async () => {
    const withPush = await person('Ana', { email: 'ana@test.fr' });
    const me1 = await withPush.api.me.get();
    const guest1 = world.client();
    await guest1.api.me.onboard(onboardBody({ displayName: 'Guy', inviteCode: me1.inviteCode, pet: { name: 'Gaston', species: 'gaston' } }));
    expect(sentTo(withPush.token)).toHaveLength(1);
    expect(sentTo(withPush.token)[0]).toMatchObject({ title: 'Guy a accepté ton invitation', data: { kind: 'new_encounter' } });
    expect(world.outbox.filter((m) => m.to === 'ana@test.fr' && /se sont trouvés/.test(m.subject))).toHaveLength(0);

    const noPush = await person('Bob', { email: 'bob@test.fr', token: null });
    const me2 = await noPush.api.me.get();
    const guest2 = world.client();
    await guest2.api.me.onboard(onboardBody({ displayName: 'Gil', inviteCode: me2.inviteCode, pet: { name: 'Gaston', species: 'gaston' } }));
    expect(world.outbox.filter((m) => m.to === 'bob@test.fr' && /se sont trouvés/.test(m.subject))).toHaveLength(1);
  });
});
