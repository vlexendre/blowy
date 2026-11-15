import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, space } from '../theme';

export interface NoteCardProps {
  /** Petite ligne au-dessus (« Ce que Nino a remarqué »). */
  kicker?: string;
  /** Le texte (servi par l'API). */
  text: string;
  /** Visuel à gauche. */
  icon?: ReactNode;
  /** Filet d'accent (une idée, une proposition). */
  accent?: boolean;
  /** Contenu sous le texte (une barre de vision). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Carte de texte calme (V6-GBilan : ce que le minimoa a remarqué, une idée pour la semaine). */
export function NoteCard({ kicker, text, icon, accent = false, children, style }: NoteCardProps) {
  return (
    <Card padding="none" highlight={accent ? color.accent : undefined} style={[styles.card, style]}>
      <View style={[layout.rowTop, styles.row]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <View style={layout.grow}>
          {kicker ? (
            <Text variant="bodyBold" size={14} muted>
              {kicker}
            </Text>
          ) : null}
          <Text size={17} style={kicker ? styles.text : undefined}>
            {text}
          </Text>
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: space.lg, gap: space.md },
  row: { gap: space.md },
  icon: { width: 40, alignItems: 'center', paddingTop: 2 },
  text: { marginTop: 2 },
});
