import type { Species } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '../atoms/Text';
import { countWords, Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { Burst } from '../motion/Burst';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { useReveal } from '../motion/reveal';
import { space } from '../theme';
import type { TitleContent } from '../types';

export interface ReadyHeroProps {
  species: Species;
  /** « TOUT EST PRÊT, TOM ! » (mot à mot). */
  title: TitleContent;
  text?: string;
  seed?: string;
  petLabel?: string;
}

const JUMP_AT = 260;
const STEP = 110;

/**
 * « Tout est prêt » : le pet saute de joie au milieu de l'écran, des confettis partent de lui, le titre s'écrit mot à
 * mot puis la phrase. Le pet reste vivant (on peut le toucher). Animations réduites : tout est là, sans saut ni confettis.
 */
export function ReadyHero({ species, title, text, seed, petLabel }: ReadyHeroProps) {
  const reduced = useReducedMotion();
  const win = useWindowDimensions();
  const actor = useRef<PetActorHandle>(null);
  const [party, setParty] = useState(0);
  const words = countWords(title);
  const shown = useReveal(words, { step: STEP, delay: JUMP_AT + 200 });
  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => {
      actor.current?.react('joy');
      setParty(1);
      hapticFor('celebrate');
    }, JUMP_AT);
    return () => clearTimeout(id);
  }, [reduced]);
  const size = Math.round(Math.max(120, Math.min(210, win.height * 0.26)));
  return (
    <View style={styles.wrap}>
      <Title text={title} size={50} center reveal={shown} />
      {text ? (
        <Appear delay={reduced ? 0 : JUMP_AT + 200 + words * STEP} distance={8}>
          <Text variant="bodyBold" size={16} muted center style={styles.text}>
            {text}
          </Text>
        </Appear>
      ) : null}
      <View style={styles.stage}>
        <Appear scale={0.8} distance={30}>
          <PetActor ref={actor} species={species} mood="joie" size={size} seed={seed} sleepAfter={null} accessibilityLabel={petLabel} />
        </Appear>
        <Burst kind="confetti" trigger={party} seed={seed} spread={win.width * 0.55} style={[styles.burst, { top: size * 0.3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  text: { marginTop: space.md, maxWidth: 320, lineHeight: 22 },
  stage: { marginTop: space.xl, alignItems: 'center' },
  burst: { position: 'absolute', left: '50%' },
});
