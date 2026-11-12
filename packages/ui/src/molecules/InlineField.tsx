import { type ComponentRef, type Ref, useState } from 'react';
import { type StyleProp, StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, size, space, type, veil } from '../theme';

export interface InlineFieldProps extends Omit<TextInputProps, 'style'> {
  /** Petit libellé en capitales, dans le cadre (`.fld span`). */
  label: string;
  /** Message d'erreur sous le champ (bordure rouge). */
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

const VALUE = { ...type.bodyBold, fontSize: 17, lineHeight: 22 } as const;

/**
 * Champ des réglages (`.fld`) : libellé et valeur dans le même cadre, bordure jaune au focus.
 * `editable={false}` : valeur grisée (e-mail, date de naissance).
 */
export function InlineField({ label, error, style, editable = true, onFocus, onBlur, accessibilityLabel, ref, ...rest }: InlineFieldProps) {
  const [focused, setFocused] = useState(false);
  const border = error ? color.danger : focused ? color.accent : veil.glass;
  const box = [styles.box, { borderColor: border }, style];
  const labelNode = (
    <Text variant="label" size={11} muted style={styles.label}>
      {label}
    </Text>
  );
  if (!editable) {
    return (
      <View style={box} accessible accessibilityLabel={`${label} : ${rest.value ?? ''}`}>
        {labelNode}
        <Text style={VALUE} color={color.mute} numberOfLines={1}>
          {rest.value}
        </Text>
      </View>
    );
  }
  let input: ComponentRef<typeof TextInput> | null = null;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => input?.focus()} scaleTo={1} haptic={false} accessible={false} style={box}>
        {labelNode}
        <TextInput
          ref={(node) => {
            input = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as { current: typeof node }).current = node;
          }}
          {...rest}
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
          style={[VALUE, styles.input]}
        />
      </Pressable>
      {error ? (
        <Text variant="small" size={12} color={color.danger} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  box: {
    backgroundColor: color.card,
    borderWidth: size.border,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: space.lg,
    gap: 1,
  },
  label: { fontFamily: type.bodyHeavy.fontFamily, letterSpacing: 11 * 0.1 },
  input: { color: color.white, padding: 0, margin: 0, outlineWidth: 0, outlineStyle: 'solid' },
  error: { paddingHorizontal: space.xs + 2 },
});
