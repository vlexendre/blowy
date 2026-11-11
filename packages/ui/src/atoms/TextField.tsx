import { type ComponentRef, type ReactNode, type Ref, useState } from 'react';
import { type StyleProp, StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { layout } from '../lib/styles';
import { color, radius, size, space, type, veil } from '../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** Petit libellé en capitales au-dessus du champ. */
  label?: string;
  /** Aide sous le champ. */
  hint?: string;
  /** Message d'erreur : remplace l'aide, bordure rouge. */
  error?: string | null;
  /** Élément à droite dans le champ (bouton « au hasard », compteur…). */
  right?: ReactNode;
  /** Grand texte gras (nom du pet). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/** Champ de saisie sombre arrondi. */
export function TextField({ label, hint, error, right, large, style, onFocus, onBlur, editable = true, accessibilityLabel, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const border = error ? color.danger : focused ? color.accent : veil.glassStrong;
  return (
    <View style={[layout.gapSm, style]}>
      {label ? (
        <Text variant="label" muted>
          {label}
        </Text>
      ) : null}
      <View style={[styles.box, layout.row, { borderColor: border }, !editable && styles.off]}>
        <TextInput
          ref={ref}
          {...rest}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={color.mute}
          selectionColor={color.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[large ? styles.large : type.body, styles.input]}
        />
        {right}
      </View>
      {error ? (
        <Text variant="small" color={color.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: size.button.lg,
    borderRadius: radius.md + 4,
    borderWidth: size.border,
    backgroundColor: color.panel,
    paddingLeft: space.lg + 4,
    paddingRight: space.sm,
    gap: space.sm,
  },
  input: { flex: 1, minWidth: 0, color: color.white, paddingVertical: space.md, minHeight: size.touch, outlineWidth: 0, outlineStyle: 'solid' },
  large: { ...type.bodyBold, fontSize: 20, lineHeight: 26 },
  off: { opacity: 0.6 },
});
