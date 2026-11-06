/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 3 — Le Quartier d'Alex. Alex partage sa carte « Décris-moi en 3 mots » et son lien
 * d'invitation. Sam, Zoé et Malik répondent depuis le web sans compte, puis s'inscrivent avec
 * le lien (ou le code de repli). Parrainage +100/+100 une seule fois après activation.
 * V5 (retrait V4, §7.7) : la « 1ʳᵉ action » qui active le parrainage n'est plus un soin du pet (410) mais
 * la 1ʳᵉ sortie vécue (spec §5, `referral.first_outing_lived`) : Alex et ses trois filleul·es sortent
 * ensemble un jeudi soir, puis les récompenses tombent une seule fois. « Qui a écrit ? » est retiré (410).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { Person, publicCall, visitorToken } from './support/actor.js';
import { forcePublicSlug } from './support/fixtures.js';
import { story } from './support/story.js';
import { MIN, startWorld, type World } from './support/world.js';
import { at, checkIn, city, CYCLE, formOuting, v5Person, v5Setup, type City } from './support/v5.js';

let w: World;
let alex: Person;
const friends: Person[] = [];
let link: any = null;
let slug = '';
let c: City;
let outingId = '';
let nina: Person | null = null;
const S = story('quartier', 'Quartier : invitation, 3 mots anonymes, parrainage, amis, ligue');

