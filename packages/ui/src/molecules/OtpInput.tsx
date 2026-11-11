import { type ComponentRef, useRef } from 'react';
import { type StyleProp, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, size, space, type } from '../theme';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Appelé quand tous les chiffres sont saisis. */
  onComplete?: (value: string) => void;
  length?: number;
  error?: string | null;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Libellé lu (« code reçu par e-mail »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Saisie d'un code à 6 chiffres : un champ caché, des cases visibles. Gère le remplissage automatique. */
export function OtpInput({ value, onChange, onComplete, length = 6, error, autoFocus, disabled, accessibilityLabel = 'code', style }: OtpInputProps) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.replace(/\D/g, '').slice(0, length);
  const set = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };
  return (
    <View style={[styles.wrap, style]}>
      <Pressable onPress={() => input.current?.focus()} haptic={false} scaleTo={1} accessibilityRole="none" accessible={false} style={styles.row}>
        {Array.from({ length }, (_, i) => {
          const ch = digits[i];
          const active = i === Math.min(digits.length, length - 1) && !disabled;
          return (
            <View key={i} style={[styles.cell, active && styles.active, error ? styles.error : null]}>
              <Text variant="h2" size={28}>
                {ch ?? ''}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={digits}
        onChangeText={set}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        style={styles.hidden}
      />
      {error ? (
        <Text variant="small" color={color.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  cell: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: radius.sm + 2,
    backgroundColor: color.panel,
    borderWidth: size.border + 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: color.accent },
  error: { borderColor: color.danger },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, opacity: 0, color: 'transparent', ...type.body },
});
