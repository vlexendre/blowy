import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Glyph, type GlyphName } from '../atoms/Glyph';
import { RichText } from '../atoms/RichText';
import { layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { color, gradient, space, veil } from '../theme';

export interface TrialStepView {
  /** « Aujourd’hui : », « Jour 5 : » (ponctuation comprise). */
  title: string;
  /** « tout Minimoa+ est ouvert ». */
  text: string;
  /** Pictogramme du jalon ; défaut : ouvert, rappel, paiement (dans cet ordre). */
  glyph?: GlyphName;
}

export interface TrialTimelineProps {
  steps: readonly TrialStepView[];
  /** Petit écran : jalons plus serrés, une ligne chacun. */
  compact?: boolean;
}

/** Pictogramme de chaque jalon : ouvert aujourd'hui, le rappel, le premier paiement. */
const STEP_GLYPH: readonly GlyphName[] = ['unlock', 'bell', 'star'];

/**
 * Frise verticale de l'essai gratuit : trois jalons (aujourd'hui → rappel → premier paiement) sur une barre de couleur
 * de Minimoa+. Le premier est allumé en jaune, les suivants en clair. Sert aussi, sans essai, à dire ce qui se passe
 * (paiement aujourd'hui, renouvellement, annulation) : la feuille garde la même forme d'une offre à l'autre.
 */
export function TrialTimeline({ steps, compact }: TrialTimelineProps) {
  const dot = compact ? 22 : 26;
  const gap = compact ? 5 : 8;
  return (
    <View style={[styles.wrap, { gap }]}>
      {/* La barre relie le centre du premier pictogramme à celui du dernier. */}
      <View style={[styles.bar, { left: dot / 2 - 2, top: dot / 2, bottom: dot / 2 }]}>
        <LinearGradient colors={[gradient.violet[0], gradient.coral[0]]} style={StyleSheet.absoluteFill} />
      </View>
      {steps.map((s, i) => {
        const glyph = s.glyph ?? STEP_GLYPH[Math.min(i, STEP_GLYPH.length - 1)] ?? 'dot';
        const first = i === 0;
        return (
          <View key={s.title} style={[layout.row, styles.step]}>
            <PopIn delay={160 + i * 90} from={0.5}>
              <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }, first ? styles.dotOn : styles.dotOff]}>
                <Glyph name={glyph} size={dot * 0.56} color={first ? color.dark : color.white} />
              </View>
            </PopIn>
            <RichText
              size={compact ? 13 : 14}
              numberOfLines={compact ? 1 : 2}
              style={[layout.grow, { lineHeight: compact ? 17 : 19 }]}
              runs={[
                { text: s.title, variant: 'bodyHeavy' },
                { text: ` ${s.text}`, muted: true },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  bar: { position: 'absolute', width: 4, borderRadius: 2, overflow: 'hidden' },
  step: { gap: space.md, alignItems: 'center' },
  dot: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotOn: { backgroundColor: color.accent, borderColor: color.accent },
  dotOff: { backgroundColor: color.card, borderColor: veil.off },
});
