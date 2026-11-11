import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, type GradientName, opacity, radius, size, space } from '../theme';

export interface ChoiceCardProps {
  title: string;
  /** Petite ligne en capitales (« → casanier »). */
  caption?: string;
  /** Icône 3D à gauche, ou élément libre. */
  icon?: IconName | ReactNode;
  /** Dégradé du fond. Défaut `night` (carte sombre). */
  gradient?: GradientName;
  selected?: boolean;
  /** Réponse non retenue après le choix : estompée. */
  faded?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Réponse de quiz ou de défi : grande carte touchable. */
export function ChoiceCard({ title, caption, icon, gradient = 'night', selected, faded, disabled, onPress, accessibilityLabel, style }: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      haptic="selection"
      scaleTo={0.97}
      accessibilityLabel={accessibilityLabel ?? (caption ? `${title}, ${caption}` : title)}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[faded && styles.faded, style]}
    >
      <Panel gradient={gradient} radius="lg" padding="none" style={[styles.panel, selected && styles.selected]}>
        <View style={[layout.row, styles.row]}>
          {typeof icon === 'string' ? <Icon name={icon as IconName} size={44} /> : icon}
          <View style={[layout.grow, styles.texts]}>
            <Text variant="bodyBold" size={17}>
              {title}
            </Text>
            {caption ? (
              <Text variant="label" size={10} dim>
                {caption}
              </Text>
            ) : null}
          </View>
          {selected ? <Glyph name="check" size={18} /> : null}
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: size.button.lg + space.xl },
  selected: { borderWidth: 3, borderColor: color.white },
  row: { gap: space.md, paddingHorizontal: space.lg + 2, paddingVertical: space.lg, borderRadius: radius.lg },
  texts: { gap: space.xs },
  faded: { opacity: opacity.disabled },
});
