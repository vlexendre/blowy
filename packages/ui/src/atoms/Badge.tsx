import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { PopIn } from '../motion/PopIn';
import { color, extra, radius, space } from '../theme';
import { Text } from './Text';

export interface BadgeProps {
  count: number;
  /** Au-delà, affiche « max+ ». Défaut 99. */
  max?: number;
  /** `light` : fond blanc, encre sombre (barre d'onglets, ADA-2027 §0 : 18,7:1 au lieu de blanc sur rose). */
  tone?: 'heart' | 'accent' | 'light';
  /** `tab` : pastille de 20 pt de la barre d'onglets, chiffre 13 pt. Défaut `md` (18 pt). */
  size?: 'tab' | 'md';
  /** « Pop » aussi à l'apparition (0 → 1). Défaut faux : dans une liste recyclée, seule une variation du nombre anime. */
  popOnMount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pastille de compteur (non lus, demandes). Rien n'est rendu à 0. Elle fait « pop » à l'arrivée et à chaque changement. */
export function Badge({ count, max = 99, tone = 'heart', size = 'md', popOnMount = false, accessibilityLabel, style }: BadgeProps) {
  if (count <= 0) return null;
  const bg = tone === 'heart' ? extra.heart : tone === 'light' ? color.white : color.accent;
  const ink = tone === 'heart' ? color.white : color.dark;
  const tab = size === 'tab';
  return (
    <PopIn trigger={count} onMount={popOnMount} style={style}>
      <View
        accessible
        accessibilityLabel={accessibilityLabel ?? String(count)}
        style={[styles.base, tab && styles.tab, { backgroundColor: bg }]}
      >
        {/* Pastille d'onglet : taille fixe, comme la barre (le Large Content Viewer de l'onglet la montre en grand). */}
        <Text variant="label" size={tab ? 13 : 10} color={ink} maxFontSizeMultiplier={tab ? 1 : undefined} style={styles.text}>
          {count > max ? `${max}+` : String(count)}
        </Text>
      </View>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  base: { minWidth: 18, height: 18, paddingHorizontal: space.xs + 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  // `.pastille` : 20 pt, cerclée du fond de la barre (2 pt) pour se détacher du pictogramme.
  tab: { minWidth: 20, height: 20, paddingHorizontal: 5, borderWidth: 2, borderColor: color.panel },
  text: { letterSpacing: 0 },
});
