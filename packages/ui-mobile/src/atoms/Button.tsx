/**
 * Bouton des maquettes : `.btn` (min 56 px, marges 0 20, rayon 18, Bricolage 800 largeur 100 %
 * 18 px, capitales, interlettrage .01em, écart 10) + variantes d'ombre dure 5 px :
 *   b1 corail / #C4341B · b2 encre / #000 · b3 blanc / #E8D9C4 · lime (`.bl` V3) / encre.
 * `link` = `.bl` de V4-Welcome (transparent, Inter 13 px 700, min 44) ; `ghost` = `.ghost`
 * (Inter 14 px 700, min 44). Appui : descend de 4 px et perd l'ombre.
 */
import { ActivityIndicator, Text as RNText, View } from 'react-native';
import { color } from '../foundations/theme';
import { resolveButton, type ButtonSize, type ButtonVariant } from './styles';
import { Icon, type IconName } from './Icon';
import { Glyph } from './Glyph';
import { Pressable3D } from './Pressable3D';

export type { ButtonSize, ButtonVariant };

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Icône après le libellé (flèche « Commencer → »). */
  iconPosition?: 'leading' | 'trailing';
  loading?: boolean;
  disabled?: boolean;
  /** Libellé vocal si différent du libellé visible. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  fullWidth?: boolean;
  /** Couleur du texte des variantes texte (`.ghost` : #5A5047 ou encre selon l'écran). */
  tint?: string;
}

export function Button({ label, onPress, variant = 'b1', size = 'lg', icon, iconPosition = 'leading', loading, disabled, accessibilityLabel, accessibilityHint, testID, fullWidth = true, tint }: ButtonProps) {
  const busy = !!loading;
  const r = resolveButton(variant, size);
  const fg = tint ?? r.surface?.fg ?? color.ink;
  const inactive = variant === 'bdis';
  const glyph = busy ? <ActivityIndicator color={fg} /> : icon === 'arrow' && size !== 'v4' ? <Glyph name="arrow" color={fg} size={22} /> : icon ? <Icon name={icon} tint={fg} size={size === 'sm' ? 18 : 22} strokeWidth={icon === 'arrow' ? 2.8 : 2.2} /> : null;
  const text = (
    <RNText style={[r.text, tint ? { color: tint } : null]} numberOfLines={1} maxFontSizeMultiplier={1.5}>
      {label}
    </RNText>
  );
  const inner =
    iconPosition === 'trailing' ? (
      <>
        {text}
        {glyph}
      </>
    ) : (
      <>
        {glyph}
        {text}
      </>
    );
  return (
    <Pressable3D
      background={r.surface?.bg ?? 'transparent'}
      shadowColor={r.surface?.shadow ?? 'transparent'}
      depth={r.kind === 'solid' && !inactive ? 5 : 0}
      radius={18}
      onPress={onPress}
      disabled={disabled || busy || inactive}
      dimWhenDisabled={!inactive}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || inactive, busy }}
      testID={testID}
      style={[r.box, fullWidth ? { alignSelf: 'stretch' } : null]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{inner}</View>
    </Pressable3D>
  );
}
