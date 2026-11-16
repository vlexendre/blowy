import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { radius, size, space } from '../theme';
import type { TitleContent } from '../types';

export interface PlusBannerProps {
  /** « BLOWY+ 4,99 €/MOIS » (partie estompée possible). */
  title: TitleContent;
  text: string;
  ctaLabel: string;
  onPress: () => void;
}

/** Bannière Blowy+ de Moi : panneau vin, titre Anton, bouton blanc. Toute la bannière est touchable. */
export function PlusBanner({ title, text, ctaLabel, onPress }: PlusBannerProps) {
  return (
    <Pressable onPress={onPress} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={`${typeof title === 'string' ? title : title.map((s) => s.text).join('')}. ${text}`}>
      <Panel gradient="wine" radius={radius.card} padding="none" style={styles.panel}>
        <View style={styles.texts}>
          {/* Deux lignes plutôt qu'un titre coupé (375 pt, langues longues). */}
          <Title text={title} size={22} numberOfLines={2} />
          <Text variant="body" size={12} style={styles.text}>
            {text}
          </Text>
        </View>
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <Button label={ctaLabel} variant="white" size="sm" block={false} style={styles.cta} />
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md + 2 },
  texts: { flex: 1, minWidth: 0 },
  text: { opacity: 0.85, marginTop: 2 },
  cta: { height: size.touch },
});
