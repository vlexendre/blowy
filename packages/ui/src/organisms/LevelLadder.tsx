import { LEVEL_KEYS, type LevelKey } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, radius, space, veil } from '../theme';

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
/** Opacité des niveaux verrouillés : le prochain un peu plus présent que les suivants. */
const NEXT_OPACITY = 0.62;
const LATER_OPACITY = 0.42;

/** L'échelle des 7 niveaux d'un lien (V6-Lien) : passés cochés, actuel mis en avant, suivants en pointillés. */
export function LevelLadder({ level, labels, ratio, currentLabel, nextLabel, tint = color.rose }: LevelLadderProps) {
  return (
    <View accessibilityRole="list" style={styles.list}>
      {LEVEL_KEYS.map((key, i) => {
        const n = i + 1;
        const done = n < level;
        const current = n === level;
        const locked = n > level;
        const last = n === LEVEL_KEYS.length;
        const { title, text } = labels[key];
        return (
          <View
            key={key}
            accessible
            accessibilityLabel={`${n}. ${title}. ${text}`}
            accessibilityState={{ disabled: locked, selected: current }}
            style={[layout.row, styles.row, locked && { opacity: n === level + 1 ? NEXT_OPACITY : LATER_OPACITY }]}
          >
            {!last ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            {/* Niveau actuel : halo de 4 pt (`box-shadow: 0 0 0 4px` à 25 %). */}
            <View style={current ? [styles.halo, { backgroundColor: alpha(tint, 0.25) }] : null}>
              <View style={[styles.dot, done && styles.done, current && { backgroundColor: tint }, locked && styles.locked]}>
                {done ? (
                  <Glyph name="check" size={14} color={color.dark} />
                ) : (
                  <Text variant="bodyHeavy" size={locked ? 13 : 14} color={locked ? color.mute : color.dark}>
                    {String(n)}
                  </Text>
                )}
              </View>
            </View>
            <View style={layout.grow}>
              <Text variant="bodyBold" size={15} style={styles.title}>
                {title}
              </Text>
              <Text variant="body" size={12} muted>
                {text}
              </Text>
              {current && ratio !== undefined ? <ProgressBar value={ratio} color={tint} height={6} style={styles.progress} /> : null}
            </View>
            {current && currentLabel ? <Chip label={currentLabel} tone="rose" /> : null}
            {n === level + 1 && nextLabel ? <Chip label={nextLabel} tone="glass" style={styles.nextChip} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm, paddingHorizontal: space.xs },
  row: { gap: space.md, minHeight: 42 },
  // Rail : de 34 pt sous le haut de la ligne jusqu'à 8 pt sous son bas (l'écart entre deux niveaux).
  line: { position: 'absolute', left: DOT / 2 - 1, top: 34, bottom: -space.sm, width: 2, backgroundColor: veil.track },
  lineDone: { backgroundColor: color.accent },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: color.accent },
  halo: { margin: -4, padding: 4, borderRadius: radius.pill },
  locked: { backgroundColor: alpha(color.white, 0.06), borderWidth: 1.5, borderStyle: 'dashed', borderColor: alpha(color.white, 0.25) },
  title: { lineHeight: 17 },
  progress: { marginTop: space.sm },
  nextChip: { backgroundColor: veil.line },
});
