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

const deepHas = (o: unknown, needle: string): boolean => JSON.stringify(o).includes(needle);

describe('votes secrets', () => {
  // V5 : le vote de branche V4 et l'emménagement sont retirés (§7.7). Le vote secret V5 (bulletins groupés,
  // aucun événement à la saisie, dépouillement unique à la clôture) est couvert par `outings-v5.test.ts`
  // et le parcours `fuite-intention-impossible`.
  it('vote de branche et emménagement V4 : 410 RETIRED_IN_V5, rien n’est écrit ni projeté', async () => {
    const m = await matchedPair(h, 'vote');
    await setLevel(h, m.relId, 3);
    const projBefore = await h.db.projectionEntry.count({ where: { recipientId: m.b.userId } });
    const rs = [
      await m.a.call('POST', `/v1/relationships/${m.relId}/move-in`, {}),
      await m.a.call('POST', `/v1/relationships/${m.relId}/branch/ballot`, { choice: 'PLUS' }),
      await m.a.call('POST', `/v1/relationships/${m.relId}/consents/respond`, { offerId: m.relId, decision: 'ACCEPT', version: 1 }),
    ];
    for (const r of rs) expect([r.status, r.body.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);
    await h.drain();
    expect(await h.db.projectionEntry.count({ where: { recipientId: m.b.userId } })).toBe(projBefore);
    const bView = await m.b.call('GET', `/v1/relationships/${m.relId}`);
    expect(bView.body.branch).toBe('UNDECIDED');
    expect(deepHas(bView.body, 'PLUS')).toBe(false);
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
