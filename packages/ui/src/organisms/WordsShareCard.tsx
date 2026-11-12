import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip, type ChipTone } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, size, space, type } from '../theme';

export interface WordsShareCardProps {
  /** « décris-moi en 3 mots ». */
  title: string;
  /** « 9 potes ont répondu ». */
  countLabel?: string;
  /** Mots reçus (libellé déjà traduit) et nombre de votes. */
  words: readonly { label: string; count?: number }[];
  /** Adresse affichée (« blowy.app/alex »). */
  url: string;
  copyLabel: string;
  /** Remplace `copyLabel` juste après la copie (« copié ✓ »). */
  copiedLabel?: string;
  copied?: boolean;
  shareLabel: string;
  onCopy: () => void;
  onShare: () => void;
  /** Texte quand personne n'a encore répondu. */
  emptyText?: string;
}

const TONES: readonly ChipTone[] = ['accent', 'rose', 'orange', 'violet'];

/** Le lien « 3 mots » : mots reçus, adresse, copier, partager en story. */
export function WordsShareCard({ title, countLabel, words, url, copyLabel, copiedLabel, copied, shareLabel, onCopy, onShare, emptyText }: WordsShareCardProps) {
  return (
    <Card padding="none" style={styles.card}>
      <View style={[layout.rowBetween, layout.gapSm]}>
        <Text variant="label" size={11} style={styles.label}>
          {title}
        </Text>
        {countLabel ? (
          <Text variant="small" size={12} muted>
            {countLabel}
          </Text>
        ) : null}
      </View>
      {words.length ? (
        <View style={[layout.row, styles.chips]}>
          {words.map((w, i) => (
            <Chip key={w.label} label={w.count ? `${w.label} ×${w.count}` : w.label} tone={TONES[i % TONES.length]} style={styles.chip} />
          ))}
        </View>
      ) : emptyText ? (
        <Text variant="small" muted>
          {emptyText}
        </Text>
      ) : null}
      <View style={[layout.row, layout.gapSm]}>
        <View style={[styles.url, layout.grow]}>
          <Text variant="bodyHeavy" size={15} numberOfLines={1} selectable>
            {url}
          </Text>
        </View>
        <Button label={copied && copiedLabel ? copiedLabel : copyLabel} variant="ghost" size="sm" onPress={onCopy} style={[styles.btn, styles.copy]} />
        <Button label={shareLabel} variant="accent" size="sm" onPress={onShare} style={styles.btn} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: space.md + 2, gap: space.sm + 2 },
  label: { fontFamily: type.bodyHeavy.fontFamily, letterSpacing: 11 * 0.12 },
  chips: { flexWrap: 'wrap', gap: space.xs + 2 },
  chip: { height: 26, paddingHorizontal: 11 },
  url: { height: size.touch, justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: size.touch / 2, backgroundColor: color.card },
  btn: { height: size.touch },
  copy: { minWidth: 88 },
});
