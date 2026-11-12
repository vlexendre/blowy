import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, gradient, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface QuizResultProps {
  kicker: string;
  title: TitleContent;
  text: string;
  species: Species;
  petLabel?: string;
}

/** Fin du quiz (V6-Caractere) : panneau jaune « c'est nino. pour l'instant. » et le pet content. */
export function QuizResult({ kicker, title, text, species, petLabel }: QuizResultProps) {
  return (
    <View style={styles.panel}>
      <LinearGradient colors={gradient.accent} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.pet}>
        <PetImage species={species} mood="joie" size={230} rotate={-5} animation="breathe" outline accessibilityLabel={petLabel} />
      </View>
      <InkProvider value={color.dark}>
        <Text variant="label" size={11} style={styles.kicker}>
          {kicker}
        </Text>
        <Title text={title} size={50} style={styles.title} />
        <Text variant="bodyBold" size={16} style={styles.text}>
          {text}
        </Text>
      </InkProvider>
    </View>
  );
}

export interface QuizResultActionsProps {
  redoLabel: string;
  onRedo: () => void;
  ctaLabel: string;
  onCta: () => void;
}

/** « refaire » (verre) + « continuer » (jaune, pleine largeur restante). */
export function QuizResultActions({ redoLabel, onRedo, ctaLabel, onCta }: QuizResultActionsProps) {
  return (
    <View style={[layout.row, styles.actions]}>
      <Button label={redoLabel} variant="ghost" block={false} onPress={onRedo} style={styles.redo} />
      <Button label={ctaLabel} iconRight="arrow" onPress={onCta} style={layout.grow} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, minHeight: 320, borderRadius: radius.xl - 4, overflow: 'hidden', paddingTop: 20, paddingHorizontal: 20, marginTop: 2 },
  pet: { position: 'absolute', right: -40, bottom: -36 },
  kicker: { letterSpacing: 1.32, opacity: 0.6 },
  title: { marginTop: space.sm },
  text: { marginTop: 10, maxWidth: 210, lineHeight: 21 },
  actions: { gap: 10 },
  redo: { alignSelf: 'auto' },
});
