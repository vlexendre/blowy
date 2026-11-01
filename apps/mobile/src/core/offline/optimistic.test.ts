import { describe, expect, it } from 'vitest';
import { isCorrection, reduceOptimistic, type OptimisticState } from './optimistic';

describe('réducteur pending → confirmé / corrigé', () => {
  const s0: OptimisticState<string> = {};
  it('start → pending, settle → confirmé', () => {
    let s = reduceOptimistic(s0, { type: 'start', key: 'HUG', commandId: 'c1', now: 0 });
    expect(s.HUG?.phase).toBe('pending');
    s = reduceOptimistic(s, { type: 'settle', key: 'HUG', commandId: 'c1', result: 'ok', corrected: false });
    expect(s.HUG?.phase).toBe('confirmed');
  });
  it('correction serveur', () => {
    let s = reduceOptimistic(s0, { type: 'start', key: 'HUG', commandId: 'c1', now: 0 });
    s = reduceOptimistic(s, { type: 'settle', key: 'HUG', commandId: 'c1', result: 'refus', corrected: true });
    expect(s.HUG?.phase).toBe('corrected');
  });
  it('réponse périmée ignorée', () => {
    let s = reduceOptimistic(s0, { type: 'start', key: 'HUG', commandId: 'c1', now: 0 });
    s = reduceOptimistic(s, { type: 'start', key: 'HUG', commandId: 'c2', now: 1 });
    s = reduceOptimistic(s, { type: 'settle', key: 'HUG', commandId: 'c1', result: 'vieux', corrected: false });
    expect(s.HUG?.phase).toBe('pending');
    expect(s.HUG?.commandId).toBe('c2');
  });
  it('queued, fail, clear', () => {
    let s = reduceOptimistic(s0, { type: 'start', key: 'FEED', commandId: 'c1', now: 0 });
    s = reduceOptimistic(s, { type: 'queued', key: 'FEED' });
    expect(s.FEED?.phase).toBe('queued');
    s = reduceOptimistic(s, { type: 'fail', key: 'FEED', commandId: 'c1', error: 'x' });
    expect(s.FEED?.phase).toBe('failed');
    expect(reduceOptimistic(s, { type: 'clear', key: 'FEED' }).FEED).toBeUndefined();
  });
  it('isCorrection', () => {
    expect(isCorrection({ outcome: 'APPLIED', gainedXp: 4 }, { outcome: 'NO_GAIN', gainedXp: 0 })).toBe(true);
    expect(isCorrection(null, { outcome: 'APPLIED', gainedXp: 4 })).toBe(false);
  });
});
