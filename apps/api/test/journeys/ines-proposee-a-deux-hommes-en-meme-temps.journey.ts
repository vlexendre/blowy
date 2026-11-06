/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 2 — Le triangle. Inès est proposée en même temps à Karim et à Théo.
 * Gratuit : un seul rendez-vous ; Blowy+ (démo locale) : trois. Puis Inès arrive au niveau 3 avec
 * les deux et propose d'emménager aux deux : ils acceptent à la même seconde. Une seule
 * exclusivité doit naître ; l'autre reçoit un mot gentil pré-écrit. Que voit chacun ?
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { attempt, cast, type Person } from './support/actor.js';
import { forceLevel } from './support/fixtures.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';

let w: World;
let ines: Person;
let karim: Person;
let theo: Person;
let pK = '';
let pT = '';
let relK = '';
let relT = '';
const S = story('triangle', 'Triangle : Inès, Karim et Théo (créneaux, Blowy+, exclusivité)');

beforeAll(async () => {
  w = await startWorld('J_TRIANGLE');
});
afterAll(async () => w?.close());

describe('Triangle', () => {
  S.step('Inès, Karim et Théo s’inscrivent dans le même quartier', async () => {
    [ines, karim, theo] = await cast(w, [
      { key: 'ines', displayName: 'Inès', gender: 'WOMAN', seeking: ['MAN'], intention: 'OPEN_TO_MORE', species: 'NINO', petName: 'Nina' },
      { key: 'karim', displayName: 'Karim', gender: 'MAN', seeking: ['WOMAN'], species: 'GASTON', petName: 'Gus' },
      { key: 'theo', displayName: 'Théo', gender: 'MAN', seeking: ['WOMAN'], species: 'NINO', petName: 'Tino' },
    ]);
    for (const p of [ines, karim, theo]) await p.device(`${p.spec.key}-phone`);
  });

  S.step('Inès reçoit son premier lot : Karim et Théo ; chacun d’eux voit Inès, sans savoir qu’elle est proposée à l’autre', async () => {
    const feed = await ines.client.matching.requestOnboardingBatch();
    pK = feed.items.find((i) => i.otherPet.id === karim.petId)?.id ?? '';
    pT = feed.items.find((i) => i.otherPet.id === theo.petId)?.id ?? '';
    expect(pK, JSON.stringify(feed)).toBeTruthy();
    expect(pT).toBeTruthy();
    const fk = await karim.client.matching.feed();
    const ft = await theo.client.matching.feed();
    expect(fk.items.map((i) => i.id)).toContain(pK);
    expect(ft.items.map((i) => i.id)).toContain(pT);
    expect(JSON.stringify(fk)).not.toContain(theo.petId);
    expect(JSON.stringify(ft)).not.toContain(karim.petId);
  });

  S.step('En gratuit, l’app annonce honnêtement « 1 rendez-vous » à Inès', async () => {
    const sub = await ines.call('GET', '/v1/subscriptions/me');
    expect(sub.data.dateSlots).toBe(1);
    expect(sub.data.state).toBe('NONE');
  });

  S.step('Inès accepte les deux ; Karim accepte → match. Théo accepte ensuite → refus de capacité, sans apprendre qu’Inès a quelqu’un', async () => {
    await ines.client.matching.accept(pK);
    const second = await attempt(() => ines.client.matching.accept(pT));
    if (!second.ok) S.note(`Inès (gratuit) ne peut même pas « accepter » la 2e proposition : ${second.status} ${second.code}.`);
    const rk = await karim.client.matching.accept(pK);
    expect(rk.status).toBe('MATCHED');
    relK = rk.relationshipId!;
    const rt = await attempt(() => theo.client.matching.accept(pT));
    expect(rt.ok).toBe(false);
    expect(rt.status).toBe(409);
    expect(rt.code).toBe('CAPACITY_EXCEEDED');
    const leaked = JSON.stringify(rt.data);
    if (/OTHER|PARTNER|COUNTERPART/i.test(leaked)) S.note(`Théo reçoit un motif qui révèle que c’est l’AUTRE qui est complet (${leaked}) : il déduit qu’Inès a déjà un rendez-vous.`);
    // Que voit Théo ensuite ? La proposition reste-t-elle « acceptée » sans issue ?
    const ft = await theo.client.matching.feed();
    const still = ft.items.find((i) => i.id === pT);
    const row = await w.db.matchProposal.findUnique({ where: { id: pT } });
    if (still) S.note(`Après le refus « Cette rencontre n’est plus disponible », Théo voit toujours la proposition d’Inès (acceptedByMe=${still.acceptedByMe}, statut en base ${row?.status}) : le passage à INVALIDATED est fait DANS la transaction qui lève ensuite l’erreur → annulé par le rollback. Théo peut retaper « accepter » indéfiniment.`);
    expect(still, 'proposition « plus disponible » toujours affichée').toBeUndefined();
  });

  S.step('Inès passe Blowy+ (démo locale étiquetée) : 3 rendez-vous ; Théo réessaie → match', async () => {
    const sub = await ines.call('POST', '/v1/purchases/local-demo', { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' });
    expect(sub.ok, JSON.stringify(sub.data)).toBe(true);
    expect(sub.data.subscription).toMatchObject({ mode: 'LOCAL_DEMO', state: 'ACTIVE', dateSlots: 3 });
    // Si l'ancienne proposition est encore ouverte, Théo réessaie ; sinon Inès redemande un lot.
    let pid = pT;
    if ((await w.db.matchProposal.findUnique({ where: { id: pT } }))?.status !== 'OPEN') {
      const f = await ines.client.matching.requestOnboardingBatch();
      pid = S.need(f.items.find((i) => i.otherPet.id === theo.petId)?.id, 'nouvelle proposition Inès↔Théo');
      await ines.client.matching.accept(pid);
    }
    const rt = await attempt(() => theo.client.matching.accept(pid));
    expect(rt.ok, JSON.stringify(rt.data)).toBe(true);
    expect((rt.data as any).status).toBe('MATCHED');
    relT = (rt.data as any).relationshipId;
    const list = await ines.client.relationships.list();
    expect(list.items.map((r) => r.id).sort()).toEqual([relK, relT].sort());
    // Chaque téléphone suit sa (ses) relation(s), comme l'app.
    for (const [p, id] of [[ines, relK], [ines, relT], [karim, relK], [theo, relT]] as const) expect(await p.phone.join(`relationship:${id}`)).toBe(true);
  });

  S.step('Karim ne voit rien de Théo et inversement (relations, pets, conversations)', async () => {
    const kl = await karim.client.relationships.list();
    expect(kl.items).toHaveLength(1);
    expect(JSON.stringify(kl)).not.toContain(theo.petId);
    expect((await karim.call('GET', `/v1/pets/${theo.petId}`)).status).toBe(404);
    expect((await theo.call('GET', `/v1/relationships/${relK}`)).status).toBe(404);
    const convK = (await karim.client.relationships.get(relK)).conversationId!;
    expect((await theo.call('GET', `/v1/conversations/${convK}/messages`)).status).toBe(404);
  });

  S.step('Inès emmène son pet au rendez-vous de Karim : Théo ne voit qu’un « absent », jamais où il est', async () => {
    await ines.client.pets.move(ines.petId, { destination: 'DATE_SPOT', relationshipId: relK });
    await w.drain();
    const vt = await theo.client.relationships.get(relT);
    expect(vt.otherPresence).toBe('OUT');
    expect(JSON.stringify(vt)).not.toContain(relK);
    expect(JSON.stringify(theo.phone.events)).not.toContain(relK);
  });

  S.step('[raccourci : niveau 3 avec les deux] Inès propose d’emménager aux deux ; Karim et Théo acceptent à la même seconde → une seule exclusivité', async () => {
    await forceLevel(w, relK, 3);
    await forceLevel(w, relT, 3);
    const a = await attempt(() => ines.client.relationships.proposeMoveIn(relK));
    const b = await attempt(() => ines.client.relationships.proposeMoveIn(relT));
    expect(a.ok, JSON.stringify(a.data)).toBe(true);
    if (!b.ok) S.note(`Inès ne peut pas proposer d’emménager à deux personnes à la fois (${b.status} ${b.code}).`);
    const offK = (await karim.client.relationships.get(relK)).pendingOffers.find((o) => o.scope === 'MOVE_IN');
    const offT = b.ok ? (await theo.client.relationships.get(relT)).pendingOffers.find((o) => o.scope === 'MOVE_IN') : null;
    const results = await Promise.all([
      attempt(() => karim.client.relationships.respondOffer(relK, { offerId: offK!.id, decision: 'ACCEPT', version: offK!.version })),
      offT ? attempt(() => theo.client.relationships.respondOffer(relT, { offerId: offT.id, decision: 'ACCEPT', version: offT.version })) : Promise.resolve(null),
    ]);
    await w.drain();
    const statuses = await Promise.all([relK, relT].map(async (id) => (await ines.call('GET', `/v1/relationships/${id}`)).data?.status ?? 'GONE'));
    expect(statuses.filter((s) => s === 'MOVED_IN')).toHaveLength(1);
    const exclusive = await w.db.relationshipSide.count({ where: { userId: ines.userId, exclusive: true, active: true } });
    expect(exclusive).toBe(1);
    S.note(`Course d’emménagement : réponses ${results.map((r) => (r ? (r.ok ? (r.data as any).status : `${r.status} ${r.code}`) : '—')).join(' / ')} ; statuts finaux ${statuses.join(' / ')}.`);
  });

  S.step('Le perdant voit la fin de son rendez-vous avec le mot gentil pré-écrit (message système, pas la voix d’Inès)', async () => {
    const kStatus = (await ines.call('GET', `/v1/relationships/${relK}`)).data?.status;
    const [loser, loserRel] = kStatus === 'MOVED_IN' ? [theo, relT] : [karim, relK];
    const lv = await loser.client.relationships.list(true);
    expect(lv.items.find((r) => r.id === loserRel)?.status).toBe('ENDED');
    const conv = lv.items.find((r) => r.id === loserRel)?.conversationId;
    const m = conv ? await attempt(() => loser.client.conversations.messages(conv)) : null;
    if (!m?.ok) S.note('Le perdant de l’emménagement ne peut pas lire le message système « moved_in_elsewhere » : la conversation lui renvoie 404 dès la fin de la relation. Le « mot gentil » promis par le cahier des charges n’est donc jamais lisible.');
    else {
      const sys = (m.data as any).items.filter((x: any) => x.kind === 'SYSTEM');
      expect(sys.some((x: any) => x.systemTemplate === 'system.leave.moved_in_elsewhere')).toBe(true);
    }
    expect(await loser.phone.waitFor((e) => e.type === 'relationship.ended', 600)).toBeTruthy();
  });

  S.step('Inès emménagée : plus aucune nouvelle proposition, même avec 3 créneaux Blowy+', async () => {
    const f = await ines.client.matching.feed();
    expect(f.items.filter((i) => !i.acceptedByMe)).toHaveLength(0);
    if (f.emptyReason !== 'EXCLUSIVE') S.note(`Inès emménagée voit « ${f.emptyReason} » (attends le prochain lot) au lieu de « EXCLUSIVE » : l’app lui fait attendre un lot qui ne viendra jamais.`);
    expect(f.emptyReason).toBe('EXCLUSIVE');
    const again = await ines.client.matching.requestOnboardingBatch().catch((e) => e);
    expect(JSON.stringify(again)).not.toMatch(/"kind":"(STRONG|DISCOVERY|ONBOARDING)"/);
  });

  S.step('Le gagnant reçoit les droits Blowy+ dérivés d’Inès (partenaire emménagé), non transférables', async () => {
    const kStatus = (await ines.call('GET', `/v1/relationships/${relK}`)).data?.status;
    const winner = kStatus === 'MOVED_IN' ? karim : theo;
    await w.drain();
    const sub = await winner.call('GET', '/v1/subscriptions/me');
    expect(sub.data.entitlements.some((e: any) => e.source === 'DERIVED_PARTNER' && e.derivedFromUserId === ines.userId)).toBe(true);
    expect(sub.data.dateSlots).toBe(3);
    expect(sub.data.state).toBe('NONE'); // pas un 2e abonnement
  });
});
