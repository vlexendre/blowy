/**
 * Localisation (V6-GLocalisation) : l'écran explique, puis la demande du système. Pas de « plus tard » ici (Apple refuse
 * un écran d'avant-demande qui permet d'éviter la demande) : un seul « Continuer », et ce qu'un refus change est écrit.
 * Refusé dans la demande du système : on le dit, et l'inscription continue. Accordé : la position est relevée en fond
 * (précision réduite), sans faire attendre.
 */
import { Appear, Banner, OnboardingTemplate, PointRow, Text, ZonePreview } from '@blowy/ui';
import type { Species } from '@blowy/domain';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { ScreenMotion } from '@/core';
import { askLocation, progressAt, readPosition, useDraft, useDraftGate, useStep } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.localisation;
const OTHERS: Record<Species, Species[]> = { nino: ['suzie', 'pia', 'gaston'], suzie: ['nino', 'pia', 'gaston'], gaston: ['suzie', 'pia', 'nino'], pia: ['suzie', 'nino', 'gaston'] };

export default function Localisation() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <LocalisationStep />;
}

function LocalisationStep() {
  useStep('localisation');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const next = () => router.push('/(onboarding)/notifications');

  const ask = async () => {
    // Déjà répondu (refus montré) : « Continuer » avance.
    if (denied) return next();
    setAsking(true);
    const answer = await askLocation();
    setAsking(false);
    useDraft.getState().set({ locationAnswer: answer, ...(answer === 'granted' ? {} : { location: null }) });
    if (answer === 'granted') {
      void readPosition().then((p) => p && useDraft.getState().set({ location: p }));
      next();
    } else {
      setDenied(true);
    }
  };

  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('localisation')}
        onBack={() => goBack('/(onboarding)/naissance')}
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
        <ZonePreview species={species} others={OTHERS[species]} radiusLabel={t.radius} accessibilityLabel={t.mapA11y} size={232} />
        <PointRow glyph="people" disc="coral" title={t.zoneTitle} text={t.zoneText(petName)} />
        <PointRow glyph="lock" disc="violet" title={t.exactTitle} text={t.exactText} />
        {denied ? (
          <Appear key="denied">
            <Banner tone="info" text={t.denied} />
          </Appear>
        ) : null}
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
