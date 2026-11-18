import type { Outfit, Species } from '@blowy/domain';
import { describe, expect, it, vi } from 'vitest';

// Les images des poses (require d'un .webp) ne se chargent pas hors de Metro : seul le nom de la pose sert ici.
vi.mock('./pets', () => ({ bodyPoseFor: (p: string) => p }));

import { badgeFrame, badgeFrameFitting, outfitLayers } from './fit';

const SPECIES: Species[] = ['nino', 'suzie', 'gaston', 'pia'];
const TALL: Outfit[] = [{ head: 'couronne' }, { head: 'sorcier' }, { head: 'lapin' }, { head: 'cornes' }, { head: 'bob' }];

describe('badgeFrameFitting (médaillons de la carte)', () => {
  it('sans tenue : le cadre du médaillon', () => {
    for (const sp of SPECIES) expect(badgeFrameFitting(sp, null, 'neutre')).toEqual(badgeFrame(sp, 'neutre'));
  });

  it('un objet haut tient dans le cadre, le bas du cadre ne bouge pas, et le cadre reste centré sur la tête', () => {
    for (const sp of SPECIES) {
      const base = badgeFrame(sp, 'neutre');
      for (const outfit of TALL) {
        const f = badgeFrameFitting(sp, outfit, 'neutre');
        const { back, front } = outfitLayers(sp, outfit, ['head', 'face'], 'neutre');
        const top = Math.min(...[...back, ...front].map((p) => p.top));
        const grown = f.side < base.side * 1.3 - 0.01;
        if (grown) expect(f.cy - f.side / 2).toBeLessThanOrEqual(top);
        expect(f.cy + f.side / 2).toBeCloseTo(base.cy + base.side / 2, 5);
        expect(f.cx).toBe(base.cx);
        expect(f.side).toBeGreaterThanOrEqual(base.side);
      }
    }
  });
});
