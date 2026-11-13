/**
 * Entrée en scène (après « créer mon pet ») : les quatre pets sortent du bas de l'écran l'un après l'autre, chacun
 * avec sa grande ligne. Un tap passe à la ligne suivante, « passer » va droit au choix ; moins de 5 s sans rien toucher.
 * Se termine sur le choix du pet (`replace` : revenir du choix ramène à la bienvenue, pas à la scène).
 */
import type { Species } from '@blowy/domain';
import { Button, PetRise, type PetRiseGesture, StageLine, StageTemplate, useSceneSteps } from '@blowy/ui';
import { router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const t = onboarding.entree;
/** Qui sort à chaque ligne, ce qu'il fait, et où (léger décalage, légère inclinaison : jamais deux fois pareil). */
const CAST: readonly { species: Species; gesture: PetRiseGesture; x: number; tilt: number }[] = [
  { species: 'nino', gesture: 'blink', x: -14, tilt: -3 },
  { species: 'suzie', gesture: 'look', x: 18, tilt: 4 },
  { species: 'gaston', gesture: 'blink', x: -8, tilt: -2 },
  { species: 'pia', gesture: 'look', x: 12, tilt: 3 },
];
const STEP = 1150;

export default function Entree() {
  const toCraft = () => router.replace('/(onboarding)/craft');
  const scene = useSceneSteps(t.lines.length, { step: STEP, onDone: toCraft });
  const line = t.lines[scene.index] ?? t.lines[0];
  return (
    <ScreenMotion>
      <StageTemplate
        right={<Button label={t.skip} variant="link" size="sm" onPress={scene.skip} />}
        onTap={scene.next}
        tapLabel={t.tap}
        tapHintDelay={1600}
        stage={CAST.map((c, i) => (
          <PetRise key={c.species} species={c.species} up={scene.index === i} reach={0.42} gesture={c.gesture} x={c.x} tilt={c.tilt} accessibilityLabel={i === scene.index ? common.speciesNames[c.species] : undefined} />
        ))}
      >
        <StageLine key={scene.index} text={line} size={52} />
      </StageTemplate>
    </ScreenMotion>
  );
}
