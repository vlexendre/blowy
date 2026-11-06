/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 1 (V5) — Léa & Hugo, de la rencontre à la rupture. Remplace la version V4 (rendez-vous de pets,
 * jeux, XP de Lien, emménagement, vote de branche, révélation photo par paliers — retirés, 410). Même
 * intention en V5, par la voie Duo (spec §2.13, D-051) : proposition (pet + initiale seulement), double
 * « oui » sans rien trahir, échange écrit modéré (message averti, message rejeté, signalement sans effet
 * sur l'autre), aucun visage ni rendez-vous avant 48 h, visages débloqués en même temps pour les deux,
 * rendez-vous au lieu partenaire, bulletins secrets puis « ensemble », et enfin Hugo part proprement :
 * fin neutre, accès révoqué, aucune pénalité, chacun garde son pet. Chaque étape vérifie ce que voit CHACUN.
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, v5Person, VENUE, type City } from './support/v5.js';

let w: World;
let paris: City;
let lea: Person;
let hugo: Person;
let proposalId = '';
let duoId = '';
let convId = '';
let dateId = '';
const S = story('lea-hugo', 'V5 : Léa & Hugo — voie Duo, échange modéré, visages à 48 h, rendez-vous, départ propre');

const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  lane: new Date('2026-11-16T20:05:00Z'),
  tuesday: new Date('2026-11-17T12:00:00Z'),
  wedBefore: new Date('2026-11-18T19:30:00Z'),
  wedAfter: new Date('2026-11-18T20:20:00Z'),
  dateStarts: '2026-11-19T18:30:00.000Z',
  checkin: new Date('2026-11-19T18:20:00Z'),
  dateDone: new Date('2026-11-19T20:05:00Z'),
  votesClosed: new Date('2026-11-22T20:10:00Z'),
};
const duo = (p: Person) => p.call('GET', `/v1/duos/${duoId}`);
const lane = (p: Person) => p.call('GET', '/v1/duo-lane');
const msgs = async (p: Person) => ((await p.messages(convId)).data as any).items as any[];
const job = async (name: string, d: Date) => {
  await at(w, d);
  await w.runJob(name);
};

