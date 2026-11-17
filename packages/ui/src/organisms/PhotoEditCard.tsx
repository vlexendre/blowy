import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { PortraitTile } from '../molecules/PortraitTile';
import { petTint, space } from '../theme';
import type { PetLook } from '../types';

export interface PhotoEditCardProps {
  uri?: string | null;
  photoLabel: string;
  /** « ta photo reste cachée dans un lien jusqu'au niveau 4… » */
  hint: string;
  actionLabel: string;
  loading?: boolean;
  onPress: () => void;
  /** Sous la photo, sur toute la largeur : ce qui arrive à la photo envoyée (vérification automatique, prestataire). */
  note?: string;
  /** Sans photo, ton minimoa tient la place (plutôt qu'une silhouette). */
  pet?: PetLook;
}

/** Carte de Mon compte : ta photo nette, l'explication, « changer la photo ». */
export function PhotoEditCard({ uri, photoLabel, hint, actionLabel, loading, onPress, note, pet }: PhotoEditCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {!uri && pet ? (
          <View style={[styles.petTile, { backgroundColor: petTint[pet.species] }]} accessible accessibilityRole="image" accessibilityLabel={photoLabel}>
            <Avatar size={76} pet={pet} hidden />
          </View>
        ) : (
          <PortraitTile uri={uri} width={84} height={104} radius={20} accessibilityLabel={photoLabel} />
        )}
        <View style={styles.texts}>
          <Text variant="small" muted>
            {hint}
          </Text>
          <Button label={actionLabel} variant="ghost" size="sm" block={false} loading={loading} onPress={onPress} />
        </View>
      </View>
      {note ? (
        <Text variant="small" muted style={styles.note}>
          {note}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md + 2 },
  texts: { flex: 1, minWidth: 0, gap: space.sm },
  note: { lineHeight: 18 },
  petTile: { width: 84, height: 104, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
