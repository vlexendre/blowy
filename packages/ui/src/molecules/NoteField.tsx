import { useState } from 'react';
import { type StyleProp, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { color, type, veil } from '../theme';

export interface NoteFieldProps {
  /** Libellé en capitales dans la case (« précise si tu veux (facultatif) »). */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

/** Zone de texte libre (`.fld` des maquettes) : libellé dans la case, texte sur plusieurs lignes. */
export function NoteField({ label, value, onChangeText, placeholder, maxLength = 1000, minHeight = 96, style }: NoteFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.box, { minHeight }, focused && styles.on, style]}>
      <Text variant="label" size={11} muted style={styles.label}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.mute}
        selectionColor={color.accent}
        accessibilityLabel={label}
        maxLength={maxLength}
        multiline
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[type.body, styles.input]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // `.fld` : fond carte, filet blanc à 10 %, rayon 18, padding 9 16 ; jaune quand on écrit.
  box: { backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass, borderRadius: 18, paddingVertical: 9, paddingHorizontal: 16, gap: 1 },
  on: { borderColor: color.accent },
  label: { letterSpacing: 1.1 },
  input: { flex: 1, fontSize: 15, lineHeight: 20, color: color.white, padding: 0, textAlignVertical: 'top' },
});
