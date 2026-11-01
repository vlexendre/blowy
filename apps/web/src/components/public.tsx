/** Blocs du web public réutilisés par les pages (pied de page, liens stores, sprite d'espèce). */
import { StoreLinks, Sprite } from '@blowy/ui-web';
import { STORES } from '../lib/config';

export const SPECIES_LABEL: Record<string, string> = { NINO: 'Nino', GASTON: 'Gaston', PIA: 'Pia', SUZIE: 'Suzie' };

export function PetSprite({ species, stage = 'YOUNG', name, size = 108 }: { species: string; stage?: string; name: string; size?: number }) {
  return <Sprite src={`/sprites/${species.toLowerCase()}-${stage.toLowerCase()}.webp`} alt={SPECIES_LABEL[species] === name ? name : `${name}, ${SPECIES_LABEL[species] ?? 'pet'}`} size={size} priority />;
}

export function Stores() {
  return <StoreLinks appStoreUrl={STORES.appStore} playStoreUrl={STORES.playStore} />;
}

export function PublicFooter() {
  return (
    <>
      <a href="/support">Aide et signalement</a>
      <a href="/confidentialite">Confidentialité</a>
      <a href="/conditions">Conditions</a>
      <span>Comptes vérifiés · accords mutuels</span>
    </>
  );
}
