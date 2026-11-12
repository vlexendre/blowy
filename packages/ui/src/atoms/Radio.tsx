import { StyleSheet, View } from 'react-native';

import { color, extra, radius } from '../theme';

export interface RadioProps {
  selected: boolean;
}

/** Bouton radio des maquettes (`.rad`) : anneau de 22, jaune et pastille pleine quand choisi. Décoratif : la ligne porte le rôle. */
export function Radio({ selected }: RadioProps) {
  return (
    <View accessible={false} style={[styles.ring, selected && styles.on]}>
      {selected ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: extra.radioOff, alignItems: 'center', justifyContent: 'center' },
  on: { borderColor: color.accent },
  // `radial-gradient(circle, #FFB800 0 45%, transparent 50%)` sur 18 pt intérieurs : ≈ 11 pt.
  dot: { width: 11, height: 11, borderRadius: radius.pill, backgroundColor: color.accent },
});
