/**
 * Tout est prêt (après la préparation) : le minimoa, vivant, saute de joie dans des confettis (le premier « waouh ») ;
 * la promesse en une phrase (il va te présenter des gens près de chez toi) ; un seul bouton, puis l'accueil. Minimoa+
 * n'est plus proposé ici (docs/DESIR.md : moment « deuxième jour », et les entrées de l'app).
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
      <StageTemplate align="center" footer={<Button label={t.cta} iconRight="arrow" onPress={() => router.replace('/(tabs)/pet')} />}>
        {me.data ? <ReadyHero species={pet.species} title={t.title(name)} text={t.text(pet.name)} seed={me.data.pet.id} petLabel={pet.name} /> : null}
      </StageTemplate>
    </ScreenMotion>
  );
}
