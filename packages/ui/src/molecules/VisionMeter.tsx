import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { color, gradient, radius, space } from '../theme';
import { AxisBar } from './AxisBar';

export interface VisionMeterProps {
  /** « Ta vision · Foyer ». */
  title: string;
  /** De −100 à +100 : où penche l'axe d'après les réponses données jusqu'ici. */
  value: number;
  low: string;
  high: string;
  /** Petite étiquette qui saute quand une réponse fait bouger l'axe (« + fonder un foyer »). */
  sticker?: string | null;
  /** Change à chaque réponse : l'étiquette refait « pop ». */
  stickerKey?: number;
  /** Libellé lu (« Foyer : plutôt fonder un foyer »). */
  accessibilityLabel?: string;
}

/**
 * La barre de vision sous les cartes du test (V6-GVision) : l'axe que vise la situation, rempli depuis le centre ; elle
 * bouge dès qu'on touche une carte, et une étiquette dit vers quel pôle (transformations seulement).
 */
export function VisionMeter({ title, value, low, high, sticker, stickerKey = 0, accessibilityLabel }: VisionMeterProps) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel ?? title} style={styles.card}>
      <LinearGradient colors={gradient.violet} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <InkProvider value={color.white}>
        <View style={[layout.rowBetween, styles.head]}>
          <Text variant="bodyHeavy" size={17} style={layout.grow}>
            {title}
          </Text>
          {sticker ? (
            <PopIn key={stickerKey} from={0.4} style={styles.sticker}>
              <Text variant="bodyHeavy" size={13} color={color.dark}>
                {sticker}
              </Text>
            </PopIn>
          ) : null}
        </View>
        <AxisBar value={value} height={9} color={color.accent} />
        <View style={[layout.rowBetween, styles.poles]}>
          <Text size={13} variant={value < 0 ? 'bodyHeavy' : 'body'} style={value < 0 ? null : styles.off}>
            {low}
          </Text>
          <Text size={13} variant={value > 0 ? 'bodyHeavy' : 'body'} style={value > 0 ? null : styles.off}>
            {high}
          </Text>
        </View>
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: space.sm + 2 },
  head: { minHeight: 32, gap: space.sm },
  sticker: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: color.accent, transform: [{ rotate: '-4deg' }] },
  poles: { gap: space.md },
  off: { opacity: 0.75 },
});
