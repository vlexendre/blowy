import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { color, fontFamily, hard, radius, space } from '../foundations/theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Message d'erreur explicite (lu par VoiceOver). */
  error?: string | null;
  hint?: string;
}

export function TextField({ label, error, hint, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="inkSoft">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={color.mutedLight}
        maxFontSizeMultiplier={2}
        {...rest}
        style={[styles.input, error ? styles.err : null]}
      />
      {error ? (
        <Text variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: color.white,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    fontFamily: fontFamily.body,
    fontSize: 16,
    color: color.ink,
    ...hard(3, color.creamShadow),
  },
  err: { borderWidth: 2, borderColor: color.danger },
});
