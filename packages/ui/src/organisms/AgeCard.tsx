import type { Species } from '@blowy/domain';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { DressedPet } from '../atoms/DressedPet';
import { Panel } from '../atoms/Panel';
import { Title } from '../atoms/Title';
import { ease, springs, useReducedMotion } from '../lib/motion';
import type { TitleContent } from '../types';

export interface AgeCardProps {
  species: Species;
  /** « 30 ANS / ET TOUTES TES DENTS. » ; change avec la date choisie. */
  title: TitleContent;
  /** Clé qui change avec l'âge : le titre fait un petit saut, le minimoa sautille. */
  ageKey: number | string;
  /** Moins de 18 ans : panneau sombre, minimoa triste, pas de chapeau. */
  blocked?: boolean;
  petLabel?: string;
}

/**
 * Carte de l'âge (V6-GNaissance) : l'âge en grand, une ligne estompée, le minimoa avec son chapeau de fête. À chaque
 * cran de la roue des années, le titre saute et le minimoa rebondit (transformations seulement).
 */
export function AgeCard({ species, title, ageKey, blocked, petLabel }: AgeCardProps) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    s.value = withSequence(withTiming(1.06, { duration: 90, easing: ease.out }), withSpring(1, springs.pop));
    y.value = withSequence(withTiming(-10, { duration: 120, easing: ease.out }), withSpring(0, springs.plush));
  }, [ageKey, reduced, s, y]);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const hop = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Panel gradient={blocked ? 'night' : 'coral'} radius={30} padding="none" style={styles.panel}>
      <Animated.View style={[styles.title, pop]}>
        <Title text={title} size={46} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.pet, hop]}>
        <DressedPet species={species} outfit={blocked ? undefined : { head: 'chapeau_fete' }} mood={blocked ? 'triste' : 'joie'} size={150} accessibilityLabel={petLabel} />
      </Animated.View>
      <View />
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 170, paddingVertical: 20, paddingHorizontal: 20, overflow: 'hidden' },
  title: { maxWidth: '70%', transformOrigin: '0% 50%' },
  pet: { position: 'absolute', right: -16, bottom: -26 },
});
