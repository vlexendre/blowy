/**
 * Ta vision, pour l'instant (V6-GTaVision) : le résultat du test, calculé sur le téléphone avec les règles du serveur.
 * Les cinq axes en barres simples (pas de chiffre, « assez sûr » / « à affiner »), la mention « indicatif », et la
 * phrase qui dit ce que ça change : le minimoa ne présentera que des gens compatibles.
 */
import { VISION_AXES, sideOf } from '@blowy/domain';
import { Button, OnboardingTemplate, Stack, Text, VisionHero, VisionReading } from '@blowy/ui';
import { Redirect, router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { lowerFirst, progressAt, surenessOf, useDraft, useDraftGate, useStep, visionDone, visionNow } from '@/features/onboarding';
import { goBack } from '@/features/session';
import { common } from '@/locales/common';
import { onboarding, visionLabels } from '@/locales/onboarding';

const t = onboarding.taVision;

export default function TaVision() {
  const gate = useDraftGate();
  if (gate === 'missing') return <Redirect href="/" />;
  if (gate === 'loading') return null;
  return <Result />;
}

function Result() {
  useStep('ta-vision');
  const species = useDraft((d) => d.species);
  const petName = useDraft((d) => d.petName) || common.speciesNames[species];
  const answers = useDraft((d) => d.visionAnswers);
  // Test pas fini (reprise sur cet écran après un changement) : on y retourne.
  if (!visionDone(answers)) return <Redirect href="/(onboarding)/vision" />;
  const profile = visionNow(answers);
  const axes = VISION_AXES.map((key) => {
    const a = visionLabels.axes[key];
    const r = profile[key];
    const sureness = t.sureness[surenessOf(r.confidence)];
    const side = sideOf(r.value);
    const line = side === 'mid' ? t.between : t.lean(lowerFirst(side === 'low' ? a.low : a.high));
    return { key, name: a.name, sureness, value: r.value, confidence: r.confidence, low: lowerFirst(a.low), high: lowerFirst(a.high), accessibilityLabel: t.axisA11y(a.name, line, sureness) };
  });
  return (
    <ScreenMotion>
      <OnboardingTemplate
        {...progressAt('ta-vision')}
        onBack={() => goBack('/(onboarding)/vision')}
        backLabel={common.back}
        gap={16}
        actions={
          <Stack gap={14}>
            <Text variant="bodyHeavy" size={18}>
              {t.promise(petName)}
            </Text>
            <Button label={t.cta} iconRight="arrow" onPress={() => router.push('/(onboarding)/prenom')} />
          </Stack>
        }
      >
        <VisionHero title={t.title} chips={t.chips(answers.length)} species={species} petLabel={petName} />
        <VisionReading axes={axes} note={visionLabels.profile.note} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
