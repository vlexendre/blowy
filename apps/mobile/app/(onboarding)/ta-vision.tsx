/**
 * Ta vision, pour l'instant (V6-GTaVision) : le résultat du test, calculé sur le téléphone avec les règles du serveur.
 * Le minimoa le dit dans sa bulle, avec ce que ça change (il ne présentera que des gens compatibles) ; dessous, les
 * cinq axes en barres simples (pas de chiffre, « assez sûr » / « à affiner ») et la mention « indicatif ».
 */
import { VISION_AXES, sideOf } from '@blowy/domain';
import { OnboardingTemplate, VisionReading } from '@blowy/ui';
import { Redirect, router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { VisionShare } from '@/features/moments';
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
        host={{ species, line: t.host, highlight: t.highlight, seed: petName, name: petName }}
        gap={14}
        primaryLabel={t.cta}
        onPrimary={() => router.push('/(onboarding)/prenom')}
      >
        <VisionReading axes={axes} note={visionLabels.profile.note} />
        {/* Le « moment capture d'écran » de l'inscription : facultatif, jamais bloquant. */}
        <VisionShare profile={profile} pet={{ name: petName, species }} />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
