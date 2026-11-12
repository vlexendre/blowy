/** Blowy+ à la fin de l'inscription (V6-Paywall) : offre présentée, rien n'est vendu, « continuer gratuitement ». */
import { router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { PlusOffer } from '@/features/plus';

export default function Paywall() {
  const me = useMe();
  const pet = me.data?.pet ?? { name: 'nino', species: 'nino' as const };
  const toApp = () => router.replace('/(tabs)/pet');
  return (
    <ScreenMotion>
      <PlusOffer pet={pet} member={me.data?.plus} onClose={toApp} onContinue={toApp} />
    </ScreenMotion>
  );
}
