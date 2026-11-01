import { ScrollView, StyleSheet } from 'react-native';
import { space } from '../foundations/theme';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Sprite } from '../atoms/Sprite';

export interface RelationChipItem {
  id: string;
  label: string;
  spritePath: string | null;
  accessibilityLabel: string;
}

/** Sélecteur de rendez-vous du Nid (puces pet · initiale) + bouton « tous ». */
export function RelationSwitcher({ items, activeId, onSelect, allLabel, onAll }: { items: readonly RelationChipItem[]; activeId: string | null; onSelect: (id: string) => void; allLabel: string; onAll: () => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((it) => (
        <Chip key={it.id} label={it.label} selected={it.id === activeId} leading={<Sprite path={it.spritePath} size={26} />} onPress={() => onSelect(it.id)} accessibilityLabel={it.accessibilityLabel} size="sm" testID={`relation-${it.id}`} />
      ))}
      <IconButton icon="plus" accessibilityLabel={allLabel} onPress={onAll} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: space.xs, alignItems: 'center', paddingVertical: space.xs, paddingHorizontal: 2 } });
