/** Tout est prêt (après la préparation) : le pet saute de joie dans des confettis, un seul bouton, puis les invitations. */
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
      <StageTemplate align="center" footer={<Button label={t.cta} iconRight="arrow" onPress={() => router.replace('/(onboarding)/invite')} />}>
        {me.data ? <ReadyHero species={pet.species} title={t.title(name)} text={t.text(pet.name)} seed={me.data.pet.id} petLabel={pet.name} /> : null}
      </StageTemplate>
    </ScreenMotion>
  );
}
