import type { Mood, Species } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { space } from '../theme';
import type { TitleContent } from '../types';

export interface EmptyStateProps {
  species?: Species;
  mood?: Mood | PetPose;
  title: TitleContent;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Écran ou bloc vide : un pet qui respire, un titre, une phrase, une action. */
export function EmptyState({ species = 'nino', mood = 'triste', title, text, actionLabel, onAction, style }: EmptyStateProps) {
  return (
    <View style={[styles.base, style]}>
      <PetImage species={species} mood={mood} size={140} animation="breathe" />
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
  action: { alignSelf: 'center', marginTop: space.sm },
});
