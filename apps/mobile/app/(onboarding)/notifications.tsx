/**
 * Notifications : même principe que la localisation. L'écran montre ce que le minimoa enverrait (et la limite :
 * 3 par jour, jamais la nuit), un seul « Continuer », puis la demande du système. Accordé : l'appareil sera enregistré
 * auprès de l'API une fois le compte créé (puis à chaque ouverture). Refusé : on le dit, et on continue.
 */
import { Appear, Banner, NotifPreview, OnboardingTemplate, Text } from '@blowy/ui';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { askNotifications, progressAt, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.notifications;

export default function Notifications() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <NotificationsStep />;
}

function NotificationsStep() {
  useStep('notifications');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const next = () => router.push('/(onboarding)/promesse');

  const ask = async () => {
    if (denied) return next();
    setAsking(true);
    const answer = await askNotifications();
    setAsking(false);
    useDraft.getState().set({ notificationsAnswer: answer });
    if (answer === 'denied') setDenied(true);
    else next();
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('notifications')}
        onBack={() => goBack('/(onboarding)/localisation')}
        backLabel={common.back}
        host={{ species, line: t.host, highlight: t.highlight, seed: petName, name: petName }}
        gap={18}
        primaryLabel={t.cta}
        primaryLoading={asking}
        onPrimary={() => void ask()}
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
