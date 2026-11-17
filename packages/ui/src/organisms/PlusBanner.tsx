import { StyleSheet, View } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { color, radius, size, space } from '../theme';
import type { TitleContent } from '../types';

export interface PlusBannerProps {
  /** « MINIMOA+ » (partie estompée possible). */
  title: TitleContent;
  /** Une ligne : deux avantages, ou l'état de ton abonnement. */
  text: string;
  /** Petit bouton blanc (« Essayer ») ; sans lui, un chevron (abonnement en cours : la ligne mène à son détail). */
  ctaLabel?: string;
  onPress: () => void;
}

/** Bandeau Minimoa+ de Moi : une rangée basse sur fond vin, titre Anton, une ligne, petit bouton. Toute la rangée est touchable. */
export function PlusBanner({ title, text, ctaLabel, onPress }: PlusBannerProps) {
  const label = `${typeof title === 'string' ? title : title.map((s) => s.text).join('')}. ${text}`;
  return (
    <Pressable onPress={onPress} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={ctaLabel ? `${label}. ${ctaLabel}` : label}>
      <Panel gradient="wine" radius={radius.card} padding="none" style={styles.panel}>
        <View style={styles.texts}>
          <Title text={title} size={18} numberOfLines={1} />
          <Text variant="body" size={13} numberOfLines={1} style={styles.text}>
            {text}
          </Text>
        </View>
        {ctaLabel ? (
          <View style={styles.cta} pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Text variant="bodyHeavy" size={13} color={color.dark} numberOfLines={1}>
              {ctaLabel}
            </Text>
          </View>
        ) : (
          <Glyph name="chevron" size={16} color={color.white} />
        )}
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: space.sm + 2, paddingHorizontal: space.md + 2 },
  texts: { flex: 1, minWidth: 0 },
  text: { opacity: 0.85, marginTop: 1 },
  cta: { height: 32, paddingHorizontal: space.md + 2, borderRadius: size.touch, alignItems: 'center', justifyContent: 'center', backgroundColor: color.white },
});
