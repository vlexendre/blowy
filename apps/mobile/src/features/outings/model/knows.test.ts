import { describe, expect, it } from 'vitest';
import { knowsOutcome } from './knows';

const other = '00000000-0000-4000-8000-000000000999';

describe('knowsOutcome', () => {
  it('ouvre la nouvelle sortie quand on est déplacé·e', () => {
    expect(knowsOutcome({ status: 'MOVED', newOutingId: other })).toEqual({
      kind: 'moved',
      newOutingId: other,
    });
  });
  it('faute de place : retiré·e sans pénalité', () => {
    expect(knowsOutcome({ status: 'MOVED' })).toEqual({ kind: 'removed' });
  });
  it('examen humain et sortie pour sécurité', () => {
    expect(knowsOutcome({ status: 'IN_REVIEW' }).kind).toBe('review');
    expect(knowsOutcome({ status: 'SAFETY_REVIEW' }).kind).toBe('safety');
  });
});
