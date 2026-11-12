import { useEffect } from 'react';
import { Modal, Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { haptic } from '../lib/haptics';
import { layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';

export interface UnlockSheetItem {
  id: string;
  name: string;
}

export interface UnlockSheetProps {
  visible: boolean;
  /** Objets débloqués (`PetView.newItems` + `itemLabel`). */
  items: readonly UnlockSheetItem[];
  /** « TU AS GAGNÉ / QUELQUE CHOSE ». */
  title: TitleContent;
  /** Autocollant (« nouveau ! »). */
  kicker: string;
  /** Ligne d'explication (« il est rangé dans sa garde-robe. »). */
  text?: string;
  /** Bouton principal (« lui mettre »), avec le premier objet. */
  wearLabel?: string;
  onWear?: (id: string) => void;
  /** Bouton secondaire et voile (« plus tard »). */
  closeLabel: string;
  onClose: () => void;
}

function Prize({ item, index, kicker, halo }: { item: UnlockSheetItem; index: number; kicker: string; halo: number }) {
  const reduced = useReducedMotion();
  const wobble = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    wobble.value = withDelay(400 + index * 120, withRepeat(withSequence(withTiming(-5, { duration: 500 }), withTiming(5, { duration: 500 })), -1, true));
  }, [reduced, index, wobble]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  return (
    <Animated.View entering={ZoomIn.delay(150 + index * 120).springify().damping(12)} style={styles.prize}>
      <Animated.View style={[styles.halo, { width: halo, height: halo, borderRadius: halo / 2 }, style]}>
        <ItemImage id={item.id} size={Math.round(halo * 0.78)} accessibilityLabel={item.name} />
      </Animated.View>
      {index === 0 ? <Sticker label={kicker} tone="coral" rotate={-8} style={styles.kicker} /> : null}
      <Text variant="h3" size={20} center numberOfLines={1}>
        {item.name}
      </Text>
    </Animated.View>
  );
}

/** Fête un ou plusieurs objets tout juste débloqués, au centre de l'écran sur un voile sombre. */
export function UnlockSheet({ visible, items, title, kicker, text, wearLabel, onWear, closeLabel, onClose }: UnlockSheetProps) {
  useEffect(() => {
    if (visible) haptic('success');
  }, [visible]);
  const halo = items.length > 1 ? 84 : 124;
  const first = items[0];
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <View style={styles.root}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.scrim]}>
            <RNPressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={layout.fill} />
          </Animated.View>
          <Animated.View entering={ZoomIn.springify().damping(15)} accessibilityViewIsModal style={styles.card}>
            <Panel gradient="violet" padding="lg" style={styles.panel}>
              <View style={styles.burst} pointerEvents="none">
                <Icon name="confettis" size={64} style={styles.confettiLeft} />
                <Icon name="etoiles" size={48} style={styles.confettiRight} />
              </View>
              <Title text={title} variant="h2" center />
              <View style={styles.prizes}>
                {items.slice(0, 3).map((it, i) => (
                  <Prize key={it.id} item={it} index={i} kicker={kicker} halo={halo} />
                ))}
              </View>
              {text ? (
                <Text variant="body" center>
                  {text}
                </Text>
              ) : null}
              <View style={layout.gapSm}>
                {wearLabel && onWear && first ? <Button label={wearLabel} variant="accent" block onPress={() => onWear(first.id)} /> : null}
                <Button label={closeLabel} variant="ghost" block onPress={onClose} />
              </View>
            </Panel>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  scrim: { backgroundColor: veil.scrim },
  card: { width: '100%', maxWidth: 380 },
  panel: { gap: space.lg, borderWidth: 3, borderColor: color.white, borderRadius: radius.xl },
  burst: StyleSheet.absoluteFill,
  confettiLeft: { position: 'absolute', top: space.sm, left: space.sm, transform: [{ rotate: '-18deg' }] },
  confettiRight: { position: 'absolute', top: space.lg, right: space.md },
  prizes: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
  prize: { alignItems: 'center', gap: space.sm, flexShrink: 1 },
  halo: { alignItems: 'center', justifyContent: 'center', backgroundColor: veil.glassStrong },
  kicker: { position: 'absolute', top: -space.sm, right: -space.md },
});
