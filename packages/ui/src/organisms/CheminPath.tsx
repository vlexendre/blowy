import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Pulse } from '../motion/PopIn';
import { color, extra, radius, space } from '../theme';

/**
 * Une étape du chemin de l'accueil : faite, faite aujourd'hui, celle du jour (à commencer), à venir. Plus de coffre ni
 * de bandeau d'univers (V6-GAccueil : une seule récompense, la personne du jour).
 */
export type CheminStepKind = 'done' | 'today' | 'current' | 'locked';

export interface CheminStep {
  key: string;
  kind: CheminStepKind;
  /** « Étape 3, faite aujourd’hui » ; pour celle du jour : « Commencer la séance du jour, étape 3 » (rôle bouton). */
  accessibilityLabel: string;
}

/** Disque d'une étape (`.nd`) et de l'étape du jour (`.jour .rond`). */
const NODE = 44;
const NOW = 72;
/** Hauteur d'une ligne : 44 + 2 d'écart (`.nd` tous les 46 pt) ; l'étape du jour : 72 + 8. */
const ROW = 46;
const NOW_ROW = 80;
/** Tranche en relief sous le disque (`box-shadow: 0 4px 0`, `0 6px 0` pour celle du jour). */
const EDGE = 4;
const NOW_EDGE = 6;
/** Amplitude des virages, en part de la demi-largeur utile. */
const SWING = 0.42;

/** Hauteur de la ligne d'une étape. */
export const cheminRowHeight = (kind: CheminStepKind): number => (kind === 'current' ? NOW_ROW : ROW);

/** Abscisse (0 = centre, −1 à 1) de la n-ième étape : un chemin sinueux, stable d'un rendu à l'autre. */
export function cheminSwing(i: number): number {
  return Math.sin(i * 0.95 + 0.6) * SWING + Math.sin(i * 0.37) * 0.12;
}

/** Centre horizontal de la n-ième étape dans une largeur donnée. */
const centerX = (i: number, width: number): number => width / 2 + cheminSwing(i) * Math.max(0, width / 2 - NOW / 2 - space.sm);

export interface CheminStepRowProps {
  step: CheminStep;
  /** Rang de l'étape dans le chemin (pour les virages) ; `first` / `last` : pas de sentier au-delà. */
  index: number;
  first: boolean;
  last: boolean;
  /** Largeur utile (le sentier serpente dedans). */
  width: number;
  /** Étiquette blanche à côté de l'étape du jour (« Commencer »). */
  startLabel: string;
  /** Toucher l'étape du jour (et son étiquette). */
  onStart?: () => void;
}

const LOOK: Record<CheminStepKind, { bg: string; edge: string; ink: string }> = {
  done: { bg: extra.relief.done, edge: extra.relief.doneEdge, ink: color.dark },
  today: { bg: extra.relief.done, edge: extra.relief.doneEdge, ink: color.dark },
  current: { bg: color.accent, edge: extra.relief.nowEdge, ink: color.dark },
  locked: { bg: extra.relief.locked, edge: extra.relief.lockedEdge, ink: extra.relief.lockedInk },
};

/**
 * Une ligne du chemin de l'accueil (V6-GAccueil `.chemin`), faite pour une liste virtualisée : chaque ligne dessine
 * son bout de sentier pointillé (du milieu de l'écart d'au-dessus à son centre, puis jusqu'au milieu de l'écart
 * d'en dessous), si bien que les lignes se raccordent sans rien connaître des autres. Faites : vert et coche ; à venir :
 * cadenas ; celle du jour : 72 pt, jaune (le seul jaune de l'écran), étiquette blanche « Commencer ». Rien ne tient à
 * la seule couleur (coche, cadenas, lecture et étiquette). Elle bat deux fois à l'arrivée ; animations réduites : fixe.
 */
export function CheminStepRow({ step, index, first, last, width, startLabel, onStart }: CheminStepRowProps) {
  const h = cheminRowHeight(step.kind);
  const x = centerX(index, width);
  const up = (centerX(index - 1, width) + x) / 2;
  const down = (centerX(index + 1, width) + x) / 2;
  const trail = `${first ? `M${x} ${h / 2}` : `M${up} 0 L${x} ${h / 2}`}${last ? '' : ` L${down} ${h}`}`;
  const now = step.kind === 'current';
  const size = now ? NOW : NODE;
  // L'étiquette se met du côté où il y a de la place, sa pointe vers le disque.
  const labelLeft = x > width / 2;
  return (
    <View style={{ height: h, width }}>
      <Svg width={width} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={trail} fill="none" stroke={extra.relief.path} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 16" />
      </Svg>
      {now ? (
        <View style={[styles.abs, { top: (h - NOW - NOW_EDGE) / 2, left: labelLeft ? undefined : x - NOW / 2, right: labelLeft ? width - x - NOW / 2 : undefined }]}>
          <Pulse>
            <Pressable
              onPress={onStart}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={step.accessibilityLabel}
              scaleTo={0.95}
              style={[styles.now, labelLeft && styles.nowReverse]}
            >
              <Disc kind="current" size={size} />
              <View style={styles.tag}>
                <View style={[styles.tagTail, labelLeft ? styles.tailRight : styles.tailLeft]} />
                <Text variant="bodyHeavy" size={17} color={color.dark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.6}>
                  {startLabel}
                </Text>
              </View>
            </Pressable>
          </Pulse>
        </View>
      ) : (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={step.accessibilityLabel}
          style={[styles.abs, { left: x - size / 2, top: (h - size - EDGE) / 2 }]}
        >
          <Disc kind={step.kind} size={size} />
        </View>
      )}
    </View>
  );
}

/** Un disque en relief : la tranche (plus foncée) dessous, le disque par-dessus. */
function Disc({ kind, size }: { kind: CheminStepKind; size: number }) {
  const look = LOOK[kind];
  const edge = kind === 'current' ? NOW_EDGE : EDGE;
  const glyph =
    kind === 'current' ? (
      <Glyph name="play" size={30} color={look.ink} />
    ) : kind === 'locked' ? (
      <Glyph name="lock" size={20} color={look.ink} />
    ) : (
      <Glyph name="check" size={22} color={look.ink} />
    );
  return (
    <View style={{ width: size, height: size + edge }}>
      <View style={[styles.disc, { width: size, height: size, top: edge, backgroundColor: look.edge }]} />
      <View
        style={[
          styles.disc,
          { width: size, height: size, backgroundColor: look.bg },
          kind === 'locked' && styles.lockedRing,
        ]}
      >
        {glyph}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  disc: { position: 'absolute', left: 0, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  // `.nd.lk` : contour de 2 pt.
  lockedRing: { borderWidth: 2, borderColor: extra.relief.lockedRing },
  // `.jour` : le disque et l'étiquette, à 12 l'un de l'autre, une seule cible.
  now: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nowReverse: { flexDirection: 'row-reverse' },
  // `.etiquette` : 44 pt, blanche, rayon 14, pointe vers le disque.
  tag: {
    height: 44,
    paddingHorizontal: space.lg,
    borderRadius: 14,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: NOW_EDGE,
  },
  tagTail: { position: 'absolute', top: 16, width: 12, height: 12, backgroundColor: color.white, transform: [{ rotate: '45deg' }] },
  tailLeft: { left: -5 },
  tailRight: { right: -5 },
});
