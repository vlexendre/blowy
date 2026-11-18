/**
 * Avant la demande de notifications du téléphone (montré une fois, depuis l'accueil : `usePushIntroOnce`).
 * Ce que les notifications apportent (quelqu'un te fait signe, ta série, le rappel avant la fin d'un essai), leur
 * limite (3 par jour hors messages, jamais la nuit), puis un seul bouton « Continuer » qui ouvre la demande du système
 * (HIG Privacy : un seul bouton, qui mène à la demande ; docs/AUDIT-APPLE.md). Refuser ne bloque rien (App Review
 * 4.5.4) : on le dit, on revient à l'accueil, et le réglage reste dans Moi › Réglages › Notifications.
 */
import { Appear, Banner, NotifPreview, OnboardingTemplate, Text } from '@blowy/ui';
import { router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { usePushPermission } from '@/features/notifications';
import { usePet } from '@/features/pet';
import { common } from '@/locales/common';
import { accueil } from '@/locales/accueil';

const t = accueil.notifIntro;

export default function NotificationsIntro() {
  const pet = usePet();
  const { ask } = usePushPermission();
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const species = pet.data?.pet.species ?? 'nino';
  const petName = pet.data?.pet.name ?? common.speciesNames.nino;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/pet'));

  const onContinue = async () => {
    if (denied) return close();
    setAsking(true);
    const answer = await ask();
    setAsking(false);
    if (answer === 'denied') setDenied(true);
    else close();
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        host={{ species, line: t.host, highlight: t.highlight, seed: petName, name: petName }}
        gap={18}
        primaryLabel={t.cta}
        primaryLoading={asking}
        onPrimary={() => void onContinue()}
        footnote={
          denied ? undefined : (
            <Text size={13} muted center>
              {t.refuseNote}
            </Text>
          )
        }
      >
        <NotifPreview species={species} app={t.app} items={t.items(petName)} accessibilityLabel={t.previewA11y} />
        <Text variant="bodyBold" size={15} muted center>
          {t.line}
        </Text>
        {denied ? (
          <Appear key="denied">
            <Banner tone="info" text={t.denied} />
          </Appear>
        ) : null}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
