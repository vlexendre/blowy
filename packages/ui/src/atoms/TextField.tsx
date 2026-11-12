import { type ComponentRef, type ReactNode, type Ref, useState } from 'react';
import { type StyleProp, StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { layout } from '../lib/styles';
import { color, radius, size, space, type, veil } from '../theme';
import { FocusRing } from './FocusRing';
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
  /** Libellé dans la case, au-dessus de la valeur (`.fld` de V6-Profil : 17 pt gras sur fond `card`). */
  inset?: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/** Champ de saisie sombre arrondi. */
export function TextField({ label, hint, error, right, large, inset, style, onFocus, onBlur, editable = true, accessibilityLabel, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  // Au focus, la bordure jaune arrive en fondu par-dessus (`FocusRing`) : le champ « s'allume ».
  const border = error ? color.danger : inset ? veil.glass : veil.glassStrong;
  const lit = focused && !error && editable;
  const input = (
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
      style={[inset ? styles.insetInput : large ? styles.large : type.body, styles.input, inset && styles.insetPad]}
    />
  );
  const note = error ? (
    <Text variant="small" color={color.danger} accessibilityLiveRegion="polite" style={styles.hint}>
      {error}
    </Text>
  ) : hint ? (
    <Text variant="small" muted size={inset ? 12 : undefined} style={[styles.hint, inset && styles.insetHint]}>
      {hint}
    </Text>
  ) : null;
  if (inset) {
    return (
      <View style={style}>
        <View style={[styles.inset, { borderColor: border }, !editable && styles.off]}>
          {label ? (
            <Text variant="label" muted size={11} style={styles.insetLabel}>
              {label}
            </Text>
          ) : null}
          {input}
          <FocusRing on={lit} radius={radius.md} />
        </View>
        {note}
      </View>
    );
  }
  return (
    <View style={style}>
      {label ? (
        <Text variant="label" muted style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.box, layout.row, { borderColor: border }, !editable && styles.off]}>
        {input}
        {right ? <View style={styles.right}>{right}</View> : null}
        <FocusRing on={lit} radius={radius.md + 2} />
      </View>
      {note}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: size.button.lg,
    borderRadius: radius.md + 2,
    borderWidth: size.border,
    backgroundColor: color.panel,
    paddingLeft: space.lg + 2,
    paddingRight: space.sm,
    gap: space.sm,
  },
  input: { flex: 1, minWidth: 0, color: color.white, paddingVertical: space.md, minHeight: size.touch, outlineWidth: 0, outlineStyle: 'solid' },
  large: { ...type.bodyHeavy, fontSize: 20, lineHeight: 26 },
  // `.lbl` des maquettes : 11 px, approche .12 em, décalé de 4 px.
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 1.32, marginHorizontal: space.xs, marginBottom: space.xs + 2 },
  hint: { marginHorizontal: space.xs + 2, marginTop: space.sm },
  right: { alignSelf: 'center' },
  inset: { borderRadius: radius.md, borderWidth: size.border, backgroundColor: color.card, paddingVertical: 9, paddingHorizontal: space.lg, gap: 1 },
  insetLabel: { lineHeight: 14, letterSpacing: 1.1 },
  insetInput: { ...type.bodyBold, fontSize: 17, lineHeight: 22 },
  insetHint: { marginTop: 10, lineHeight: 16 },
  insetPad: { paddingVertical: 0, minHeight: 23 },
  off: { opacity: 0.6 },
});
