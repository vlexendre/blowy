/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T8 — « La semaine de Léa en notifications » (spec-v5 §9 ; V5.1 D.15, G.22 ; D-028, D-052).
 * Ce que le téléphone de Léa affiche, jour après jour, pendant sa semaine de sortie — et ce qu'il
 * n'affiche PAS : rien le lundi (la demande est automatique), une seule invitation, un rappel sans
 * urgence, la confirmation de la veille 18 h avec le lieu, les visages à J − 3 h, le check-in,
 * « besoin d'aide » qui passe toujours (et la page ange prévenue par Web Push, livré par T4), le vote,
 * le résultat — en mode discret à partir de vendredi —, puis le silence entre deux sorties, sauf
 * les messages reçus. Jamais plus de 3 par jour (4 le jour de la sortie, sécurité en plus).
 * Les envois passent par la boîte de réception locale (adaptateur dev du port Expo).
 * Écrit par l'agent G (T8) à la demande de l'orchestrateur (habituellement réservé à H).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { DevPushInboxEntry } from '@blowy/api-contract';
import { PUSH_SENDER } from '../../src/modules/notifications/application/ports.js';
import type { LocalInboxPushSender } from '../../src/modules/notifications/infrastructure/push-senders.js';
import { GUARDIAN_PUSH_SENDER } from '../../src/modules/safety/application/ports/safety.ports.js';
import type { RecordingPushSender } from '../../src/modules/safety/infrastructure/web-push.sender.js';
import { localDay } from '../../src/modules/notifications/domain/time.js';
import { publicCall, type Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { accept, at, checkIn, city, CYCLE, request, v5Person, vote, week, type City } from './support/v5.js';

let w: World;
let c: City;
let [lea, hugo, ines, malo, sarah]: Person[] = [];
const all: Person[] = [];
let outingId = '';
let convId = '';
let guardianToken = '';
const S = story('v5-semaine-de-lea-notifications', 'V5 T8 : la semaine de Léa en notifications');
const H = 3_600_000;
const inbox = () => w.app.get<LocalInboxPushSender>(PUSH_SENDER);
const pushes = (p: Person) => inbox().all().filter((e: DevPushInboxEntry) => e.userId === p.userId);
const bodies = (p: Person) => pushes(p).map((e) => e.body);
/** Le worker : relais outbox (planification) puis livraison, à l'heure du monde. */
const plan = async (d?: Date) => {
  if (d) await at(w, d);
  else await w.drain();
  await w.runJob('notifications.plan');
};
const tick = async (d: Date) => {
  await at(w, d);
  await w.runJob('outings.lifecycle');
  await w.runJob('notifications.plan');
};

beforeAll(async () => {
  w = await startWorld('J_V5_NOTIF', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-notif', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('La semaine de Léa en notifications', () => {
  S.step('Lundi : cinq personnes enregistrent leur téléphone ; la demande de la semaine est posée et rien ne sonne', async () => {
    const specs = [
      ['lea', 'Léa', 'WOMAN', 'Praline'],
      ['hugo', 'Hugo', 'MAN', 'Moka'],
      ['ines', 'Inès', 'WOMAN', 'Luna'],
      ['malo', 'Malo', 'MAN', 'Réglisse'],
      ['sarah', 'Sarah', 'WOMAN', 'Myrtille'],
    ] as const;
    for (const [k, n, g, pet] of specs) all.push(await v5Person(w, { key: `jn.${k}`, displayName: n, gender: g, seeking: [], looking: 'FRIENDS', petName: pet }, c));
    [lea, hugo, ines, malo, sarah] = all;
    for (const [i, p] of all.entries()) expect((await p.call('PUT', '/v1/me/push-token', { token: `ExponentPushToken[jn-phone-${i}-xyzxyzxy]`, platform: i % 2 ? 'android' : 'ios' })).ok).toBe(true);
    const s = await lea!.call('GET', '/v1/me/notifications/settings');
    expect(s.data).toMatchObject({ discreetMode: false, pushRegistered: true, maxPerDay: 3, maxPerOutingDay: 4, maxOutingProposalsPerWeek: 1 });
    for (const p of all) expect((await request(p)).ok).toBe(true);
    await plan(new Date(CYCLE.monday.getTime() + 2 * H));
    for (const p of all) expect(pushes(p), `${p.name} : rien le lundi`).toEqual([]);
  });

  S.step('Mardi 12 h : UNE invitation « Praline t’a trouvé une bande pour jeudi » ; les autres répondent, Léa attend', async () => {
    await at(w, CYCLE.composed);
    await w.runJob('outings.compose');
    outingId = S.need((await week(lea!)).data.myOutingId, 'sortie de la semaine');
    await plan();
    expect(bodies(lea!)).toEqual(['Praline t’a trouvé une bande pour jeudi.']);
    expect(pushes(lea!)[0]).toMatchObject({ title: 'Blowy', data: { key: 'outing.invited', category: 'OUTING', route: `/outings/${outingId}` } });
    for (const p of [hugo!, ines!, malo!, sarah!]) expect((await accept(p, outingId)).ok).toBe(true);
    await plan(new Date(CYCLE.composed.getTime() + H));
    expect(bodies(hugo!)).toContain('Ta bande de jeudi est formée : le chat est ouvert.');
    expect(bodies(lea!).length, 'Léa n’a pas répondu : pas de « formée »').toBe(1);
  });

  S.step('Mercredi 8 h : un seul rappel, sans urgence ; Léa dit « Je viens » ; un message du groupe arrive signé par un pet', async () => {
    await plan(new Date('2026-11-18T07:02:00Z'));
    expect(bodies(lea!).at(-1)).toBe('Ta bande de jeudi attend ta réponse.');
    expect(bodies(hugo!).filter((b) => b.includes('attend ta réponse'))).toEqual([]);
    expect((await accept(lea!, outingId)).ok).toBe(true);
    convId = (await w.db.conversation.findFirstOrThrow({ where: { outingId } })).id;
    await at(w, new Date('2026-11-18T09:00:00Z'));
    expect((await hugo!.say(convId, 'Hâte de jouer jeudi, je ramène mes dés porte-bonheur')).ok).toBe(true);
    await plan(new Date('2026-11-18T09:00:30Z'));
    expect(bodies(lea!).at(-1)).toBe('Nouveau message de Moka.');
    expect(JSON.stringify(inbox().all())).not.toContain('porte-bonheur');
  });

  S.step('Mercredi 18 h (confirmation) : lieu et heure, rappel que l’annulation compte ; Léa envoie un lien à Maud', async () => {
    await tick(CYCLE.locked);
    expect(bodies(lea!).at(-1)).toBe('Ta sortie de jeudi est confirmée : 19 h 30 au Café Paris 11e. Les prénoms de ta bande sont visibles. Annuler compte maintenant comme une absence, sauf ton imprévu du mois ou une raison de sécurité ; l’équipe Blowy est joignable pendant toute ta sortie.');
    const link = await lea!.call('POST', '/v1/safety/guardian-links', { subject: { kind: 'OUTING', id: outingId }, label: 'Maud' });
    expect(link.ok, JSON.stringify(link.data)).toBe(true);
    guardianToken = (link.data.url as string).split('/ange/')[1]!;
    const sub = await publicCall(w, 'POST', `/v1/public/guardian/${guardianToken}/push`, { subscription: { endpoint: 'https://push.example.test/maud' } });
    expect(sub.status).toBe(204);
  });

  S.step('Jeudi : rien avant 16 h 30 ; puis les visages ; à 19 h le check-in ; tout le monde arrive', async () => {
    const n = pushes(lea!).length;
    await plan(new Date('2026-11-19T14:00:00Z'));
    expect(pushes(lea!).length).toBe(n);
    await plan(CYCLE.faces);
    expect(bodies(lea!).at(-1)).toBe('Les visages de ta bande sont visibles. À tout à l’heure, 19 h 30 au Café Paris 11e.');
    await tick(CYCLE.checkin);
    expect(bodies(lea!).at(-1)).toBe('Tu es arrivé·e ? Fais ton check-in au Café Paris 11e.');
    expect(pushes(lea!).at(-1)!.data).toMatchObject({ key: 'outing.checkin_open' });
    for (const p of all) expect((await checkIn(p, outingId)).ok).toBe(true);
  });

  S.step('Jeudi 19 h 40 : « besoin d’aide » passe toujours (hors plafond et heures calmes) ; la page de Maud est prévenue par Web Push', async () => {
    await at(w, new Date('2026-11-19T18:40:00Z'));
    const r = await lea!.call('POST', '/v1/safety/alerts', { subject: { kind: 'OUTING', id: outingId } });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await plan();
    const last = pushes(lea!).at(-1)!;
    expect(last).toMatchObject({ body: 'Ton alerte est envoyée. En cas de danger, appelle le 112.', channelId: 'safety', data: { key: 'safety.alert_sent', category: 'SAFETY' } });
    expect((w.app.get(GUARDIAN_PUSH_SENDER) as RecordingPushSender).sent).toContain('https://push.example.test/maud');
    // Textes seulement (les identifiants aléatoires peuvent contenir « 112 ») — correctif alignement C.
    for (const p of [hugo!, ines!, malo!, sarah!]) expect(JSON.stringify(pushes(p).map((x) => [x.title, x.body]))).not.toMatch(/alerte|\b112\b|aide/i);
    expect((await lea!.call('POST', `/v1/safety/alerts/${r.data.alertId}/resolve`, { status: 'SAFE' })).ok).toBe(true);
  });

  S.step('Jeudi 21 h : « Alors, cette sortie ? » ; Léa et Inès se choisissent ; Hugo ne dit rien', async () => {
    await tick(CYCLE.done);
    expect(bodies(lea!).at(-1)).toBe('Alors, cette sortie ? Dis en secret qui tu aimerais revoir.');
    expect((await vote(lea!, outingId, { [ines!.userId]: 'FRIEND' })).ok).toBe(true);
    expect((await vote(ines!, outingId, { [lea!.userId]: 'FRIEND' })).ok).toBe(true);
  });

  S.step('Vendredi : Léa passe en mode discret (titre « Rappel », textes neutres, icône neutre)', async () => {
    await at(w, new Date('2026-11-20T10:00:00Z'));
    const r = await lea!.call('PUT', '/v1/me/notifications/settings', { discreetMode: true });
    expect(r.data.discreetMode).toBe(true);
  });

  S.step('Dimanche 9 h : le rappel de vote ne va qu’à qui n’a rien dit, sans dire qui a voté', async () => {
    const n = pushes(lea!).length;
    await plan(new Date('2026-11-22T08:01:00Z'));
    expect(pushes(lea!).length, 'Léa a voté : pas de rappel').toBe(n);
    expect(bodies(hugo!).at(-1)).toBe('Tu as encore jusqu’à 21 h pour dire en secret qui tu aimerais revoir.');
    expect(JSON.stringify(pushes(hugo!))).not.toMatch(/Léa|Inès|a voté/);
  });

  S.step('Dimanche 21 h (dépouillement) : Inès lit « Léa rejoint ta bande » ; Léa, en discret, « Tu as du nouveau. »', async () => {
    await tick(CYCLE.votesClosed);
    expect(bodies(ines!).at(-1)).toBe('C’est réciproque : Léa rejoint ta bande.');
    const mine = pushes(lea!).at(-1)!;
    expect(mine).toMatchObject({ title: 'Rappel', body: 'Tu as du nouveau.', channelId: 'discreet', data: { discreet: true, icon: 'neutral' } });
    expect(mine.data.key).toBeUndefined();
    expect(JSON.stringify(mine)).not.toMatch(/Inès|bande|sortie|rencontre/);
    expect(bodies(hugo!).at(-1)).toBe('Les choix sont clos. Moka range ce souvenir.');
  });

  S.step('La semaine d’après, entre deux sorties : un seul type de notification — le message d’Inès', async () => {
    const since = new Date(CYCLE.votesClosed.getTime() + 60_000);
    const band = (await lea!.call('GET', '/v1/band')).data;
    const toInes = band.items.find((i: any) => i.user.firstName === 'Inès');
    S.need(toInes?.conversationId, 'chat de bande Léa–Inès');
    for (let d = 1; d <= 4; d++) {
      await at(w, new Date(CYCLE.votesClosed.getTime() + d * 24 * H - 10 * H));
      for (const j of ['outings.lifecycle', 'duos.lifecycle', 'pets.tick']) await w.runJob(j).catch(() => undefined);
      if (d === 2) expect((await ines!.say(toInes.conversationId, 'On remet ça samedi ?')).ok).toBe(true);
      await plan();
    }
    const sent = await w.db.notification.findMany({ where: { userId: lea!.userId, status: 'SENT', sentAt: { gt: since } } });
    expect(sent.map((n) => n.templateKey)).toEqual(['message.human']);
    expect(pushes(lea!).at(-1)).toMatchObject({ title: 'Rappel', body: 'Tu as du nouveau.' });
  });

  S.step('Bilan : une seule proposition, jamais plus de 3 par jour (4 le jour de la sortie, sécurité en plus), aucun contenu intime stocké', async () => {
    const sent = await w.db.notification.findMany({ where: { userId: lea!.userId, status: 'SENT' }, orderBy: { sentAt: 'asc' } });
    expect(sent.filter((n) => n.templateKey === 'outing.invited' || n.templateKey === 'outing.seeding_invited').length).toBe(1);
    const perDay = new Map<string, number>();
    for (const n of sent.filter((x) => x.category !== 'SAFETY')) perDay.set(n.localDay, (perDay.get(n.localDay) ?? 0) + 1);
    for (const [day, count] of perDay) expect(count, day).toBeLessThanOrEqual(day === localDay(CYCLE.checkin, 'Europe/Paris') ? 4 : 3);
    const dump = JSON.stringify(await w.db.notification.findMany({ where: { userId: { in: all.map((p) => p.userId) } }, select: { data: true, dedupKey: true, groupKey: true } }));
    for (const s of ['porte-bonheur', 'remet ça', 'Café', 'Inès', 'Moka', 'Praline', 'ExponentPushToken', 'lat', 'choice']) expect(dump, s).not.toContain(s);
  });
});