beforeAll(async () => {
  w = await startWorld('J_QUARTIER', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-quartier', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

const wallet = async (p: Person) => (await p.call('GET', '/v1/wallet')).data as any;

describe('Quartier', () => {
  S.step('Alex s’inscrit et crée son lien d’invitation (jeton signé + code court de repli)', async () => {
    alex = new Person(w, { key: 'alex.q', displayName: 'Alex', gender: 'MAN', seeking: ['WOMAN'], intention: 'FRIENDS_GROUP', species: 'NINO', petName: 'Nino' });
    await alex.onboard();
    await alex.device('alex-phone');
    const r = await alex.call('POST', '/v1/referrals/link', {});
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    link = r.data;
    expect(link.url).toContain('/invite/');
    expect(link.code).toMatch(/^[A-Za-z0-9_.-]{4,}$/);
    expect(link.url).not.toContain(alex.userId);
  });

  S.step('Un ami ouvre le lien sur le web : « Alex t’attend », 100 pièces annoncées, aucun identifiant interne', async () => {
    const prev = await publicCall(w, 'GET', `/v1/public/invites/${link.token}`);
    expect(prev.status).toBe(200);
    expect(prev.body).toMatchObject({ valid: true, inviter: { displayName: 'Alex' }, rewardCoins: { referrer: 100, referee: 100 } });
    expect(JSON.stringify(prev.body)).not.toContain(alex.userId);
  });

  S.step('Alex active sa page publique « Décris-moi en 3 mots » depuis l’app et obtient son lien blowy.app/<slug>', async () => {
    const on = await alex.call('PUT', '/v1/me/public-page', { enabled: true });
    expect(on.ok, JSON.stringify(on.data)).toBe(true);
    const page = await alex.call('GET', '/v1/me/anonymous-responses');
    slug = on.data?.slug ?? page.data?.page?.slug ?? '';
    if (!slug) S.note('Page « 3 mots » : aucune route n’attribue de slug public à un nouvel utilisateur (PUT /me/public-page ne fait qu’activer un slug existant ; seul le seed en pose). Un vrai Alex n’a donc jamais de lien à partager → la boucle virale §15 est coupée à la source. Les étapes suivantes posent le slug en base (raccourci de test).');
    expect(slug, 'slug public attribué').toBeTruthy();
  });

  S.step('Sam, Zoé et Malik répondent depuis le web sans compte (1 à 3 mots parmi 12) ; texte libre et 4 mots refusés', async () => {
    if (!slug) {
      slug = 'alex-quartier';
      await forcePublicSlug(w, alex.userId, slug);
    }
    const answers = [['SOLAIRE', 'DROLE'], ['LOYAL'], ['FIABLE', 'SOLAIRE', 'APAISANT']];
    for (const [i, words] of answers.entries()) {
      const v = visitorToken();
      const page = await publicCall(w, 'GET', `/v1/public/profiles/${slug}`, undefined, { 'x-blowy-visitor': v });
      expect(page.status).toBe(200);
      expect(page.body.words).toHaveLength(12);
      expect(JSON.stringify(page.body)).not.toMatch(new RegExp(`${alex.userId}|birth|email`));
      if (i === 0) {
        const bad = await publicCall(w, 'POST', `/v1/public/profiles/${slug}/responses`, { words: ['DROLE', 'LOYAL', 'SOLAIRE', 'FIABLE'], formToken: page.body.formToken, visitorToken: v });
        expect(bad.status).toBe(400);
        const free = await publicCall(w, 'POST', `/v1/public/profiles/${slug}/responses`, { words: ['MECHANT'], formToken: page.body.formToken, visitorToken: v });
        expect(free.status).toBe(400);
      }
      const ok = await publicCall(w, 'POST', `/v1/public/profiles/${slug}/responses`, { words, formToken: page.body.formToken, visitorToken: v });
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      expect(ok.body.status).toBe('RECORDED');
      // Rechargement de la page par le même visiteur : pas de 2e réponse (réputation non farmable).
      const again = await publicCall(w, 'GET', `/v1/public/profiles/${slug}`, undefined, { 'x-blowy-visitor': v });
      const dup = await publicCall(w, 'POST', `/v1/public/profiles/${slug}/responses`, { words: ['DROLE'], formToken: again.body.formToken, visitorToken: v });
      expect(dup.body.status).toBe('ALREADY_ANSWERED');
    }
  });

  S.step('Alex lit ses mots dans l’app (3 réponses, aucune identité) ; « Qui a écrit ? » n’invente aucun indice', async () => {
    await w.drain();
    const own = await alex.call('GET', '/v1/me/anonymous-responses');
    expect(own.data.items).toHaveLength(3);
    expect(JSON.stringify(own.data)).not.toMatch(/visitor|ip|fingerprint/i);
    // V5 (§7.7) : « Qui a écrit ? » est retiré — 410, aucun indice ne peut être inventé.
    const hints = await alex.call('GET', `/v1/me/anonymous-responses/${own.data.items[0].id}/hints`);
    expect([hints.status, hints.data.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);
    const ws = alex.phone.events.filter((e) => /anonymous|response|social/.test(e.type));
    if (ws.length === 0) S.note('Réponses « 3 mots » : aucun événement temps réel ni notification pour Alex ; il ne découvre les mots qu’en ouvrant l’écran.');
  });

  S.step('Sam s’inscrit avec le CODE court (lien perdu à l’installation) : claim en attente, aucune pièce au clic', async () => {
    const sam = new Person(w, { key: 'sam.q', displayName: 'Sam', gender: 'WOMAN', seeking: ['MAN'], intention: 'FRIENDS_GROUP', species: 'GASTON', petName: 'Pépite' });
    await sam.signIn('sam-phone');
    const c = await sam.call('POST', '/v1/referrals/claim', { ref: link.code });
    expect(c.ok, JSON.stringify(c.data)).toBe(true);
    expect(c.data.status).toBe('PENDING_ACTIVATION');
    await w.drain();
    expect((await wallet(alex)).balance).toBe(0);
    friends.push(sam);
  });

  S.step('Sam termine l’onboarding V5 (quartier, intentions, photo) : soigner son pet n’existe plus (410) ; toujours aucune pièce', async () => {
    const sam = S.need(friends[0], 'Sam');
    await sam.onboard();
    await v5Setup(sam, { ...sam.spec, looking: 'FRIENDS' }, c);
    expect((await sam.call('POST', `/v1/pets/${sam.petId}/actions`, { action: 'FEED' })).status).toBe(410);
    await w.drain();
    expect((await wallet(sam)).balance).toBe(0);
    expect((await wallet(alex)).balance).toBe(0);
    expect((await sam.call('GET', '/v1/referrals/me')).data.status).toBe('PENDING_ACTIVATION');
    expect((await sam.call('POST', '/v1/referrals/claim', { ref: link.token })).status).toBe(409);
  });

  S.step('Alex essaie de se parrainer lui-même : refusé', async () => {
    const r = await alex.call('POST', '/v1/referrals/claim', { ref: link.token });
    expect(r.ok).toBe(false);
    expect([403, 412]).toContain(r.status);
  });

  S.step('Zoé et Malik arrivent aussi par le lien (claims en attente) ; Nina, une voisine, s’inscrit sans lien', async () => {
    for (const key of ['zoe.q', 'malik.q']) {
      w.clock.advance(MIN);
      const p = new Person(w, { key, displayName: key === 'zoe.q' ? 'Zoé' : 'Malik', gender: key === 'zoe.q' ? 'WOMAN' : 'MAN', seeking: ['WOMAN', 'MAN'], intention: 'FRIENDS_GROUP' });
      await p.signIn();
      expect((await p.call('POST', '/v1/referrals/claim', { ref: link.token })).ok).toBe(true);
      await p.onboard();
      await v5Setup(p, { ...p.spec, looking: 'FRIENDS' }, c);
      friends.push(p);
    }
    nina = await v5Person(w, { key: 'nina.q', displayName: 'Nina', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Plume' }, c);
    await v5Setup(alex, { ...alex.spec, looking: 'FRIENDS' }, c);
    await w.drain();
    expect((await wallet(alex)).balance).toBe(0);
  });

  S.step('V5 : ils sortent ensemble un jeudi soir (composition, « Je viens », check-in) — la 1ʳᵉ sortie vécue active chaque parrainage, une seule fois', async () => {
    outingId = await formOuting(w, [alex, ...friends, nina!]);
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    for (const p of [alex, ...friends, nina!]) expect((await checkIn(p, outingId)).ok, p.name).toBe(true);
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    await w.drain();
    await w.drain();
    for (const p of friends) {
      expect((await wallet(p)).balance, p.name).toBe(100);
      expect((await p.call('GET', '/v1/referrals/me')).data.status).toBe('REWARDED');
    }
    expect((await wallet(alex)).balance).toBe(300);
    const hist = (await wallet(alex)).history.items.map((e: any) => e.reason);
    expect(hist.filter((r: string) => r === 'REFERRAL_REFERRER')).toHaveLength(3);
    // Rejeu du filet d'activation : aucun doublon ; Nina (sans lien) ne crédite personne.
    await w.runJob('social.referral_activation');
    await w.drain();
    expect((await wallet(alex)).balance).toBe(300);
    expect((await wallet(nina!)).balance).toBe(0);
  });

  S.note('Après une invitation réussie (« Alex t’attend dans son Quartier »), rien ne relie Alex et ses filleuls : aucune amitié créée, aucune route /friends. L’accueil personnalisé promet un Quartier qui n’existe pas côté API.');
  S.absent('Invitations Quartier signées/expirables, acceptation, liste d’amis, retrait discret', 'aucune route /v1/friends (§8, §13)');
  S.absent('Bande de 3 à 5 amis, chat de groupe, mission de groupe ≥ 3', 'aucune route /v1/groups (§8)');
  S.absent('Ligue hebdomadaire (classement, promotion, récompense du dimanche 23 h 59)', 'aucune route /v1/league ni job de saison (§8, §17)');

  S.step('Sam tente de nourrir le pet d’Alex (geste V4 retiré : 410) ; en V5, offrir un accessoire n’est possible qu’au sein de sa bande', async () => {
    const sam = S.need(friends[0], 'Sam');
    const r = await sam.call('POST', `/v1/pets/${alex.petId}/actions`, { action: 'FEED' });
    expect([r.status, r.data.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);
    const g = await sam.call('POST', '/v1/band/street/gifts', { linkId: '0190b6a2-0000-7000-8000-000000000001', accessoryId: 'scarf_red' });
    expect(g.ok).toBe(false);
    expect([400, 404, 412]).toContain(g.status);
  });

  S.step('Alex masque une réponse, en signale une autre, puis désactive sa page : le web ne la sert plus', async () => {
    const own = await alex.call('GET', '/v1/me/anonymous-responses');
    const [a, b] = own.data.items;
    expect((await alex.call('POST', `/v1/me/anonymous-responses/${a.id}/hide`, {})).ok).toBe(true);
    expect((await alex.call('POST', `/v1/me/anonymous-responses/${b.id}/report`, {})).ok).toBe(true);
    const after = await alex.call('GET', '/v1/me/anonymous-responses');
    expect(after.data.items.find((x: any) => x.id === a.id)?.hidden).toBe(true);
    expect(after.data.items.find((x: any) => x.id === b.id)?.reported).toBe(true);
    expect((await alex.call('PUT', '/v1/me/public-page', { enabled: false })).ok).toBe(true);
    const v = visitorToken();
    const pub = await publicCall(w, 'GET', `/v1/public/profiles/${slug}`, undefined, { 'x-blowy-visitor': v });
    if (pub.status === 200) S.note(`Page « 3 mots » désactivée : GET /public/profiles/${slug} répond toujours 200 (prénom + pet publics, acceptingResponses=${pub.body?.acceptingResponses}) ; seul l’envoi est refusé. « Désactiver ma page » ne la retire pas du web.`);
    if (pub.status === 200) {
      const post = await publicCall(w, 'POST', `/v1/public/profiles/${slug}/responses`, { words: ['DROLE'], formToken: pub.body.formToken, visitorToken: v });
      expect(post.status).not.toBe(200);
    }
    expect(pub.status).toBe(404);
  });
});
