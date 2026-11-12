import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Toggle } from '../atoms/Toggle';
import { layout } from '../lib/styles';
import { color, extra, size, space, veil } from '../theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Action irréversible (supprimer, bloquer) : texte rouge, pas de chevron (sauf `chevron`). */
  destructive?: boolean;
  /** Élément à gauche (icône, avatar). */
  left?: ReactNode;
  /** Élément à droite à la place du chevron. */
  right?: ReactNode;
  /** Chevron ; défaut : présent si `onPress` et pas destructif. */
  chevron?: boolean;
  /** Interrupteur à droite (préférences). */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  /** Piste de l'interrupteur éteint (défaut `.sw.off`). */
  switchOffColor?: string;
  /** Filet sous la ligne. Défaut vrai. */
  divider?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ligne de réglages (`.it`) : titre, sous-titre, chevron / interrupteur / action rouge. */
export function ListRow({
  title,
  subtitle,
  onPress,
  destructive,
  left,
  right,
  chevron,
  switchValue,
  onSwitchChange,
  switchOffColor,
  divider = true,
  disabled,
  accessibilityLabel,
  style,
}: ListRowProps) {
  const hasSwitch = switchValue !== undefined;
  const showChevron = chevron ?? (!!onPress && !destructive && !hasSwitch && !right);
  const body = (
    <>
      {left}
      <View style={layout.grow}>
        <Text variant="bodyBold" size={15} color={destructive ? extra.dangerSoft : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" size={12} muted style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {hasSwitch ? (
        <Toggle value={switchValue} onValueChange={onSwitchChange} disabled={disabled} offColor={switchOffColor} accessibilityLabel={accessibilityLabel ?? title} />
      ) : null}
      {showChevron ? <Glyph name="chevron" size={16} color={color.mute} /> : null}
    </>
  );
  const s = [styles.base, layout.row, divider && styles.divider, disabled && !hasSwitch && styles.disabled, style];
  if (onPress && !hasSwitch) {
    return (
      <Pressable onPress={onPress} disabled={disabled} scaleTo={0.99} dimTo={0.72} accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)} style={s}>
        {body}
      </Pressable>
    );
  }
  return <View style={s}>{body}</View>;
}

const styles = StyleSheet.create({
  base: { minHeight: 54, paddingVertical: space.xs + 2, gap: space.md },
  subtitle: { marginTop: 1 },
  divider: { borderBottomWidth: size.border, borderBottomColor: veil.hairline },
  disabled: { opacity: 0.5 },
});
