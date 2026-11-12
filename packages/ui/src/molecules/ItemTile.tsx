import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { ItemImage } from '../atoms/ItemImage';
import { Pressable } from '../atoms/Pressable';
import { ProgressBar } from '../atoms/ProgressBar';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { color, opacity, radius, size as sizes, space, veil } from '../theme';

export type ItemTileState = 'owned' | 'worn' | 'locked' | 'premium';

export interface ItemTileProps {
  /** Identifiant de l'objet (`ITEM_IDS`). */
  id: string;
  /** Nom lu et affiché (`itemLabel[id]`). */
  label: string;
  /** `owned` dans la garde-robe · `worn` porté (cadre jaune, coche) · `locked` à gagner · `premium` à acheter. */
  state: ItemTileState;
  /** Objet à gagner : étape courte (« crée 3 liens »). */
  goalText?: string;
  /** Objet à gagner : avancement. */
  progress?: { have: number; need: number };
  /** Autocollant des objets premium (« bientôt »). */
  premiumLabel?: string;
  /** Autocollant « nouveau ! » (objet tout juste débloqué). */
  newLabel?: string;
  /** Montre le nom sous l'image. Défaut vrai. */
  showLabel?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Case d'un objet : possédé, porté, verrouillé (étape + barre) ou premium (« bientôt »). */
export const ItemTile = memo(function ItemTile({ id, label, state, goalText, progress, premiumLabel, newLabel, showLabel = true, onPress, accessibilityHint, style }: ItemTileProps) {
  const worn = state === 'worn';
  const locked = state === 'locked';
  const premium = state === 'premium';
  const a11y = [label, locked ? goalText : undefined, premium ? premiumLabel : undefined, progress && locked ? `${progress.have}/${progress.need}` : undefined]
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      haptic="selection"
      scaleTo={0.95}
      accessibilityLabel={a11y}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: worn, disabled: !onPress }}
      style={[styles.tile, worn && styles.worn, (locked || premium) && styles.closed, style]}
    >
      <View style={styles.art}>
        <ItemImage id={id} size={60} style={(locked || premium) && styles.dim} />
        {locked ? (
          <View style={styles.lock}>
            <Glyph name="lock" size={14} color={color.white} />
          </View>
        ) : null}
        {worn ? (
          <View style={styles.check}>
            <Glyph name="check" size={13} color={color.dark} />
          </View>
        ) : null}
      </View>
      {showLabel ? (
        <Text variant="bodyBold" size={12} center numberOfLines={1} muted={locked || premium}>
          {label}
        </Text>
      ) : null}
      {locked && goalText ? (
        <Text variant="small" size={10} center muted numberOfLines={2} style={styles.goal}>
          {goalText}
        </Text>
      ) : null}
      {locked && progress ? <ProgressBar value={progress.need ? progress.have / progress.need : 0} height={5} style={styles.bar} /> : null}
      {premium && premiumLabel ? <Sticker label={premiumLabel} tone="violet" size="sm" rotate={-8} style={styles.sticker} /> : null}
      {newLabel && !premium ? <Sticker label={newLabel} tone="coral" size="sm" rotate={6} style={styles.newSticker} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 112,
    minWidth: sizes.touch,
    padding: space.sm,
    paddingTop: space.md,
    gap: space.xs,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: veil.line,
  },
  worn: { borderColor: color.accent, backgroundColor: color.line },
  closed: { backgroundColor: color.panel },
  art: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: opacity.ghost - 0.15 },
  lock: { position: 'absolute', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.scrim },
  check: {
    position: 'absolute',
    top: -6,
    right: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent,
    borderWidth: 2,
    borderColor: color.dark,
  },
  goal: { lineHeight: 13 },
  bar: { alignSelf: 'stretch', marginTop: 'auto' },
  sticker: { position: 'absolute', top: -space.sm, right: -space.xs },
  newSticker: { position: 'absolute', top: -space.sm, left: -space.xs },
});
