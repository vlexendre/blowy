import { describe, expect, it } from 'vitest';

import { namedMotion } from './named';

describe('namedMotion', () => {
  it('joue les noms connus du serveur', () => {
    expect(namedMotion('hop')).toEqual({ reaction: 'joy', burst: null });
    expect(namedMotion('confetti')).toEqual({ reaction: 'party', burst: 'confetti' });
  });
  it('retombe sur un repli neutre pour un nom inconnu ou absent', () => {
    expect(namedMotion('fusee_2027')).toEqual({ reaction: null, burst: null });
    expect(namedMotion(null)).toEqual({ reaction: null, burst: null });
    expect(namedMotion('toString')).toEqual({ reaction: null, burst: null });
  });
});
