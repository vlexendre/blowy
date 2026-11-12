import type { Mood, Species } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { PetPeek } from '../motion/pets/PetPeek';
import { space } from '../theme';
import type { TitleContent } from '../types';

export interface EmptyStateProps {
  species?: Species;
  mood?: Mood | PetPose;
  title: TitleContent;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Le pet passe la tête au-dessus du titre au lieu de respirer au centre : il sort, regarde, se cache si on le
   * touche et ressort (cache-cache). Pour les états vides, les erreurs (`mood="triste"`) et le hors-ligne.
   */
  peek?: boolean;
  /** Graine du pet qui passe la tête (id du pet). */
  seed?: string;
  style?: StyleProp<ViewStyle>;
}

/** Écran ou bloc vide : un pet qui respire, un titre, une phrase, une action. */
export function EmptyState({ species = 'nino', mood = 'triste', title, text, actionLabel, onAction, peek, seed, style }: EmptyStateProps) {
  return (
    <View style={[styles.base, style]}>
      {peek ? (
        <PetPeek inline species={species} mood={mood} size={150} seed={seed} style={styles.peek} />
      ) : (
        <PetImage species={species} mood={mood} size={140} animation="breathe" />
      )}
      <Title text={title} variant="h2" center />
      {text ? (
        <Text muted center style={styles.text}>
          {text}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} size="md" block={false} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', gap: space.md, paddingVertical: space.xl, paddingHorizontal: space.lg },
  text: { maxWidth: 300 },
  // Le pet sort de derrière le titre : son cadre touche le haut du titre.
  peek: { marginBottom: -space.md },
  action: { alignSelf: 'center', marginTop: space.sm },
});
