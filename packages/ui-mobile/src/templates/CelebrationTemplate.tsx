/**
 * Moment fort (+XP, éclosion, naissance, révélation, emménagement) : fond encre, confettis,
 * illustration centrale qui « pop ». Réduire les animations : pas de confettis en boucle,
 * apparition simple conservée.
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { EFFECTS } from '@blowy/sprites';
import { useA11yPrefs } from '../foundations/accessibility';
import { POP } from '../foundations/motion';
import { space } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Sprite } from '../atoms/Sprite';
import { Text } from '../atoms/Text';
import { ScreenFrame } from './ScreenFrame';

export interface CelebrationTemplateProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  hero: ReactNode;
  /** Gains affichés (« +6 XP Lien ») — uniquement ceux confirmés par le serveur. */
  stats?: ReactNode;
  cta: { label: string; onPress: () => void; testID?: string };
  secondary?: { label: string; onPress: () => void };
  confetti?: boolean;
  testID?: string;
}

export function CelebrationTemplate({ eyebrow, title, lead, hero, stats, cta, secondary, confetti = true, testID }: CelebrationTemplateProps) {
  const { reduceMotion } = useA11yPrefs();
  const s = useSharedValue(reduceMotion ? 1 : POP.fromScale);
  const y = useSharedValue(reduceMotion ? 0 : POP.fromY);
  useEffect(() => {
    s.value = reduceMotion ? withTiming(1, { duration: 150 }) : withSpring(1, { damping: 8 });
    y.value = reduceMotion ? 0 : withSpring(0, { damping: 10 });
  }, [reduceMotion, s, y]);
  const pop = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: s.value }] }));
  return (
    <ScreenFrame
      tone="ink"
      testID={testID}
      footer={
        <>
          <Button label={cta.label} variant="lime" onPress={cta.onPress} testID={cta.testID ?? 'celebration-cta'} />
          {secondary ? <Button label={secondary.label} variant="dark" onPress={secondary.onPress} /> : null}
        </>
      }
    >
      {eyebrow ? (
        <Text variant="label" tone="lime">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="displayXL" tone="white" accessibilityLiveRegion="polite">
        {title}
      </Text>
      {lead ? (
        <Text variant="body" tone="white">
          {lead}
        </Text>
      ) : null}
      <View style={styles.hero}>
        {confetti && !reduceMotion ? (
          <View style={styles.confetti} pointerEvents="none">
            <Sprite path={EFFECTS.confetti} size={320} />
          </View>
        ) : null}
        <Animated.View style={pop}>{hero}</Animated.View>
      </View>
      {stats}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', justifyContent: 'center', minHeight: 260, paddingVertical: space.lg },
  confetti: { position: 'absolute', alignSelf: 'center' },
});
