import { describe, expect, it } from 'vitest';
import { gateStates, linkProgress } from './link';

describe('Lien', () => {
  it('progression vers le niveau suivant', () => {
    expect(linkProgress({ xp: 340, reachedLevel: 2 })).toEqual({ level: 2, xp: 340, next: 500, ratio: (340 - 150) / 350 });
    expect(linkProgress({ xp: 3100, reachedLevel: 7 }).next).toBeNull();
  });
  it('portes : accord requis à 3 ; branche Ami sans œuf', () => {
    const g = gateStates({ reachedLevel: 2, eligibleLevel: 3, branch: 'UNDECIDED' });
    expect(g.slice(0, 3)).toEqual(['reached', 'reached', 'consent-needed']);
    expect(gateStates({ reachedLevel: 4, eligibleLevel: 4, branch: 'FRIEND' })[6]).toBe('not-in-branch');
    expect(gateStates({ reachedLevel: 4, eligibleLevel: 5, branch: 'PLUS' })[4]).toBe('consent-needed');
  });
});
