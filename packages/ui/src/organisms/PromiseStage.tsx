import type { Species } from '@blowy/domain';
import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Appear } from '../motion/Appear';
import { Burst } from '../motion/Burst';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { color, space } from '../theme';
import type { TitleContent } from '../types';

export interface PromiseStageProps {
  species: Species;
  /** Petite ligne jaune (« nino te demande une seule chose »). */
  kicker: string;
  title: TitleContent;
  /** Pourquoi c'est important (la vraie règle du jeu, en une phrase). */
  text: string;
  /** À incrémenter quand la promesse est faite : le pet saute de joie dans des cœurs. */
  cheerKey?: number;
  /** Graine du pet (règle 8). */
  seed?: string;
  petLabel?: string;
}

/**
 * La promesse de l'inscription : la demande du pet en grand, pourquoi en une ligne, et le pet vivant au milieu
 * (on peut le toucher). `cheerKey` : il saute de joie et des cœurs s'envolent. Le bouton à maintenir (`HoldButton`)
 * va dans le pied du gabarit. Le pet rapetisse sur les petits écrans pour ne jamais toucher le pied.
 */
export function PromiseStage({ species, kicker, title, text, cheerKey = 0, seed, petLabel }: PromiseStageProps) {
  const win = useWindowDimensions();
  const actor = useRef<PetActorHandle>(null);
  const last = useRef(cheerKey);
  useEffect(() => {
    if (cheerKey === last.current) return;
    last.current = cheerKey;
    actor.current?.react('joy');
  }, [cheerKey]);
  const size = Math.round(Math.max(96, Math.min(200, win.height * 0.23)));
  return (
    <View style={styles.wrap}>
      <Appear delay={40}>
        <Text variant="label" size={11} color={color.accent} center style={styles.kicker}>
          {kicker}
        </Text>
        <Title text={title} size={46} center style={styles.title} />
      </Appear>
      <Appear delay={160} distance={8}>
        <Text variant="bodyBold" size={15} muted center style={styles.text}>
          {text}
        </Text>
      </Appear>
      <View style={styles.stage}>
        <View>
          <Appear delay={260} scale={0.85} distance={24}>
            <PetActor ref={actor} species={species} mood="neutre" size={size} seed={seed} sleepAfter={null} accessibilityLabel={petLabel} />
          </Appear>
          <Burst kind="hearts" trigger={cheerKey} seed={seed} spread={size * 0.7} style={[styles.burst, { top: size * 0.25 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', flex: 1 },
  kicker: { letterSpacing: 1.32 },
  title: { marginTop: space.sm },
  text: { marginTop: space.md, maxWidth: 320, lineHeight: 21 },
  // Le pet occupe le milieu de la place qui reste, entre la phrase et le bouton.
  stage: { flex: 1, minHeight: 0, marginTop: space.md, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', left: '50%' },
});
