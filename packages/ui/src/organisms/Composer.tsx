import { StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, radius, size, space, type, veil } from '../theme';

export type ComposerTone = 'sweet' | 'tease';

export interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  /** Lien fantôme ou bloqué : pas de saisie, `disabledText` à la place. */
  disabled?: boolean;
  disabledText?: string;
  sending?: boolean;
  /** Ton choisi (« mot doux » / « vanne ») ; affiche les bascules si `toneLabels` est fourni. */
  tone?: ComposerTone | null;
  onToneChange?: (tone: ComposerTone | null) => void;
  toneLabels?: Record<ComposerTone, string>;
  /** Bouton « + » (photo, défi, quiz). */
  onAttach?: () => void;
  attachLabel?: string;
  sendLabel?: string;
  maxLength?: number;
}

/** Barre de saisie du chat : +, champ pilule, envoyer, bascules de ton. */
export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder,
  disabled,
  disabledText,
  sending,
  tone = null,
  onToneChange,
  toneLabels,
  onAttach,
  attachLabel = 'Ajouter',
  sendLabel = 'Envoyer',
  maxLength = 2000,
}: ComposerProps) {
  if (disabled) {
    return (
      <View style={[styles.wrap, styles.disabled]} accessibilityRole="text">
        <Text variant="bodyBold" size={14} muted center>
          {disabledText ?? ''}
        </Text>
      </View>
    );
  }
  const canSend = value.trim().length > 0 && !sending;
  const toggle = (t: ComposerTone) => onToneChange?.(tone === t ? null : t);
  return (
    <View style={styles.wrap}>
      {toneLabels && onToneChange ? (
        <View style={[layout.row, layout.gapSm, styles.tones]}>
          <Chip label={toneLabels.sweet} tone="glass" selected={tone === 'sweet'} onPress={() => toggle('sweet')} />
          <Chip label={toneLabels.tease} tone="glass" selected={tone === 'tease'} onPress={() => toggle('tease')} />
        </View>
      ) : null}
      <View style={[layout.row, layout.gapSm]}>
        {onAttach ? <IconButton glyph="plus" label={attachLabel} onPress={onAttach} /> : null}
        <View style={[layout.row, styles.field]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={color.mute}
            selectionColor={color.accent}
            accessibilityLabel={placeholder}
            maxLength={maxLength}
            multiline
            style={[type.body, styles.input]}
          />
        </View>
        <IconButton glyph="send" label={sendLabel} variant="accent" onPress={onSend} disabled={!canSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.md, paddingTop: space.sm - 2, paddingBottom: space.sm, gap: space.sm },
  disabled: { minHeight: size.button.lg, justifyContent: 'center', marginHorizontal: space.md, borderRadius: radius.pill, backgroundColor: veil.line },
  tones: { paddingLeft: size.touch + space.sm },
  field: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: veil.line, borderWidth: 1, borderColor: veil.track, paddingHorizontal: space.lg },
  input: { flex: 1, color: color.white, maxHeight: 120, paddingVertical: space.sm + 2 },
});
