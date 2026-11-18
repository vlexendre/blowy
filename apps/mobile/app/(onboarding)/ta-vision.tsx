/**
 * Ta vision, pour l'instant (V6-GTaVision) : le résultat du test, calculé sur le téléphone avec les règles du serveur.
 * En tête, une phrase de synthèse (« Tu es plutôt quelqu’un qui… », traits les plus marqués) et ce que ça change ;
 * juste dessous, la carte à partager ; puis le détail : les cinq axes en questions simples et barres (pas de chiffre,
 * « assez net » / « encore flou ») et la mention « indicatif ».
 */
import { VISION_AXES, sideOf } from '@blowy/domain';
import { OnboardingTemplate, VisionReading } from '@blowy/ui';
import { Redirect, router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { VisionShare } from '@/features/moments';
import { lowerFirst, progressAt, strongestTraits, surenessOf, useDraft, useDraftGate, useStep, visionDone, visionNow } from '@/features/onboarding';
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
    return { key, name: t.axisQuestion(a.name), sureness, value: r.value, confidence: r.confidence, low: lowerFirst(a.low), high: lowerFirst(a.high), accessibilityLabel: t.axisA11y(a.name, line, sureness) };
  });
  const traits = strongestTraits(profile).map(({ axis, side }) => t.summary.traits[axis][side]);
  const summary = traits.length ? t.summary.lead(traits) : t.summary.even;
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
        <VisionReading
          axes={axes}
          note={t.note}
          summary={summary}
          summaryNote={t.summary.then(petName)}
          detailLabel={t.summary.detail}
          // Le « moment capture d'écran » de l'inscription : facultatif, jamais bloquant.
          action={<VisionShare profile={profile} pet={{ name: petName, species }} />}
        />
      </OnboardingTemplate>
    </ScreenMotion>
  );
}
