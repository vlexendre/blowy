/**
 * Minimoa+ à la fin de l'inscription (V6-GPlus) : la feuille monte par-dessus les invitations, après que la personne a
 * créé son minimoa et vu sa vision. Son minimoa, ses chiffres ; « Continuer gratuitement » mène à l'app.
 */
import { router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { PlusOffer } from '@/features/plus';
import { common } from '@/locales/common';

export default function Paywall() {
  const me = useMe();
  const pet = me.data?.pet;
  const toApp = () => router.replace('/(tabs)/pet');
  return (
    <ScreenMotion>
      <PlusOffer
        pet={pet ? { name: pet.name, species: pet.species, outfit: pet.outfit } : { name: common.speciesNames.nino, species: 'nino' }}
        reason="onboarding"
        member={me.data?.plus}
        onClose={toApp}
        onContinue={toApp}
      />
    </ScreenMotion>
  );
}
