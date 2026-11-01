import { ActivityIndicator, StyleSheet } from 'react-native';
import { space, tone } from '../foundations/theme';
import { Icon, type IconName } from './Icon';
import { Pressable3D } from './Pressable3D';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'lime' | 'ghost' | 'dark' | 'danger' | 'violet';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Libellé vocal si différent du libellé visible. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  fullWidth?: boolean;
}

const VARIANT: Record<Exclude<ButtonVariant, 'ghost'>, keyof typeof tone> = {
  primary: 'coral',
  secondary: 'white',
  lime: 'lime',
  dark: 'ink',
  danger: 'danger',
  violet: 'violet',
};

const HEIGHT: Record<ButtonSize, number> = { lg: 56, md: 48, sm: 44 };

/** Bouton 3D (maquette .btn/.b1/.b2/.b3) ; « fantôme » = texte souligné sans surface. */
export function Button({ label, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, accessibilityLabel, accessibilityHint, testID, fullWidth = true }: ButtonProps) {
  const busy = !!loading;
  if (variant === 'ghost') {
    return (
      <Pressable3D
        background="transparent"
        shadowColor="transparent"
        depth={0}
        onPress={onPress}
        disabled={disabled || busy}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled, busy }}
        testID={testID}
        style={[styles.row, { minHeight: HEIGHT.sm }, fullWidth && styles.full]}
      >
        <Text variant="bodyStrong" tone="inkSoft" style={styles.ghost}>
          {label}
        </Text>
      </Pressable3D>
    );
  }
  const t = tone[VARIANT[variant]];
  return (
    <Pressable3D
      background={t.bg}
      shadowColor={t.shadow}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy }}
      testID={testID}
      style={[styles.row, { minHeight: HEIGHT[size] }, fullWidth && styles.full]}
    >
      {busy ? <ActivityIndicator color={t.fg} /> : icon ? <Icon name={icon} tint={t.fg} size={size === 'sm' ? 18 : 22} /> : null}
      <Text variant={size === 'sm' ? 'displayS' : 'button'} style={{ color: t.fg }} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
  full: { alignSelf: 'stretch' },
  ghost: { textDecorationLine: 'underline' },
});