beforeAll(async () => {
  w = await startWorld('J_LEA_HUGO', T.monday);
  paris = await city(w, { slug: 'j-paris-lh', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Léa & Hugo (V5)', () => {
  S.step('Léa et Hugo font l’onboarding V5 (18+, intentions secrètes sous consentement, pet, photo, selfie démo)', async () => {
    lea = await v5Person(w, { key: 'lea', displayName: 'Léa', gender: 'WOMAN', seeking: [], looking: 'STORY', romance: ['MAN'], species: 'NINO', petName: 'Nino' }, paris);
    hugo = await v5Person(w, { key: 'hugo', displayName: 'Hugo', gender: 'MAN', seeking: [], looking: 'BOTH', romance: ['WOMAN'], species: 'GASTON', petName: 'Gaston' }, paris);
    const me = await lea.client.me.get();
    expect(me.onboarded).toBe(true);
    expect(me.verification.mode).toBe('LOCAL_DEMO'); // badge de démonstration, jamais « majorité vérifiée »
    expect((await lane(lea)).data).toMatchObject({ items: [], emptyReason: 'WAITING_NEXT_BATCH', quota: { freeMaxActive: 1, unlimited: false } });
  });

  S.step('Lot de 21 h : Hugo est proposé à Léa — son pet et son initiale seulement, un score de vision ; Hugo voit la même proposition', async () => {
    await job('duos.lane', T.lane);
    const l = (await lane(lea)).data.items;
    expect(l).toHaveLength(1);
    proposalId = l[0].proposalId;
    expect(l[0]).toMatchObject({ pet: { name: 'Gaston' }, otherInitial: 'H', acceptedByMe: false });
    expect(l[0].visionScore).toBeGreaterThanOrEqual(0);
    expect(l[0].visionScore).toBeLessThanOrEqual(100);
    expect(JSON.stringify(l[0])).not.toMatch(/Hugo|birth|email|userId|STORY|BOTH|WOMAN|MAN/);
    expect((await lane(hugo)).data.items.map((i: any) => i.proposalId)).toEqual([proposalId]);
  });

  S.step('Léa dit oui : rien ne trahit son choix chez Hugo (acceptedByMe=false, aucun événement)', async () => {
    const before = hugo.phone.events.length;
    expect((await lea.call('POST', `/v1/duo-lane/proposals/${proposalId}/accept`, {})).data).toEqual({ status: 'WAITING_OTHER', duoId: null });
    await w.drain();
    const h = (await lane(hugo)).data;
    expect(h.items[0].acceptedByMe).toBe(false);
    expect(JSON.stringify(h)).not.toMatch(/acceptedByOther|otherAccepted/);
    expect(hugo.phone.events.length).toBe(before);
  });

  S.step('Hugo dit oui : duo en échange pour les deux, prénom et carte complète ; texte d’abord, aucun visage', async () => {
    const r = await hugo.call('POST', `/v1/duo-lane/proposals/${proposalId}/accept`, {});
    expect(r.data.status).toBe('MATCHED');
    duoId = S.need(r.data.duoId, 'duoId');
    await w.drain();
    const vl = (await duo(lea)).data;
    const vh = (await duo(hugo)).data;
    expect(vl).toMatchObject({ status: 'EXCHANGE', other: { firstName: 'Hugo', pet: { name: 'Gaston' } } });
    expect(vh).toMatchObject({ status: 'EXCHANGE', other: { firstName: 'Léa', pet: { name: 'Nino' } } });
    expect(vl.other.photo).toBeUndefined();
    expect(vh.other.photo).toBeUndefined();
    convId = S.need(vl.conversationId, 'conversationId');
  });

  S.step('Léa (qui avait dit oui en premier) est prévenue : notification « duo.matched » aux deux, duo listé chez elle', async () => {
    expect(await w.db.outboxEvent.count({ where: { topic: 'duo.matched', aggregateId: duoId } })).toBe(1);
    expect((await lea.call('GET', '/v1/duos')).data.items.map((d: any) => d.id)).toContain(duoId);
    const e = await lea.phone.waitFor((x) => x.type === 'duo.updated', 500);
    if (!e) S.note('Double oui : aucun événement WS sur la salle `user:` de Léa (seule la salle `duo:` le reçoit) — elle l’apprend par la notification `duo.matched` (T8) ou en rouvrant l’écran.');
  });

  S.step('Les deux rejoignent les salles du duo et de la conversation ; un tiers est refusé', async () => {
    for (const p of [lea, hugo]) {
      expect(await p.phone.join(`duo:${duoId}`)).toBe(true);
      expect(await p.phone.join(`conversation:${convId}`)).toBe(true);
    }
    const intrus = new Person(w, { key: 'intrus.lh', displayName: 'Intrus', gender: 'MAN', seeking: ['WOMAN'] });
    const d = await intrus.device('intrus');
    expect(await d.join(`conversation:${convId}`)).toBe(false);
    expect(await d.join(`duo:${duoId}`)).toBe(false);
    d.disconnect();
  });

  S.step('Chat : Léa écrit ; Hugo ne voit rien avant modération, puis le message publié (HTTP + WS)', async () => {
    const sent = await lea.say(convId, 'Salut Hugo ! Nino adore ton Gaston', 'lea-msg-0001');
    expect(sent.ok).toBe(true);
    expect(sent.data.status).toBe('PENDING_MODERATION');
    expect((await msgs(hugo)).some((m) => m.id === sent.data.id)).toBe(false);
    await w.drain();
    expect((await msgs(hugo)).find((m) => m.id === sent.data.id)).toMatchObject({ status: 'PUBLISHED', body: 'Salut Hugo ! Nino adore ton Gaston', mine: false });
    expect(await hugo.phone.waitFor((e) => e.type === 'message.published')).toBeTruthy();
    expect(await lea.phone.waitFor((e) => e.type === 'message.published' && (e.payload as any)?.message?.mine === true)).toBeTruthy();
  });

  S.step('Hugo répond ; un message est averti (Léa voit un voile, révèle volontairement) et un autre rejeté (invisible)', async () => {
    await hugo.say(convId, 'Haha Gaston aussi, tu connais un bon bar à jeux ?', 'hugo-msg-0001');
    const warned = await hugo.say(convId, 'Tu es vraiment canon [warn]', 'hugo-msg-0002');
    const rejected = await hugo.say(convId, 'message inacceptable [reject]', 'hugo-msg-0003');
    await w.drain();
    const lv = await msgs(lea);
    expect(lv.find((m) => m.id === warned.data.id)).toMatchObject({ status: 'WARNED', body: null, warned: true });
    expect(lv.some((m) => m.id === rejected.data.id)).toBe(false);
    expect(JSON.stringify(lea.phone.events)).not.toContain('inacceptable');
    expect((await msgs(hugo)).find((m) => m.id === rejected.data.id)?.status).toBe('REJECTED');
    expect((await lea.client.conversations.revealWarned(warned.data.id)).body).toContain('canon');
  });

  S.step('Léa signale le message averti : signalement enregistré, Hugo n’en sait rien, sa fiabilité ne bouge pas', async () => {
    const warned = (await msgs(lea)).find((m) => m.warned)!;
    const before = (await hugo.call('GET', '/v1/me/reliability')).data;
    const r = await lea.call('POST', '/v1/reports', { target: { messageId: warned.id }, category: 'INAPPROPRIATE', note: 'remarque sur mon physique' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    expect(r.data.status).toBe('OPEN');
    await w.drain();
    expect((await hugo.call('GET', '/v1/me/reliability')).data).toEqual(before);
    expect((await duo(hugo)).data.status).toBe('EXCHANGE');
    expect(JSON.stringify(hugo.phone.events)).not.toMatch(/report|signal/i);
  });

  S.step('V4 retiré : promener/faire jouer les pets, emménager, révéler sa photo → 410 ; avant 48 h, ni visage ni rendez-vous', async () => {
    const rs = [
      await lea.call('POST', `/v1/pets/${lea.petId}/move`, { destination: 'HOME' }),
      await lea.call('POST', `/v1/pets/${lea.petId}/actions`, { action: 'PLAY' }),
      await lea.call('POST', `/v1/relationships/${duoId}/move-in`, {}),
      await lea.call('POST', `/v1/relationships/${duoId}/photo-reveal`, { scope: 'PHOTO_REVEAL', decision: 'ACCEPT' }),
    ];
    expect(rs.map((r) => `${r.status} ${r.data?.detailsSafe?.reason}`)).toEqual(Array(4).fill('410 RETIRED_IN_V5'));
    const d = await lea.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: T.dateStarts });
    expect([d.status, d.data.detailsSafe?.reason]).toEqual([412, 'DUO_NOT_UNLOCKED']);
  });

  S.step('Le lendemain, chacun écrit encore ; à 47 h rien ne change (déblocage à 48 h, jamais avant)', async () => {
    await at(w, T.tuesday);
    await lea.say(convId, 'Le Café Paris 11e, ça te dit ?', 'lea-msg-0002');
    await hugo.say(convId, 'Parfait, jeudi soir ?', 'hugo-msg-0004');
    await w.drain();
    await job('duos.lifecycle', T.wedBefore);
    const v = (await duo(lea)).data;
    expect(v.status).toBe('EXCHANGE');
    expect(v.other.photo).toBeUndefined();
  });

  S.step('À 48 h : visages débloqués pour les deux en même temps ; « projet compatible » (booléen seulement)', async () => {
    await job('duos.lifecycle', T.wedAfter);
    const l = (await duo(lea)).data;
    const h = (await duo(hugo)).data;
    expect([l.status, h.status]).toEqual(['UNLOCKED', 'UNLOCKED']);
    expect(l.other.photo?.url).toBeTruthy();
    expect(h.other.photo?.url).toBeTruthy();
    expect(JSON.stringify(l)).not.toMatch(/SERIOUS|SEE_HOW_IT_GOES|lookingFor|romance/);
  });

  S.step('Rendez-vous au lieu partenaire : Léa propose, Hugo accepte ; check-in des deux (position jamais renvoyée)', async () => {
    const p = await lea.call('POST', `/v1/duos/${duoId}/dates`, { venueId: paris.venueId, startsAt: T.dateStarts });
    expect(p.data).toMatchObject({ status: 'PROPOSED', proposedByMe: true });
    dateId = p.data.id;
    expect((await hugo.call('POST', `/v1/duos/${duoId}/dates/${dateId}/respond`, { decision: 'ACCEPT' })).data.status).toBe('CONFIRMED');
    await at(w, T.checkin);
    for (const x of [lea, hugo]) {
      const r = await x.call('POST', `/v1/duos/${duoId}/dates/${dateId}/check-in`, { method: 'GEO', ...VENUE, accuracyM: 25 });
      expect(r.data).toEqual({ result: 'ACCEPTED' });
    }
  });

  S.step('Bulletins secrets après le rendez-vous : aucun événement à la saisie ; PLUS/PLUS → « ensemble » à la clôture', async () => {
    await job('duos.lifecycle', T.dateDone);
    const n = hugo.phone.events.length;
    await lea.call('PUT', `/v1/duos/${duoId}/dates/${dateId}/vote`, { choice: 'PLUS' });
    await w.drain();
    expect(hugo.phone.events.slice(n).filter((e) => e.type !== 'pet.updated')).toEqual([]);
    expect((await duo(hugo)).data.currentDate.myVote).toBe('NO');
    await hugo.call('PUT', `/v1/duos/${duoId}/dates/${dateId}/vote`, { choice: 'PLUS' });
    await job('duos.lifecycle', T.votesClosed);
    expect((await duo(lea)).data.status).toBe('TOGETHER');
    expect((await duo(hugo)).data.status).toBe('TOGETHER');
  });

  let leaPet = '';
  S.step('Rupture propre : Hugo part — Léa voit une fin neutre, la conversation se ferme, aucune pénalité', async () => {
    leaPet = (await lea.client.pets.mine()).id;
    const relBefore = (await lea.call('GET', '/v1/me/reliability')).data;
    expect((await hugo.call('POST', `/v1/duos/${duoId}/leave`, {})).data).toEqual({ duoId, status: 'LEFT' });
    await w.drain();
    expect((await duo(lea)).status).toBe(404);
    expect((await lea.say(convId, 'Attends…', 'lea-after-leave')).ok).toBe(false);
    expect(await lea.phone.waitFor((e) => e.type === 'duo.updated' && (e.payload as any).status === 'LEFT')).toBeTruthy();
    expect((await lea.call('GET', '/v1/me/reliability')).data).toEqual(relBefore);
    expect((await hugo.call('GET', '/v1/me/reliability')).data).toMatchObject({ attended: 1, total: 1 });
  });

  S.step('Après la rupture : chacun garde son pet ; le pet de Hugo n’est plus visible ; Léa peut de nouveau être proposée', async () => {
    expect((await lea.client.pets.mine()).id).toBe(leaPet);
    expect((await lea.call('GET', `/v1/pets/${hugo.petId}`)).status).toBe(404);
    expect((await lane(lea)).data.emptyReason).not.toBe('LIMIT_REACHED');
  });
});
