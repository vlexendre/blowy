/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 1 — Léa & Hugo, de la rencontre à la rupture.
 * Léa (Nino) et Hugo (Gaston) s'inscrivent le même lundi matin, se voient proposés, font se
 * rencontrer leurs pets, discutent (modération, message averti, message signalé), font monter le
 * Lien, emménagent, votent en secret, se révèlent leurs photos (avec un refus d'un côté), puis
 * Hugo part proprement. Chaque étape vérifie ce que voit CHACUN (HTTP + WebSocket).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { attempt, Person } from './support/actor.js';
import { forceLevel } from './support/fixtures.js';
import { look, synthImage, upload } from './support/media.js';
import { story } from './support/story.js';
import { DAY, HOUR, startWorld, type World } from './support/world.js';

let w: World;
let lea: Person;
let hugo: Person;
let proposalId = '';
let relId = '';
let convId = '';
const S = story('lea-hugo', 'Léa & Hugo : rencontre → chat → Lien → emménagement → photos → rupture');

beforeAll(async () => {
  w = await startWorld('J_LEA_HUGO');
});
afterAll(async () => w?.close());

const rel = async (p: Person) => (await p.client.relationships.get(relId)) as any;
const msgs = async (p: Person) => ((await p.client.conversations.messages(convId, { limit: 100 })) as any).items as any[];

describe('Léa & Hugo', () => {
  S.step('Léa et Hugo font tout l’onboarding (profil 18+, préférences, consentements, pet, selfie démo) sur leur téléphone', async () => {
    lea = new Person(w, { key: 'lea', displayName: 'Léa', gender: 'WOMAN', seeking: ['MAN'], intention: 'OPEN_TO_MORE', species: 'NINO', petName: 'Nino' });
    hugo = new Person(w, { key: 'hugo', displayName: 'Hugo', gender: 'MAN', seeking: ['WOMAN'], intention: 'LET_IT_HAPPEN', species: 'GASTON', petName: 'Gaston', vision: { axes: { kindMischief: -0.3, sportyContemplative: 0.1, scienceArt: -0.2, homeAdventure: 0.5 }, school: 'POLYTECHNIQUE', sunday: 'BRUNCH', passions: ['MUSIQUE', 'VOYAGE'], limit: 'GHOSTER' } as any });
    await lea.signIn('iphone-lea');
    await hugo.signIn('pixel-hugo');
    await lea.onboard();
    await hugo.onboard();
    await lea.device('iphone-lea');
    await hugo.device('pixel-hugo');
    const me = await lea.client.me.get();
    expect(me.onboarded).toBe(true);
    expect(me.verification.mode).toBe('LOCAL_DEMO'); // badge de démonstration, jamais « majorité vérifiée »
    expect(me.verification.kind).not.toBe('IDENTITY_AGE');
    const hp = await hugo.client.pets.mine();
    expect(hp.location.kind).toBe('HOME');
    expect(hp.gauges).toMatchObject({ satiety: 100, energy: 100, health: 100 });
  });

  S.step('Léa ouvre « Ses rendez-vous » : Hugo lui est proposé avec un score de vision ; Hugo voit la même proposition', async () => {
    const feed = await lea.client.matching.requestOnboardingBatch();
    const p = feed.items.find((i) => i.otherPet.id === hugo.petId);
    expect(p, `lot de Léa : ${JSON.stringify(feed)}`).toBeTruthy();
    proposalId = p!.id;
    expect(p!.visionScore).toBeGreaterThanOrEqual(0);
    expect(p!.visionScore).toBeLessThanOrEqual(100);
    // Le profil proposé est un PublicPetProfile : aucune donnée humaine.
    expect(JSON.stringify(p)).not.toMatch(/birth|email|Hugo|userId/);
    const hf = await hugo.client.matching.feed();
    expect(hf.items.map((i) => i.id)).toContain(proposalId);
  });

  S.step('Léa accepte : rien ne trahit son choix chez Hugo (acceptedByMe=false, aucun événement)', async () => {
    const r = await lea.client.matching.accept(proposalId);
    expect(r.status).toBe('WAITING_OTHER');
    await w.drain();
    const hf = await hugo.client.matching.feed();
    const mine = hf.items.find((i) => i.id === proposalId)!;
    expect(mine.acceptedByMe).toBe(false);
    expect(JSON.stringify(hf)).not.toMatch(/acceptedByOther|otherAccepted/);
    expect(hugo.phone.events).toHaveLength(0);
  });

  S.step('Hugo accepte : relation créée pour les deux, conversation ouverte, pets restés à la maison', async () => {
    const r = await hugo.client.matching.accept(proposalId);
    expect(r.status).toBe('MATCHED');
    relId = S.need(r.relationshipId, 'relationId');
    await w.drain();
    const rl = await rel(lea);
    const rh = await rel(hugo);
    expect(rl.status).toBe('ACTIVE');
    expect(rl.reachedLevel).toBe(1);
    expect(rl.otherPet.id).toBe(hugo.petId);
    expect(rh.otherPet.id).toBe(lea.petId);
    convId = S.need(rl.conversationId, 'conversationId');
    expect((await lea.client.pets.mine()).location.kind).toBe('HOME');
    expect((await hugo.client.pets.mine()).location.kind).toBe('HOME');
    expect(rl.otherPresence).toBe('OUT');
  });

  S.step('Léa (qui avait accepté en premier, app ouverte) est prévenue en temps réel du match', async () => {
    // Elle n'a rejoint aucune room de relation (elle ne la connaissait pas) : seul `user:<id>` peut la prévenir.
    const e = await lea.phone.waitFor((x) => ['match.created', 'relationship.updated'].includes(x.type), 800);
    if (!e) S.note('Match : aucun événement WS sur la room `user:` — la première personne qui a accepté ne découvre le match qu’en rafraîchissant (match.created n’est qu’un événement outbox, jamais projeté).');
    expect(e, 'aucun événement WS reçu par Léa au moment du match').toBeTruthy();
  });

  S.step('Les deux rejoignent les rooms de la relation et de la conversation (autorisées), un tiers est refusé', async () => {
    for (const p of [lea, hugo]) {
      expect(await p.phone.join(`relationship:${relId}`)).toBe(true);
      expect(await p.phone.join(`conversation:${convId}`)).toBe(true);
    }
    const intrus = new Person(w, { key: 'intrus.lh', displayName: 'Intrus', gender: 'MAN', seeking: ['WOMAN'] });
    const d = await intrus.device('intrus');
    expect(await d.join(`conversation:${convId}`)).toBe(false);
    d.disconnect();
  });

  S.step('Rendez-vous de pets : Léa emmène Nino au lieu attitré ; Hugo voit « Nino est là », Léa voit Gaston absent', async () => {
    const before = lea.phone.events.length;
    await lea.client.pets.move(lea.petId, { destination: 'DATE_SPOT', relationshipId: relId });
    await w.drain();
    const rh = await rel(hugo);
    const rl = await rel(lea);
    expect(rh.otherPresence).toBe('HERE');
    expect(rh.myPetHere).toBe(false);
    expect(rl.myPetHere).toBe(true);
    expect(rl.otherPresence).toBe('OUT');
    const ev = await hugo.phone.waitFor((e) => e.type === 'relationship.updated' || e.type === 'pet.updated', 600);
    if (!ev) S.note('Déplacement de pet : l’autre n’est pas notifié en temps réel (aucun événement WS) — le Nid ne se met à jour qu’au rechargement.');
    void before;
  });

  S.step('Hugo rejoint avec Gaston ; ils jouent ensemble (XP de Lien réelle, visible des deux)', async () => {
    await hugo.client.pets.move(hugo.petId, { destination: 'DATE_SPOT', relationshipId: relId });
    const play = await lea.client.pets.act(lea.petId, { action: 'PLAY', relationshipId: relId });
    expect(play.outcome).toBe('APPLIED');
    expect(play.gains.linkXp).toBeGreaterThan(0);
    await w.drain();
    expect((await rel(hugo)).xp).toBeGreaterThan(0);
    expect((await rel(hugo)).xp).toBe((await rel(lea)).xp);
    // Câlin à deux : réservé au niveau 2.
    const hug = await attempt(() => hugo.client.pets.act(hugo.petId, { action: 'HUG', relationshipId: relId }));
    expect(hug.ok).toBe(false);
    expect(hug.status).toBe(412);
  });

  S.step('Chat : Léa écrit ; Hugo ne voit rien avant modération, puis le message publié (HTTP + WS)', async () => {
    const sent = await lea.say(convId, 'Salut Hugo ! Nino adore ton Gaston', 'lea-msg-0001');
    expect(sent.ok).toBe(true);
    expect(sent.data.status).toBe('PENDING_MODERATION');
    expect((await msgs(hugo)).some((m) => m.id === sent.data.id)).toBe(false);
    await w.drain();
    const theirs = (await msgs(hugo)).find((m) => m.id === sent.data.id);
    expect(theirs).toMatchObject({ status: 'PUBLISHED', body: 'Salut Hugo ! Nino adore ton Gaston', mine: false });
    expect(await hugo.phone.waitFor((e) => e.type === 'message.published')).toBeTruthy();
    // L'autrice reçoit aussi la publication de son propre message (mine=true) pour confirmer l'envoi.
    expect(await lea.phone.waitFor((e) => e.type === 'message.published' && (e.payload as any)?.message?.mine === true)).toBeTruthy();
  });

  S.step('Hugo répond, un message est averti (Léa voit un voile, révèle volontairement) et un autre rejeté (invisible)', async () => {
    await hugo.say(convId, 'Haha Gaston aussi, on se refait ça demain ?', 'hugo-msg-0001');
    const warned = await hugo.say(convId, 'Tu es vraiment canon [warn]', 'hugo-msg-0002');
    const rejected = await hugo.say(convId, 'message inacceptable [reject]', 'hugo-msg-0003');
    await w.drain();
    const lv = await msgs(lea);
    const wv = lv.find((m) => m.id === warned.data.id);
    expect(wv).toMatchObject({ status: 'WARNED', body: null, warned: true });
    expect(lv.some((m) => m.id === rejected.data.id)).toBe(false);
    expect(JSON.stringify(lea.phone.events)).not.toContain('inacceptable');
    const own = (await msgs(hugo)).find((m) => m.id === rejected.data.id);
    expect(own?.status).toBe('REJECTED'); // l'auteur sait que son message n'est pas parti
    const revealed = await lea.client.conversations.revealWarned(warned.data.id);
    expect(revealed.body).toContain('canon');
  });

  S.step('Léa signale le message averti : signalement enregistré, Hugo n’en sait rien et sa fiabilité ne bouge pas', async () => {
    const warned = (await msgs(lea)).find((m) => m.warned)!;
    const hugoBefore = await hugo.client.me.get();
    const r = await lea.call('POST', '/v1/reports', { target: { messageId: warned.id }, category: 'INAPPROPRIATE', note: 'remarque sur mon physique' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    expect(r.data.status).toBe('OPEN');
    await w.drain();
    const hugoAfter = await hugo.client.me.get();
    expect(hugoAfter.reliability).toBe(hugoBefore.reliability);
    expect((await rel(hugo)).status).toBe('ACTIVE');
    expect(JSON.stringify(hugo.phone.events)).not.toMatch(/report|signal/i);
    expect((await lea.client.me.get()).reliability).toBe(100);
  });

  S.step('Trois jours de vraie vie : jeux et messages quotidiens ; plafonds respectés (6e jeu sans gain, UI honnête)', async () => {
    const xp0 = (await rel(lea)).xp;
    for (let d = 1; d <= 3; d++) {
      await w.advance(DAY);
      for (let i = 0; i < 5; i++) await lea.client.pets.act(lea.petId, { action: 'PLAY', relationshipId: relId });
      const sixth = await lea.client.pets.act(lea.petId, { action: 'PLAY', relationshipId: relId });
      expect(sixth.gains.linkXp).toBe(0);
      await lea.say(convId, `Bonjour jour ${d} !`, `lea-day-${d}-a`);
      await w.drain();
      await w.advance(2 * HOUR);
      await hugo.say(convId, `Coucou, bonne journée ${d}`, `hugo-day-${d}-a`);
      await w.drain();
    }
    const xp3 = (await rel(lea)).xp;
    expect(xp3).toBeGreaterThan(xp0);
    const perDay = (xp3 - xp0) / 3;
    S.note(`Montée du Lien vécue : ~${perDay.toFixed(1)} XP/jour avec 5 jeux + 1 aller-retour de messages par jour → niveau 3 (500 XP) en ~${Math.ceil(500 / Math.max(perDay, 0.1))} jours, niveau 5 (1400 XP) en ~${Math.ceil(1400 / Math.max(perDay, 0.1))} jours. Les étapes suivantes forcent le niveau (raccourci de test documenté).`);
    expect((await rel(hugo)).xp).toBe(xp3);
  });

  S.step('[raccourci : niveau 3 forcé] Léa propose d’emménager ; Hugo voit l’offre ; il accepte → exclusivité, maison commune, voix', async () => {
    await forceLevel(w, relId, 3);
    const rl = await rel(lea);
    expect(rl.capabilities).toContain('MOVE_IN_PROPOSAL');
    const prop = await lea.client.relationships.proposeMoveIn(relId);
    expect(['PROPOSED', 'WAITING_OTHER']).toContain(prop.status);
    await w.drain();
    const rh = await rel(hugo);
    const offer = rh.pendingOffers.find((o: any) => o.scope === 'MOVE_IN');
    expect(offer).toBeTruthy();
    expect(offer.proposedByMe).toBe(false);
    const done = await hugo.client.relationships.respondOffer(relId, { offerId: offer.id, decision: 'ACCEPT', version: offer.version });
    expect(done.status).toBe('MOVED_IN');
    await w.drain();
    for (const p of [lea, hugo]) {
      const v = await rel(p);
      expect(v.status).toBe('MOVED_IN');
      expect(v.exclusive).toBe(true);
      expect(v.capabilities).toContain('VOICE');
      expect((await p.client.pets.mine()).location.kind).toBe('SHARED_HOME');
    }
    expect(await lea.phone.waitFor((e) => e.type === 'relationship.updated')).toBeTruthy();
  });

  S.step('Vote secret de branche : le vote de Léa est invisible pour Hugo (vue, version, WS) ; à deux « Plus », la branche Plus est publiée', async () => {
    const before = await rel(hugo);
    const evBefore = hugo.phone.events.length;
    expect(before.openBranchRound).toBeTruthy();
    await lea.client.relationships.castBallot(relId, 'PLUS');
    await w.drain();
    const mid = await rel(hugo);
    expect(mid.openBranchRound.myChoice).toBeNull();
    expect(mid.viewVersion).toBe(before.viewVersion);
    expect(mid.branch).toBe('UNDECIDED');
    expect(hugo.phone.events.length).toBe(evBefore);
    expect((await rel(lea)).openBranchRound.myChoice).toBe('PLUS');
    await hugo.client.relationships.castBallot(relId, 'PLUS');
    await w.drain();
    expect((await rel(lea)).branch).toBe('PLUS');
    expect((await rel(hugo)).branch).toBe('PLUS');
  });

  let leaPhoto = '';
  let hugoPhoto = '';
  S.step('Photos de profil déposées ; au niveau 3, aucune photo n’est visible par l’autre (même avec l’identifiant)', async () => {
    leaPhoto = (await upload(lea, { purpose: 'PROFILE_PHOTO', bytes: await synthImage({ color: '#e7a' }) })).id;
    hugoPhoto = (await upload(hugo, { purpose: 'PROFILE_PHOTO', bytes: await synthImage({ color: '#7ae' }) })).id;
    expect((await look(hugo, leaPhoto, 'blurred', relId)).status).toBe(404);
    expect((await look(lea, hugoPhoto, 'thumbnail', relId)).status).toBe(404);
    const early = await lea.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_REVEAL', decision: 'ACCEPT' });
    expect(early.status).toBe(412);
  });

  S.step('[raccourci : niveau 4] Léa propose la révélation ; tant que Hugo n’a pas accepté, rien ; après son accord : flou seulement, pour les deux en même temps', async () => {
    await forceLevel(w, relId, 4);
    const r1 = await lea.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_REVEAL', decision: 'ACCEPT' });
    expect(r1.data.status).toBe('OPEN');
    expect((await look(hugo, leaPhoto, 'blurred', relId)).status).toBe(404);
    expect((await look(lea, hugoPhoto, 'blurred', relId)).status).toBe(404);
    const hs = await hugo.call('GET', `/v1/relationships/${relId}/photo-reveal?scope=PHOTO_REVEAL`);
    expect(hs.ok).toBe(true);
    if (hs.data?.status !== 'OPEN') S.note('Révélation : Hugo ne voit pas l’offre ouverte de Léa via GET photo-reveal (pas de « Léa propose de se dévoiler, accepter ? »).');
    const r2 = await hugo.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_REVEAL', decision: 'ACCEPT' });
    expect(r2.data).toMatchObject({ status: 'ACCEPTED', otherVariant: 'blurred' });
    const seenByHugo = await look(hugo, leaPhoto, 'normalized', relId);
    const seenByLea = await look(lea, hugoPhoto, 'normalized', relId);
    expect(seenByHugo.status).toBe(200);
    expect(seenByLea.status).toBe(200);
    expect(seenByHugo.width).toBeLessThanOrEqual(320); // flou dégradé, jamais l'original
    expect(seenByLea.width).toBeLessThanOrEqual(320);
  });

  S.step('[raccourci : niveau 5] Original : Léa accepte, Hugo refuse → Léa reste au flou, Hugo aussi ; le refus ne coupe pas la relation', async () => {
    await forceLevel(w, relId, 5);
    const r1 = await lea.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_ORIGINAL', decision: 'ACCEPT' });
    expect(r1.ok, JSON.stringify(r1.data)).toBe(true);
    const r2 = await hugo.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_ORIGINAL', decision: 'DECLINE' });
    expect(r2.ok, JSON.stringify(r2.data)).toBe(true);
    expect(r2.data.status).toBe('DECLINED');
    expect((await look(lea, hugoPhoto, 'normalized', relId)).width).toBeLessThanOrEqual(320);
    expect((await look(hugo, leaPhoto, 'normalized', relId)).width).toBeLessThanOrEqual(320);
    expect((await rel(lea)).status).toBe('MOVED_IN');
    const ls = await lea.call('GET', `/v1/relationships/${relId}/photo-reveal?scope=PHOTO_ORIGINAL`);
    expect(ls.data.status).toBe('DECLINED');
  });

  S.step('Quelques jours plus tard, nouvelle demande : les deux acceptent → originaux visibles des deux côtés', async () => {
    await w.advance(2 * DAY);
    await hugo.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_ORIGINAL', decision: 'ACCEPT' });
    const r = await lea.call('POST', `/v1/relationships/${relId}/photo-reveal`, { scope: 'PHOTO_ORIGINAL', decision: 'ACCEPT' });
    expect(r.data).toMatchObject({ status: 'ACCEPTED', otherVariant: 'normalized' });
    expect((await look(lea, hugoPhoto, 'normalized', relId)).width).toBe(800);
    expect((await look(hugo, leaPhoto, 'normalized', relId)).width).toBe(800);
  });

  S.step('[raccourci : niveau 6] Les capacités annoncent « rendez-vous en vrai » et « ange gardien »…', async () => {
    await forceLevel(w, relId, 6);
    const caps = (await rel(lea)).capabilities;
    expect(caps).toEqual(expect.arrayContaining(['IRL_DATE', 'GUARDIAN']));
    const probe = await lea.call('POST', '/v1/safety-dates', { relationshipId: relId });
    if (probe.status === 404) S.note('Niveau 6 Plus : l’app annonce IRL_DATE + GUARDIAN dans les capacités, mais aucune route /safety-dates ni /guardian-invitations n’existe → l’utilisateur voit un palier débloqué qu’il ne peut pas utiliser.');
  });
  S.absent('Rendez-vous en vrai : proposition de lieu public, confirmation des deux, check-in, confirmation après coup', 'aucune route /v1/safety-dates (§11, §13)');
  S.absent('Ange gardien : invitation d’un ami du Quartier, partage de position 3 h max, révocation', 'aucune route /v1/guardian-invitations ni partage de position (§11)');

  let leaPetXpBefore = -1;
  S.step('Rupture propre : Hugo part ; Léa voit la fin (statut, message système pré-écrit, conversation fermée, WS) sans pénalité', async () => {
    const leaRel0 = (await lea.client.me.get()).reliability;
    leaPetXpBefore = (await lea.client.pets.mine()).petXp;
    const left = await hugo.client.relationships.leave(relId, 'CLEAN_LEAVE');
    expect(left.status).toBe('ENDED');
    await w.drain();
    const lv = await attempt(() => lea.client.relationships.get(relId));
    if (lv.ok) expect((lv.data as any).status).toBe('ENDED');
    const listed = await lea.client.relationships.list(true);
    expect(listed.items.find((r) => r.id === relId)?.status).toBe('ENDED');
    expect((await lea.client.relationships.list()).items.some((r) => r.id === relId)).toBe(false);
    const conv = (await lea.client.conversations.list()).items.find((c) => c.id === convId);
    if (conv) expect(conv.canSend).toBe(false);
    const after = await lea.say(convId, 'Attends…', 'lea-after-leave');
    expect(after.ok).toBe(false);
    expect(lea.phone.revoked).toEqual(expect.arrayContaining([`conversation:${convId}`]));
    const sys = await attempt(() => lea.client.conversations.messages(convId));
    if (!sys.ok) S.note('Après une rupture, Léa ne peut plus relire la conversation (404) : le message système « départ propre » n’est jamais visible pour elle, l’historique disparaît d’un coup.');
    else expect((sys.data as any).items.some((m: any) => m.systemTemplate === 'system.leave.clean')).toBe(true);
    expect((await lea.client.me.get()).reliability).toBe(leaRel0);
    expect((await hugo.client.me.get()).reliability).toBe(100);
  });

  S.step('Léa reçoit bien l’événement « relation terminée » sur son téléphone avant la révocation de la room', async () => {
    const e = await lea.phone.waitFor((x) => x.type === 'relationship.ended', 800);
    if (!e) S.note('WS : `relationship.ended` est projeté dans la room de relation, mais `realtime.revoke` retire la socket de cette room dans la même vague → Léa ne reçoit jamais l’événement en direct ; elle apprend la rupture en rechargeant.');
    expect(e).toBeTruthy();
  });

  S.step('Garde des pets après la rupture : chacun garde le sien, rentré à la maison, XP de pet conservée ; Léa redevient proposable', async () => {
    const lp = await lea.client.pets.mine();
    const hp = await hugo.client.pets.mine();
    expect(lp.location.kind).toBe('HOME');
    expect(hp.location.kind).toBe('HOME');
    expect(lp.petXp).toBe(leaPetXpBefore);
    expect(lp.id).toBe(lea.petId);
    // Le pet de Hugo n'est plus visible par Léa.
    const seen = await lea.call('GET', `/v1/pets/${hugo.petId}`);
    expect(seen.status).toBe(404);
    const feed = await lea.client.matching.feed();
    expect(feed.emptyReason).not.toBe('EXCLUSIVE');
  });
  S.absent('Garde d’un bébé commun après rupture (alternance hebdo, transition, sécurité)', 'aucun module œuf/bébé/garde : routes /eggs, /incubation, /children, /custody absentes (§8)');
});
