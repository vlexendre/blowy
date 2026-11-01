/**
 * §21 n°7 : aucun vote d'autrui dans les réponses API ni dans la projection WS ; la version de
 * vue n'avance pas sur le vote privé de l'autre ; seul l'auteur consulte son propre choix.
 * §21 n°9 : message pending / rejeté / quarantaine absent chez le destinataire ; WARNED en
 * placeholder puis révélé seulement par l'endpoint autorisé (sans XP).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './harness.js';
import { matchedPair, setLevel } from './fixtures.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

async function moveIn(m: Awaited<ReturnType<typeof matchedPair>>) {
  await setLevel(h, m.relId, 3);
  await m.a.call('POST', `/v1/relationships/${m.relId}/move-in`, {});
  const off = (await m.b.call('GET', `/v1/relationships/${m.relId}`)).body.pendingOffers[0];
  const r = await m.b.call('POST', `/v1/relationships/${m.relId}/consents/respond`, { offerId: off.id, decision: 'ACCEPT', version: off.version });
  expect(r.body.status).toBe('MOVED_IN');
}

const deepHas = (o: unknown, needle: string): boolean => JSON.stringify(o).includes(needle);

describe('votes secrets', () => {
  it('ne révèle jamais le vote de l’autre ; ne publie que la branche résultante', async () => {
    const m = await matchedPair(h, 'vote');
    await moveIn(m);
    await h.drain();
    const bBefore = await m.b.call('GET', `/v1/relationships/${m.relId}`);
    const projBefore = await h.db.projectionEntry.count({ where: { recipientId: m.b.userId } });

    const cast = await m.a.call('POST', `/v1/relationships/${m.relId}/branch/ballot`, { choice: 'PLUS' });
    expect(cast.status).toBe(201);
    expect(cast.body.openBranchRound.myChoice).toBe('PLUS'); // l'auteur voit son propre choix
    await h.drain();

    const bAfter = await m.b.call('GET', `/v1/relationships/${m.relId}`);
    expect(bAfter.body.openBranchRound.myChoice).toBeNull();
    expect(bAfter.body.branch).toBe('UNDECIDED');
    expect(bAfter.body.viewVersion).toBe(bBefore.body.viewVersion); // aucune avance visible
    expect(deepHas(bAfter.body, 'PLUS')).toBe(false);
    expect(await h.db.projectionEntry.count({ where: { recipientId: m.b.userId } })).toBe(projBefore);
    const bProjections = await h.db.projectionEntry.findMany({ where: { recipientId: m.b.userId } });
    expect(deepHas(bProjections, 'ballot')).toBe(false);
    // Le journal relationnel ne contient pas le vote individuel.
    const events = await h.db.relationshipEvent.findMany({ where: { contextId: m.relId } });
    expect(events.some((e) => /ballot|vote_cast/i.test(e.type))).toBe(false);

    // B vote Ami → résultat Ami publié aux deux, sans dire qui a voté quoi.
    await m.b.call('POST', `/v1/relationships/${m.relId}/branch/ballot`, { choice: 'FRIEND' });
    await h.drain();
    const aView = await m.a.call('GET', `/v1/relationships/${m.relId}`);
    const bView = await m.b.call('GET', `/v1/relationships/${m.relId}`);
    expect(aView.body.branch).toBe('FRIEND');
    expect(bView.body.branch).toBe('FRIEND');
    expect(aView.body.openBranchRound).toBeNull();
    const last = await h.db.projectionEntry.findMany({ where: { recipientId: { in: [m.a.userId, m.b.userId] } }, orderBy: { seq: 'desc' }, take: 2 });
    for (const e of last) expect(deepHas(e.payload, 'PLUS')).toBe(false);
  });

  it('échéance commune : un seul vote → Ami à l’échéance', async () => {
    const m = await matchedPair(h, 'vote2');
    await moveIn(m);
    await m.a.call('POST', `/v1/relationships/${m.relId}/branch/ballot`, { choice: 'PLUS' });
    h.clock.advance(73 * 3_600_000);
    const { BranchVoteUseCase } = await import('../../src/modules/relationships/application/branch-vote.use-case.js');
    expect(await h.app.get(BranchVoteUseCase).resolveDue(h.clock.now())).toBeGreaterThanOrEqual(1);
    expect((await m.b.call('GET', `/v1/relationships/${m.relId}`)).body.branch).toBe('FRIEND');
    h.clock.advance(-73 * 3_600_000);
  });
});

describe('modération et visibilité destinataire', () => {
  it('pending / rejeté / quarantaine / panne : jamais chez le destinataire ; warned en placeholder', async () => {
    const m = await matchedPair(h, 'mod');
    const send = (id: string, body: string) => m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: id, body });
    const pending = await send('mod-pending-01', 'Encore en attente');
    // Avant modération : l'auteur voit son pending, le destinataire rien.
    expect((await m.a.call('GET', `/v1/conversations/${m.convId}/messages`)).body.items.some((x: { id: string }) => x.id === pending.body.id)).toBe(true);
    expect(deepHas((await m.b.call('GET', `/v1/conversations/${m.convId}/messages`)).body, 'Encore en attente')).toBe(false);
    await send('mod-reject-001', 'texte synthétique [reject]');
    await send('mod-quarant-01', 'texte synthétique [quarantine]');
    await send('mod-fail-0001', 'texte synthétique [fail]');
    const warned = await send('mod-warn-0001', 'texte synthétique [warn] attention');
    await h.drain();

    const mine = (await m.a.call('GET', `/v1/conversations/${m.convId}/messages`)).body.items;
    const statusOf = (cid: string) => mine.find((x: { clientMessageId: string }) => x.clientMessageId === cid)?.status;
    expect(statusOf('mod-reject-001')).toBe('REJECTED');
    expect(statusOf('mod-quarant-01')).toBe('QUARANTINED');
    expect(statusOf('mod-fail-0001')).toBe('PROCESSING_FAILED'); // panne ≠ approbation
    expect(statusOf('mod-pending-01')).toBe('PUBLISHED');

    const theirs = await m.b.call('GET', `/v1/conversations/${m.convId}/messages`);
    const raw = JSON.stringify(theirs.body);
    for (const s of ['[reject]', '[quarantine]', '[fail]', 'attention']) expect(raw.includes(s)).toBe(false);
    const w = theirs.body.items.find((x: { id: string }) => x.id === warned.body.id);
    expect(w).toMatchObject({ status: 'WARNED', warned: true, body: null });
    // Projections WS du destinataire : aucune trace des messages masqués.
    const proj = await h.db.projectionEntry.findMany({ where: { recipientId: m.b.userId } });
    expect(deepHas(proj, '[reject]') || deepHas(proj, '[quarantine]') || deepHas(proj, 'attention')).toBe(false);

    // Révélation explicite (destinataire seulement), sans XP.
    const xpBefore = (await m.b.call('GET', `/v1/relationships/${m.relId}`)).body.xp;
    expect((await m.a.call('POST', `/v1/messages/${warned.body.id}/reveal`, {})).status).toBe(404);
    const rev = await m.b.call('POST', `/v1/messages/${warned.body.id}/reveal`, {});
    expect(rev.body.body).toContain('attention');
    expect((await m.b.call('GET', `/v1/relationships/${m.relId}`)).body.xp).toBe(xpBefore);
  });
});
