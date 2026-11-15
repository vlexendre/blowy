import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { RichText } from '../atoms/RichText';
import { layout } from '../lib/styles';
import { color, space, veil } from '../theme';

export interface TipRowProps {
  /** Visuel à gauche (joker, cadenas, picto), posé dans un disque. */
  icon: ReactNode;
  /** Début en gras (« 1 joker cette semaine. »). */
  lead?: string;
  /** Suite, plus claire. */
  text: string;
  /** Couleur du disque. Défaut verre. */
  disc?: string;
  /** Taille du disque. Défaut 44 ; `0` : pas de disque (le picto seul, ex. un petit cadenas). */
  discSize?: number;
  style?: StyleProp<ViewStyle>;
}

/** Une ligne d'explication avec son picto (V6-GSerie : le joker ; V6-GPreuve : la photo n'est vue par personne). */
export function TipRow({ icon, lead, text, disc, discSize = 44, style }: TipRowProps) {
  return (
    <View accessible accessibilityLabel={[lead, text].filter(Boolean).join(' ')} style={[layout.row, styles.row, style]}>
      {discSize > 0 ? <View style={[styles.disc, { width: discSize, height: discSize, borderRadius: discSize / 2, backgroundColor: disc ?? veil.glass }]}>{icon}</View> : icon}
      <RichText
        size={15}
        style={layout.grow}
        runs={[...(lead ? [{ text: lead, variant: 'bodyHeavy' as const, color: color.white }] : []), { text: lead ? ` ${text}` : text, color: color.mute }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md },
  disc: { alignItems: 'center', justifyContent: 'center' },
});
