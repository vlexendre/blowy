import type { Species } from '@blowy/domain';
import { resolveSprite } from '@blowy/sprites';
import { ScrollView, StyleSheet, View } from 'react-native';
import { color, radius, space, tone } from '../foundations/theme';
import { Badge } from '../atoms/Badge';
import { Pressable3D } from '../atoms/Pressable3D';
import { Sprite } from '../atoms/Sprite';
import { Text } from '../atoms/Text';

export interface SpeciesOption {
  species: Species;
  name: string;
  /** Pastille « PLUS » pour les espèces premium. */
  tag?: string | null;
  accessibilityLabel: string;
}

/** Sélecteur d'espèce (maquette Craft) : sprite + nom, sélection = fond encre. */
export function PetCarousel({ options, selected, onSelect }: { options: readonly SpeciesOption[]; selected: Species; onSelect: (s: Species) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.species === selected;
        const t = tone[on ? 'ink' : 'white'];
        return (
          <Pressable3D
            key={o.species}
            background={t.bg}
            shadowColor={t.shadow}
            depth={4}
            radius={radius.lg}
            onPress={() => onSelect(o.species)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={o.accessibilityLabel}
            testID={`species-${o.species}`}
            style={styles.card}
          >
            <Sprite path={resolveSprite(o.species, 'YOUNG', 'PRESENTATION').path} size={56} />
            <Text variant="displayS" style={{ color: t.fg }}>
              {o.name}
            </Text>
            {o.tag ? (
              <View style={styles.tag}>
                <Badge label={o.tag} tone="violet" />
              </View>
            ) : null}
          </Pressable3D>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: space.xs, paddingHorizontal: 2 },
  card: { width: 84, alignItems: 'center', paddingVertical: space.sm, gap: 2, borderColor: color.creamShadow },
  tag: { position: 'absolute', top: -6, right: -6 },
});
