import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { alpha, color, extra } from '../theme';

export interface PetSummaryItem {
  text: string;
  /** `up` jaune (hausse), `down` corail (baisse), `neutral` voile blanc. */
  tone: 'up' | 'down' | 'neutral';
}

export interface PetSummaryAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export interface PetSummaryProps {
  /** « 7 jours ». */
  label: string;
  items: readonly PetSummaryItem[];
  /** Bouton jaune (« son évolution »). */
  primary: PetSummaryAction;
  /** Bouton verre (« garde-robe ») suivi de la puce « + » de Blowy+. */
  secondary?: PetSummaryAction & { plus?: string };
}

const TONE = {
  up: { bg: alpha(color.accent, 0.14), ink: color.accent },
  down: { bg: alpha(color.coral, 0.16), ink: extra.coralSoft },
  neutral: { bg: alpha(color.white, 0.12), ink: color.white },
} as const;

/** Bilan des 7 derniers jours en puces, puis les deux boutons de l'onglet Mon pet. */
export function PetSummary({ label, items, primary, secondary }: PetSummaryProps) {
  return (
    <View style={styles.wrap}>
      {items.length ? (
        <View style={[layout.row, styles.week]}>
          <Text variant="bodyHeavy" size={11} muted style={styles.label}>
            {label}
          </Text>
          {items.map((it, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: TONE[it.tone].bg }]}>
              <Text variant="bodyHeavy" size={12} color={TONE[it.tone].ink} numberOfLines={1}>
                {it.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={[layout.row, styles.actions]}>
        <Button label={primary.label} onPress={primary.onPress} accessibilityLabel={primary.accessibilityLabel} labelSize={16} block={false} style={layout.fill} />
        {secondary ? (
          <Button
            label={secondary.label}
            onPress={secondary.onPress}
            accessibilityLabel={secondary.accessibilityLabel}
            variant="ghost"
            labelSize={16}
            block={false}
            style={layout.fill}
            trailing={
              secondary.plus ? (
                <LinearGradient colors={[color.violet, color.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
                  <InkProvider value={color.white}>
                    <Text variant="bodyHeavy" size={10}>
                      {secondary.plus}
                    </Text>
                  </InkProvider>
                </LinearGradient>
              ) : undefined
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  week: { flexWrap: 'wrap', gap: 6 },
  label: { letterSpacing: 1.32, marginRight: 2, textTransform: 'uppercase' },
  chip: { height: 26, paddingHorizontal: 11, borderRadius: 999, justifyContent: 'center' },
  actions: { gap: 8 },
  plus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
});
