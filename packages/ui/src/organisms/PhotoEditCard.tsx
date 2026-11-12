import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { PortraitTile } from '../molecules/PortraitTile';
import { space } from '../theme';

export interface PhotoEditCardProps {
  uri?: string | null;
  photoLabel: string;
  /** « ta photo reste cachée dans un lien jusqu'au niveau 4… » */
  hint: string;
  actionLabel: string;
  loading?: boolean;
  onPress: () => void;
}

/** Carte de Mon compte : ta photo nette, l'explication, « changer la photo ». */
export function PhotoEditCard({ uri, photoLabel, hint, actionLabel, loading, onPress }: PhotoEditCardProps) {
  return (
    <Card style={styles.card}>
      <PortraitTile uri={uri} width={84} height={104} radius={20} accessibilityLabel={photoLabel} />
      <View style={styles.texts}>
        <Text variant="small" muted>
          {hint}
        </Text>
        <Button label={actionLabel} variant="ghost" size="sm" block={false} loading={loading} onPress={onPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: space.md + 2 },
  texts: { flex: 1, minWidth: 0, gap: space.sm },
});
