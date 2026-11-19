import type { Me } from '@blowy/contract';
import { describe, expect, it } from 'vitest';

import { withUpdate } from './update';

const me = { displayName: 'Léa', showHabits: true, identity: { gender: 'woman', locale: 'fr', discreet: false, location: {} } } as unknown as Me;

describe('« Moi » optimiste', () => {
  it('applique les interrupteurs et l’identité', () => {
    const next = withUpdate(me, { showHabits: false, discreet: true });
    expect(next.showHabits).toBe(false);
    expect(next.identity.discreet).toBe(true);
    expect(next.identity.gender).toBe('woman');
    expect(next.displayName).toBe('Léa');
  });
  it('prénom : tel qu’écrit, sans espaces autour ; vide, il ne change pas', () => {
    expect(withUpdate(me, { displayName: '  Zoé ' }).displayName).toBe('Zoé');
    expect(withUpdate(me, { displayName: '   ' }).displayName).toBe('Léa');
  });
});
