/**
 * Minimoa+ en feuille, par-dessus l'écran d'où on vient (Moi, réglages, garde-robe, carte, habitudes, renommage, bilan) :
 * `openPlus(raison, { item })`. Le titre dit ce que la personne vient d'essayer ; membre : l'état de l'abonnement et
 * « Gérer mon abonnement ». La fermer revient à l'écran d'en dessous.
 */
import { useLocalSearchParams } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { isPlusReason, PlusOffer } from '@/features/plus';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';

export default function BlowyPlus() {
  const params = useLocalSearchParams<{ reason?: string; item?: string }>();
  const me = useMe();
  const pet = me.data?.pet;
  const back = () => goBack('/(tabs)/moi');
  return (
    <ScreenMotion>
      <PlusOffer
        pet={pet ? { name: pet.name, species: pet.species, outfit: pet.outfit } : { name: common.speciesNames.nino, species: 'nino' }}
        reason={isPlusReason(params.reason) ? params.reason : 'generic'}
        item={params.item}
        member={me.data?.plus}
        onClose={back}
        onContinue={back}
      />
    </ScreenMotion>
  );
}
