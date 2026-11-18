/**
 * Placements des objets portés pour les tenues montrées sur le site (même calcul que l'app : `outfitLayers`).
 * Usage : `pnpm exec tsx apps/web/scripts/site-images/placements.mts > /tmp/placements.json` (lu par build.py).
 */
import Module from 'node:module';
import type { Outfit, Species } from '@blowy/domain';

// Le registre des images de l'app fait `require('….webp')` : ici, seuls les calculs comptent.
(Module as unknown as { _extensions: Record<string, (m: { exports: unknown }) => void> })._extensions['.webp'] = (m) => {
  m.exports = 0;
};
const { outfitLayers } = await import('../../../../packages/ui/src/assets/fit');

export const OUTFITS: { name: string; species: Species; pose: string; outfit: Outfit }[] = [
  { name: 'nino_bob', species: 'nino', pose: 'coucou', outfit: { head: 'bob', face: 'lunettes_rondes', body: 'echarpe' } },
  { name: 'suzie_couronne', species: 'suzie', pose: 'fier', outfit: { head: 'couronne', body: 'collier_perles', toy: 'fleur' } },
  { name: 'gaston_casque', species: 'gaston', pose: 'joie', outfit: { head: 'casquette_envers', body: 'sac_a_dos', toy: 'ballon' } },
  { name: 'pia_hiver', species: 'pia', pose: 'neutre', outfit: { head: 'hiver_bonnet', body: 'hiver_echarpe', toy: 'hiver_aura' } },
];

const out = OUTFITS.map((o) => ({ ...o, layers: outfitLayers(o.species, o.outfit, undefined, o.pose as never) }));
process.stdout.write(JSON.stringify(out, null, 1));
