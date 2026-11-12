import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { Glyph } from '../atoms/Glyph';
import { ItemImage } from '../atoms/ItemImage';
import { Pressable } from '../atoms/Pressable';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { hitSlopFor, layout } from '../lib/styles';
import { color, radius, shadow, space, veil } from '../theme';

export interface UnlockToastProps {
  visible: boolean;
  /** Objet débloqué. */
  itemId: string;
  /** Son nom (`itemLabel[id]`). */
  name: string;
  /** Autocollant (« nouveau ! »). */
  kicker: string;
  /** Petite ligne sous le nom (« dans ta garde-robe »). */
  text?: string;
  /** Appui sur le toast (ouvrir la garde-robe). */
  onPress?: () => void;
  onClose?: () => void;
  closeLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bandeau qui surgit quand un objet se débloque : image, nom, « nouveau ! ». À poser en haut ou en bas de l'écran. */
export function UnlockToast({ visible, itemId, name, kicker, text, onPress, onClose, closeLabel = 'Fermer', style }: UnlockToastProps) {
  if (!visible) return null;
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} exiting={FadeOut} accessibilityLiveRegion="polite" style={[styles.wrap, shadow.lift, style]}>
      <Pressable onPress={onPress} disabled={!onPress} haptic="success" scaleTo={0.97} accessibilityLabel={[kicker, name, text].filter(Boolean).join(', ')} style={[layout.row, styles.card]}>
        <View style={styles.art}>
          <ItemImage id={itemId} size={52} />
        </View>
        <View style={[layout.grow, layout.gapXs]}>
          <Sticker label={kicker} tone="coral" size="sm" rotate={-4} />
          <Text variant="h3" size={20} color={color.dark} numberOfLines={1}>
            {name}
          </Text>
          {text ? (
            <Text variant="small" color={color.dark} numberOfLines={1}>
              {text}
            </Text>
          ) : null}
        </View>
        {onClose ? (
          <Pressable onPress={onClose} accessibilityLabel={closeLabel} hitSlop={hitSlopFor(28)} style={styles.close}>
            <Glyph name="close" size={14} color={color.dark} />
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg },
  card: { gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: color.accent, borderWidth: 3, borderColor: color.white },
  art: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: color.white },
  close: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.darkGlass },
});
