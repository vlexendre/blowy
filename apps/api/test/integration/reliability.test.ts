/** §21 n°12 partiel : ghosting −8 une fois par épisode ; aucune pénalité sans tour en attente ; pause suspend ; départ sans pénalité. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReliabilityJob } from '../../src/modules/relationships/application/reliability.use-case.js';
import { startHarness, type Harness } from './harness.js';
import { matchedPair } from './fixtures.js';

let h: Harness;
const HOUR = 3_600_000;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

const reliability = async (userId: string) => (await h.db.user.findUniqueOrThrow({ where: { id: userId } })).reliability;

describe('fiabilité / ghosting', () => {
  it('pénalise une seule fois par épisode et jamais sans tour en attente', async () => {
    const m = await matchedPair(h, 'gh');
    const job = h.app.get(ReliabilityJob);
    // Aucun message : personne n'attend → aucune pénalité même après 80 h.
    h.clock.advance(80 * HOUR);
    await job.run(h.clock.now());
    expect(await reliability(m.a.userId)).toBe(100);
    expect(await reliability(m.b.userId)).toBe(100);

    await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'gh-msg-00001', body: 'Tu es là ?' });
    await h.drain();
    h.clock.advance(73 * HOUR);
    for (let i = 0; i < 5; i++) {
      await job.run(h.clock.now());
      h.clock.advance(HOUR);
    }
    expect(await reliability(m.b.userId)).toBe(92); // −8 une seule fois
    expect(await reliability(m.a.userId)).toBe(100); // l'auteur n'est pas débiteur

    // B répond : épisode clos. A n'est pas débiteur d'un aller-retour qu'il a initié.
    await m.b.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'gh-msg-00002', body: 'Oui, désolé !' });
    await h.drain();
    await job.run(h.clock.now());
    expect(await reliability(m.b.userId)).toBe(92);
  });

  it('pause par relation retirée (V5, 410 — la pause V5 est globale, POST /v1/pauses) ; départ propre : aucune pénalité', async () => {
    const m = await matchedPair(h, 'gh2');
    const job = h.app.get(ReliabilityJob);
    await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'gh2-msg-0001', body: 'Coucou' });
    await h.drain();
    const pause = await m.b.call('POST', `/v1/relationships/${m.relId}/pause`, { days: 7 });
    expect([pause.status, pause.body.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);

    const leave = await m.b.call('POST', `/v1/relationships/${m.relId}/leave`, { reason: 'CLEAN_LEAVE' });
    expect(leave.body.status).toBe('ENDED');
    h.clock.advance(300 * HOUR);
    await job.run(h.clock.now());
    expect(await reliability(m.b.userId)).toBe(100);
    // Message système pré-écrit présenté comme tel.
    const msgs = (await h.db.message.findMany({ where: { conversationId: m.convId, kind: 'SYSTEM' } })).map((x) => x.systemTemplate);
    expect(msgs).toContain('system.leave.clean');
  });
});
