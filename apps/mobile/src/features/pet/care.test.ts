import type { PetView } from '@blowy/contract';
import { describe, expect, it } from 'vitest';

import { cared } from './care';

const view = (needs: PetView['pet']['needs']): PetView => ({ pet: { needs, wellbeing: 0, shape: 'boude' } } as unknown as PetView);

describe('soin optimiste', () => {
  it('nourrir remplit la faim, recalcule la forme', () => {
    const next = cared(view({ hunger: 20, energy: 50, mood: 50, sociability: 50 }), 'feed');
    expect(next.pet.needs.hunger).toBe(60);
    expect(next.pet.wellbeing).toBeGreaterThan(0);
    expect(['en_forme', 'bof', 'boude']).toContain(next.pet.shape);
  });
  it('jouer coûte de l’énergie, sans passer sous 0 ni au-dessus de 100', () => {
    const next = cared(view({ hunger: 50, energy: 5, mood: 90, sociability: 50 }), 'play');
    expect(next.pet.needs.energy).toBe(0);
    expect(next.pet.needs.mood).toBe(100);
  });
});
