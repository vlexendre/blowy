import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { IconButton } from '../atoms/IconButton';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { DrawnCheck } from '../motion/DrawnCheck';
import { color, size, space } from '../theme';

export interface WordsShareCardProps {
  /** « Décris-moi en 3 mots ». */
  title: string;
  /** Ce que c'est, en une ligne courte ; remplacée par `moreLabel` quand des mots sont arrivés. */
  text?: string;
  /** Petite puce à droite du titre (« Anonyme », ou « 4 réponses » une fois des mots reçus). */
  badge?: string;
  /** La puce passe en couleur (des mots sont arrivés). */
  badgeOn?: boolean;
  /** Action principale (« Partager le lien ») : la feuille de partage du téléphone, qui sait aussi copier. */
  shareLabel: string;
  onShare: () => void;
  /** Copie directe, en second : bouton rond ; `copyLabel` est lu, une coche se dessine après la copie. */
  copyLabel: string;
  copiedLabel?: string;
  copied?: boolean;
  onCopy: () => void;
  /** Lien vers ce que les mots ont changé (« Voir le caractère de Biscotte »), à la place de `text`. */
  moreLabel?: string;
  onMore?: () => void;
}

/**
 * Le lien « 3 mots » en petit : un titre, une ligne, une action (partager). La copie reste à portée, en bouton rond.
 */
export function WordsShareCard({ title, text, badge, badgeOn, shareLabel, onShare, copyLabel, copiedLabel, copied, onCopy, moreLabel, onMore }: WordsShareCardProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, layout.gapSm]}>
        <Text variant="bodyHeavy" size={16} numberOfLines={2} style={layout.shrink}>
          {title}
        </Text>
        {badge ? <Chip label={badge} tone={badgeOn ? 'accent' : undefined} size="sm" /> : null}
      </View>
      {moreLabel && onMore ? (
        <Pressable onPress={onMore} accessibilityRole="link" accessibilityLabel={moreLabel} style={[layout.row, styles.more]}>
          <Text variant="bodyBold" size={13} color={color.accent} numberOfLines={1} style={layout.shrink}>
            {moreLabel}
          </Text>
          <Glyph name="chevron" size={13} color={color.accent} />
        </Pressable>
      ) : text ? (
        <Text size={13} muted numberOfLines={2} style={styles.text}>
          {text}
        </Text>
      ) : null}
      <View style={[layout.row, layout.gapSm, styles.actions]}>
        <Button label={shareLabel} icon="share" variant="accent" size="sm" block={false} onPress={onShare} style={[layout.grow, styles.share]} />
        <IconButton
          label={copied && copiedLabel ? copiedLabel : copyLabel}
          glyph={copied ? undefined : 'copy'}
          icon={copied ? <DrawnCheck key="check" size={16} haptic="success" /> : undefined}
          variant="back"
          onPress={onCopy}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, paddingVertical: space.md, paddingHorizontal: space.md + 2, gap: 4 },
  text: { lineHeight: 18 },
  more: { gap: 2, alignSelf: 'flex-start', minHeight: 22 },
  actions: { marginTop: space.sm },
  // Même hauteur que le bouton rond de copie (zone de toucher de 44).
  share: { height: size.touch },
});
