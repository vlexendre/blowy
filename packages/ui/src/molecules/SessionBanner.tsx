import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { color, extra, space } from '../theme';

export interface SessionBannerProps {
  /** Ce que dure la séance (« Séance du jour · 5 questions · 2 min »). */
  kicker: string;
  /** Le titre réel de l'univers du jour, en titre (« Ta façon de vivre »). */
  title: string;
  /** Ce qu'il y a au bout (« À la fin : ta personne du jour »). */
  note: string;
}

/**
 * Le bandeau de la séance du jour (V6-GAccueil `.bandeau`) : violet en relief (tranche plus foncée dessous), tout le
 * texte en blanc (5,3:1). Il annonce, il ne se touche pas : la seule action est l'étape du jour, sur le chemin.
 * VoiceOver : trois éléments dans l'ordre, le titre de l'univers garde son rôle d'en-tête (rotor « En-têtes »).
 */
export function SessionBanner({ kicker, title, note }: SessionBannerProps) {
  return (
    <View style={styles.card}>
      <Text variant="bodyBold" size={15} color={color.white}>
        {kicker}
      </Text>
      <Text variant="h2" size={30} color={color.white} style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text variant="bodyBold" size={15} color={color.white}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // `.bandeau` : rayon 24, marge 12 16, tranche de 5 pt.
  card: {
    borderRadius: 24,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: extra.relief.unit,
    borderBottomWidth: 5,
    borderBottomColor: extra.relief.unitEdge,
  },
  // `.titre` : 22 pt rendus (taille de maquette 30 × 0,74).
  title: { marginVertical: space.xs },
});
