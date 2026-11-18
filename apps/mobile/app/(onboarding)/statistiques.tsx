/**
 * Statistiques d'usage, juste avant la création du compte (la préparation y renvoie tant que la question n'a pas été
 * posée). Deux choix de même poids, rien de coché d'avance (RGPD, CNIL) ; « oui » ouvre l'envoi à Amplitude avant la
 * création, pour que `Account Created` parte. Se change ensuite dans Moi › Réglages.
 */
import { Button, OnboardingTemplate, Stack } from '@blowy/ui';
import { router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { setAnalyticsConsent } from '@/features/analytics';
import { openLegal } from '@/features/me';
import { useDraft } from '@/features/onboarding';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.statistiques;

export default function Statistiques() {
  const species = useDraft((d) => d.species);
  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted);
    router.replace('/(onboarding)/preparation');
  };
  return (
    <ScreenMotion>
      <OnboardingTemplate
        title={t.title}
        titleSize={48}
        titlePet={{ species, pose: 'joie' }}
        text={t.text}
        actions={
          <Stack gap={10}>
            <Button label={t.accept} variant="white" onPress={() => choose(true)} />
            <Button label={t.refuse} variant="white" onPress={() => choose(false)} />
            <Button label={t.policy} variant="link" size="sm" onPress={openLegal('confidentialite')} />
          </Stack>
        }
      />
    </ScreenMotion>
  );
}
