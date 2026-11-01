import { describe, expect, it } from 'vitest';
import { applyBatch, emptyCursors, reconnectDelay, roomsToJoin } from './cursor';

const ev = (id: string, cursor: string) => ({ eventId: id, type: 'message.published', aggregateId: 'a', projectionCursor: cursor, occurredAt: '2026-11-01T00:00:00Z', schemaVersion: 1, payload: {} });

describe('resync par curseur', () => {
  it('avance le curseur et déduplique', () => {
    const r1 = applyBatch(emptyCursors, 'conversation:1', [ev('e1', 'c1'), ev('e2', 'c2')]);
    expect(r1.fresh).toHaveLength(2);
    expect(r1.state.cursors['conversation:1']).toBe('c2');
    const r2 = applyBatch(r1.state, 'conversation:1', [ev('e2', 'c2'), ev('e3', 'c3')]);
    expect(r2.fresh.map((e) => e.eventId)).toEqual(['e3']);
    expect(r2.state.cursors['conversation:1']).toBe('c3');
  });
  it('lot vide : curseur inchangé', () => {
    const r = applyBatch({ cursors: { r: 'c9' }, seen: [] }, 'r', []);
    expect(r.state.cursors.r).toBe('c9');
  });
  it('backoff exponentiel avec gigue, plafonné', () => {
    expect(reconnectDelay(0, 1)).toBe(1000);
    expect(reconnectDelay(3, 1)).toBe(8000);
    expect(reconnectDelay(3, 0)).toBe(4000);
    expect(reconnectDelay(50, 1)).toBe(30000);
  });
  it('rooms révoquées non rejointes', () => {
    expect(roomsToJoin(['a', 'b'], ['b'])).toEqual(['a']);
  });
});
