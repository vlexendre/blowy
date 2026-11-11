import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, Switch, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, size, space, veil } from '../theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Action irréversible (supprimer, bloquer) : texte rouge, pas de chevron. */
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
  /** Filet sous la ligne. Défaut vrai. */
  divider?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ligne de réglages : titre, sous-titre, chevron / interrupteur / action rouge. */
export function ListRow({ title, subtitle, onPress, destructive, left, right, chevron, switchValue, onSwitchChange, divider = true, disabled, accessibilityLabel, style }: ListRowProps) {
  const hasSwitch = switchValue !== undefined;
  const showChevron = chevron ?? (!!onPress && !destructive && !hasSwitch && !right);
  const body = (
    <>
      {left}
      <View style={[layout.grow, styles.texts]}>
        <Text variant="bodyBold" size={17} color={destructive ? color.danger : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel ?? title}
          trackColor={{ false: veil.track, true: color.accent }}
          thumbColor={color.white}
          ios_backgroundColor={veil.track}
        />
      ) : null}
      {showChevron ? <Glyph name="chevron" size={16} color={color.mute} /> : null}
    </>
  );
  const s = [styles.base, layout.row, divider && styles.divider, disabled && styles.disabled, style];
  if (onPress && !hasSwitch) {
    return (
      <Pressable onPress={onPress} disabled={disabled} scaleTo={0.99} accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)} style={s}>
        {body}
      </Pressable>
    );
  }
  return <View style={s}>{body}</View>;
}

const styles = StyleSheet.create({
  base: { minHeight: size.touch + 12, paddingVertical: space.md, paddingHorizontal: space.xs, gap: space.md },
  texts: { gap: 2 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: veil.hairline },
  disabled: { opacity: 0.5 },
});
