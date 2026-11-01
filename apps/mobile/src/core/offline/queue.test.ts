import { describe, expect, it } from 'vitest';
import { backoffDelay, emptyQueue, isHidden, nextToSend, parseQueue, pendingCount, reduceQueue, statusOf, type QueueState } from './queue';

const cmd = (id: string, kind: 'PET_ACTION' | 'SEND_MESSAGE' | 'BLOCK' | 'REPORT', scope: string | null, createdAt: number) => ({
  type: 'enqueue' as const,
  command: { commandId: id, kind, payload: {}, scope, createdAt },
});

describe('file hors ligne', () => {
  it('enqueue idempotent par commandId', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 1));
    s = reduceQueue(s, cmd('a', 'PET_ACTION', 'p', 2));
    expect(s.items).toHaveLength(1);
  });

  it('refuse les commandes qui exigent le réseau', () => {
    expect(() => reduceQueue(emptyQueue, { type: 'enqueue', command: { commandId: 'x', kind: 'PURCHASE' as never, payload: {}, scope: null, createdAt: 1 } })).toThrow();
  });

  it('blocage : prioritaire, masque le scope, annule les envois en attente vers ce scope', () => {
    let s: QueueState = emptyQueue;
    s = reduceQueue(s, cmd('m1', 'SEND_MESSAGE', 'conv', 1));
    s = reduceQueue(s, cmd('f1', 'PET_ACTION', 'pet', 2));
    s = reduceQueue(s, cmd('b1', 'BLOCK', 'conv', 3));
    expect(isHidden(s, 'conv')).toBe(true);
    expect(statusOf(s, 'm1')).toBe('cancelled');
    expect(nextToSend(s, 10)?.commandId).toBe('b1');
  });

  it('signalement prioritaire sans annuler les messages (sauf blocage)', () => {
    let s = reduceQueue(emptyQueue, cmd('m1', 'SEND_MESSAGE', 'conv', 1));
    s = reduceQueue(s, cmd('r1', 'REPORT', 'conv', 5));
    expect(statusOf(s, 'm1')).toBe('queued');
    expect(nextToSend(s, 10)?.commandId).toBe('r1');
  });

  it('FIFO, une seule commande en vol par scope', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 1));
    s = reduceQueue(s, cmd('b', 'PET_ACTION', 'p', 2));
    s = reduceQueue(s, cmd('c', 'PET_ACTION', 'q', 3));
    expect(nextToSend(s, 10)?.commandId).toBe('a');
    s = reduceQueue(s, { type: 'sending', commandId: 'a' });
    expect(nextToSend(s, 10)?.commandId).toBe('c');
  });

  it('retry réseau : même commandId, backoff ; erreur définitive : failed', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 0));
    s = reduceQueue(s, { type: 'sending', commandId: 'a' });
    s = reduceQueue(s, { type: 'failed', commandId: 'a', error: 'NETWORK', retryable: true, now: 100 });
    expect(statusOf(s, 'a')).toBe('queued');
    expect(nextToSend(s, 100)).toBeNull();
    expect(nextToSend(s, 100 + backoffDelay(1))?.commandId).toBe('a');
    s = reduceQueue(s, { type: 'sending', commandId: 'a' });
    s = reduceQueue(s, { type: 'failed', commandId: 'a', error: 'FORBIDDEN', retryable: false, now: 200 });
    expect(statusOf(s, 'a')).toBe('failed');
    expect(pendingCount(s)).toBe(0);
  });

  it('confirmé / corrigé', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 0));
    s = reduceQueue(s, { type: 'confirmed', commandId: 'a', corrected: true });
    expect(statusOf(s, 'a')).toBe('corrected');
  });

  it('backoff borné', () => {
    expect(backoffDelay(1)).toBe(2000);
    expect(backoffDelay(20)).toBe(5 * 60_000);
  });

  it('restauration : sending interrompu repart en file ; JSON corrompu = vide', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 0));
    s = reduceQueue(s, { type: 'sending', commandId: 'a' });
    expect(parseQueue(JSON.stringify(s)).items[0]?.status).toBe('queued');
    expect(parseQueue('{oops')).toEqual(emptyQueue);
  });

  it('prune garde les actives', () => {
    let s = reduceQueue(emptyQueue, cmd('a', 'PET_ACTION', 'p', 0));
    s = reduceQueue(s, cmd('b', 'PET_ACTION', 'q', 0));
    s = reduceQueue(s, { type: 'confirmed', commandId: 'a' });
    s = reduceQueue(s, { type: 'prune', olderThan: 10 });
    expect(s.items.map((c) => c.commandId)).toEqual(['b']);
  });
});
