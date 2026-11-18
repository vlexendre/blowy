/**
 * Tout est prêt (après la préparation) : le minimoa, vivant, saute de joie dans des confettis (le premier « waouh ») ;
 * la règle du jeu en une phrase (« plus tu sors, plus il te présente de monde ») ; un seul bouton, puis Minimoa+ en
 * feuille par-dessus, puis l'accueil.
 */
import { Button, ReadyHero, StageTemplate } from '@blowy/ui';
import { Redirect, router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.pret;

export default function Pret() {
  const me = useMe();
  const pet = me.data?.pet ?? { name: 'nino', species: 'nino' as const };
  const name = me.data?.displayName ?? '';
  // Ouvert sans compte prêt (lien direct, rechargement déconnecté) : l'aiguillage décide.
  if (me.isError) return <Redirect href="/" />;
  return (
    <ScreenMotion>
      <StageTemplate align="center" footer={<Button label={t.cta} iconRight="arrow" onPress={() => router.push('/(onboarding)/paywall')} />}>
        {me.data ? <ReadyHero species={pet.species} title={t.title(name)} text={t.text(pet.name)} seed={me.data.pet.id} petLabel={pet.name} /> : null}
      </StageTemplate>
    </ScreenMotion>
  );
}
