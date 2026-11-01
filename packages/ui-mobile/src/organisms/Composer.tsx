import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { color, fontFamily, hard, radius, space } from '../foundations/theme';
import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';

export interface ComposerProps {
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
  maxLength: number;
  disabled?: boolean;
  disabledReason?: string | null;
  /** Suggestion du pet préremplie, jamais envoyée automatiquement. */
  draft?: string;
  onDraftChange?: (t: string) => void;
}

export function Composer({ placeholder, sendLabel, onSend, maxLength, disabled, disabledReason, draft, onDraftChange }: ComposerProps) {
  const [local, setLocal] = useState('');
  const value = draft ?? local;
  const set = onDraftChange ?? setLocal;
  if (disabled && disabledReason) {
    return (
      <View style={styles.disabled} accessibilityLiveRegion="polite">
        <Text variant="small" tone="inkSoft" align="center">
          {disabledReason}
        </Text>
      </View>
    );
  }
  const send = () => {
    const t = value.trim();
    if (!t) return;
    onSend(t);
    set('');
  };
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        placeholderTextColor={color.mutedLight}
        accessibilityLabel={placeholder}
        multiline
        maxLength={maxLength}
        editable={!disabled}
        style={styles.input}
        maxFontSizeMultiplier={2}
        testID="composer-input"
      />
      <IconButton icon="send" tone="coral" accessibilityLabel={sendLabel} onPress={send} testID="composer-send" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  input: { flex: 1, minHeight: 44, maxHeight: 140, borderRadius: radius.md, backgroundColor: color.white, paddingHorizontal: space.lg, paddingVertical: space.md, fontFamily: fontFamily.body, fontSize: 16, color: color.ink, ...hard(3, color.creamShadow) },
  disabled: { padding: space.lg, backgroundColor: color.creamDeep },
});
