import { LEVEL_KEYS, type LevelKey } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, opacity, radius, space, veil } from '../theme';

export interface LevelLadderProps {
  /** Niveau actuel (1 à 7). */
  level: number;
  /** Titre et phrase de chaque niveau (`levelLabel` de @blowy/content accepté tel quel). */
  labels: Record<LevelKey, { title: string; text: string }>;
  /** Avancement vers le niveau suivant (0 à 1). */
  ratio?: number;
  /** Puce sur le niveau actuel (« vous êtes là »). */
  currentLabel?: string;
  /** Puce sur le niveau suivant (« encore 160 xp »). */
  nextLabel?: string;
  /** Couleur du niveau actuel. Défaut rose. */
  tint?: string;
}

const DOT = 30;

/** L'échelle des 7 niveaux d'un lien : passés cochés, actuel mis en avant, suivants verrouillés. */
export function LevelLadder({ level, labels, ratio, currentLabel, nextLabel, tint = color.rose }: LevelLadderProps) {
  return (
    <View accessibilityRole="list">
      {LEVEL_KEYS.map((key, i) => {
        const n = i + 1;
        const done = n < level;
        const current = n === level;
        const locked = n > level;
        const last = n === LEVEL_KEYS.length;
        const { title, text } = labels[key];
        return (
          <View key={key} accessible accessibilityLabel={`${n}. ${title}. ${text}`} accessibilityState={{ disabled: locked, selected: current }} style={[layout.rowTop, styles.row]}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.done,
                  current && { backgroundColor: alpha(tint, 0.25), borderColor: tint, borderWidth: 3 },
                  locked && styles.locked,
                ]}
              >
                {done ? (
                  <Glyph name="check" size={14} color={color.dark} />
                ) : (
                  <Text variant="bodyBold" size={12} muted={locked}>
                    {String(n)}
                  </Text>
                )}
              </View>
              {!last ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            </View>
            <View style={[layout.grow, styles.texts, locked && styles.dim]}>
              <Text variant="bodyBold" size={16}>
                {title}
              </Text>
              <Text variant="small" muted>
                {text}
              </Text>
              {current && ratio !== undefined ? <ProgressBar value={ratio} color={tint} height={6} style={styles.progress} /> : null}
            </View>
            {current && currentLabel ? <Chip label={currentLabel} tone="rose" /> : null}
            {n === level + 1 && nextLabel ? <Chip label={nextLabel} tone="glass" /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md },
  rail: { width: DOT, alignItems: 'center', alignSelf: 'stretch' },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.line, borderWidth: 1, borderColor: veil.glass },
  done: { backgroundColor: color.accent, borderColor: color.accent },
  locked: { backgroundColor: 'transparent' },
  line: { flex: 1, width: 2, minHeight: space.md, backgroundColor: veil.glass },
  lineDone: { backgroundColor: color.accent },
  texts: { paddingBottom: space.lg, paddingTop: space.xs, gap: 2 },
  dim: { opacity: opacity.ghost },
  progress: { marginTop: space.sm },
});
