import { describe, expect, it } from 'vitest';

import { afterRestart, draftKey, isFinalSendError, matchSent, newClientId, newestAt, type Pending, restoreDraft, type SentLike, threadView } from './outbox';

const pending = (clientId: string, body: string, over: Partial<Pending> = {}): Pending => ({
  clientId,
  body,
  at: '2026-11-19T10:00:00.000Z',
  status: 'sending',
  since: '2026-11-19T09:00:00.000Z',
  ...over,
});
const mine = (id: string, body: string, at: string): SentLike => ({ id, mine: true, body, at });

describe('envoi optimiste : rapprochement des brouillons et du fil', () => {
  it('le temps réel apporte le message avant la réponse : le brouillon est remplacé, pas doublé', () => {
    const server = [mine('old', 'Salut', '2026-11-19T08:00:00.000Z'), mine('s1', 'Salut', '2026-11-19T09:30:00.000Z')];
    const view = threadView([pending('a', 'Salut')], server);
    // L'ancien « Salut » (avant l'envoi) n'est pas pris ; le nouveau l'est, et garde la ligne du brouillon.
    expect(view.visible).toEqual([]);
    expect([...view.replaced]).toEqual([['s1', 'a']]);
    expect(view.done).toEqual(['a']);
  });

  it('deux « ok » à la suite : chacun trouve le sien, dans l’ordre', () => {
    const p = [pending('a', 'ok'), pending('b', 'ok')];
    const server = [mine('s2', 'ok', '2026-11-19T09:31:00.000Z'), mine('s1', 'ok', '2026-11-19T09:30:00.000Z')];
    expect([...matchSent(p, server)]).toEqual([
      ['a', 's1'],
      ['b', 's2'],
    ]);
    // Un seul arrivé : le second reste à l'écran.
    expect(threadView(p, [server[1] as SentLike]).visible.map((x) => x.clientId)).toEqual(['b']);
  });

  it('les messages de l’autre ne remplacent jamais un brouillon', () => {
    const view = threadView([pending('a', 'Salut')], [{ id: 'x', mine: false, body: 'Salut', at: '2026-11-19T09:30:00.000Z' }]);
    expect(view.visible.map((p) => p.clientId)).toEqual(['a']);
  });

  it('confirmé (`sent`) : visible tant que la réponse n’est pas rangée dans le fil, puis remplacé', () => {
    const sent = pending('a', 'Salut', { status: 'sent', serverId: 's1' });
    expect(threadView([sent], []).visible).toHaveLength(1);
    const view = threadView([sent], [mine('s1', 'Salut', '2026-11-19T09:30:00.000Z')]);
    expect(view.visible).toEqual([]);
    expect(view.replaced.get('s1')).toBe('a');
  });

  it('« pas envoyé » alors que le serveur l’avait écrit (réponse perdue) : reconnu, la bulle d’erreur part', () => {
    const view = threadView([pending('a', 'Tu viens ?', { status: 'failed' })], [mine('s1', 'Tu viens ?', '2026-11-19T09:30:00.000Z')]);
    expect(view.visible).toEqual([]);
    expect(view.done).toEqual(['a']);
  });

  it('fil vide au moment d’envoyer : tout message à soi du même texte compte', () => {
    expect(matchSent([pending('a', 'yo', { since: '' })], [mine('s1', 'yo', '2026-11-19T09:30:00.000Z')]).get('a')).toBe('s1');
    expect(newestAt([])).toBe('');
    expect(newestAt([{ at: '2026-11-19T09:00:00.000Z' }, { at: '2026-11-19T10:00:00.000Z' }])).toBe('2026-11-19T10:00:00.000Z');
  });

  it('refus nets et pannes', () => {
    expect(isFinalSendError({ code: 'content_refused' })).toBe(true);
    expect(isFinalSendError({ code: 'link_not_active' })).toBe(true);
    expect(isFinalSendError({ code: 'network' })).toBe(false);
    expect(isFinalSendError({ code: 'internal' })).toBe(false);
    expect(isFinalSendError({ code: 'rate_limited' })).toBe(false);
    expect(isFinalSendError(new Error('x'))).toBe(false);
  });

  it('le texte refusé revient dans le champ sans écraser ce qu’on écrit', () => {
    expect(restoreDraft('', 'Salut')).toBe('Salut');
    expect(restoreDraft('et toi ?', 'Salut')).toBe('Salut\net toi ?');
  });

  it('après une relance, ce qui était en route passe à « pas envoyé »', () => {
    expect(afterRestart([pending('a', 'x'), pending('b', 'y', { status: 'queued' }), pending('c', 'z', { status: 'failed' })]).map((p) => p.status)).toEqual([
      'failed',
      'failed',
      'failed',
    ]);
  });

  it('clés : uuid v4 et clé de ligne stable', () => {
    for (let i = 0; i < 20; i++) expect(newClientId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(draftKey('a')).toBe('c:a');
  });
});
