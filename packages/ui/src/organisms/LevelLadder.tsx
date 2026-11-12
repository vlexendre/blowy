import { LEVEL_KEYS, type LevelKey } from '@blowy/domain';
import { type ComponentRef, type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear, staggerDelay } from '../motion/Appear';
import { useBurst } from '../motion/MotionHost';
import { useFirstTime } from '../motion/once';
import { alpha, color, motion, radius, space, veil } from '../theme';

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
  /**
   * Clé du lien : à la première visite, les niveaux arrivent en cascade, le rail se remplit marche après marche et
   * la marche atteinte s'allume.
   */
  animateKey?: string;
  /** Passage de niveau à fêter : confettis depuis la marche atteinte quand elle s'allume. */
  celebrate?: boolean;
}

const DOT = 30;
/** Opacité des niveaux verrouillés : le prochain un peu plus présent que les suivants. */
const NEXT_OPACITY = 0.62;
const LATER_OPACITY = 0.42;

/** L'échelle des 7 niveaux d'un lien (V6-Lien) : passés cochés, actuel mis en avant, suivants en pointillés. */
export function LevelLadder({ level, labels, ratio, currentLabel, nextLabel, tint = color.rose, animateKey, celebrate }: LevelLadderProps) {
  const climb = useFirstTime(animateKey ? `ladder:${animateKey}` : undefined) && !!animateKey;
  // La marche atteinte s'allume une fois le rail monté jusqu'à elle (et tout de suite si on fête un passage).
  const lightAt = climb || celebrate ? RAIL_START + Math.max(0, level - 1) * RAIL_STEP + 80 : 0;
  return (
    <View accessibilityRole="list" style={styles.list}>
      {LEVEL_KEYS.map((key, i) => {
        const n = i + 1;
        const done = n < level;
        const current = n === level;
        const locked = n > level;
        const last = n === LEVEL_KEYS.length;
        const { title, text } = labels[key];
        const dotNode = (
          <View style={[styles.dot, done && styles.done, current && { backgroundColor: tint }, locked && styles.locked]}>
            {done ? (
              <Glyph name="check" size={14} color={color.dark} />
            ) : (
              <Text variant="bodyHeavy" size={locked ? 13 : 14} color={locked ? color.mute : color.dark}>
                {String(n)}
              </Text>
            )}
          </View>
        );
        const row = (children: ReactNode) => (
          <View
            accessible
            accessibilityLabel={`${n}. ${title}. ${text}`}
            accessibilityState={{ disabled: locked, selected: current }}
            style={[layout.row, styles.row, locked && { opacity: n === level + 1 ? NEXT_OPACITY : LATER_OPACITY }]}
          >
            {children}
          </View>
        );
        const body = (
          <>
            {!last ? <Rail done={done} play={climb} delay={RAIL_START + i * RAIL_STEP} /> : null}
            {current ? (
              <Lit tint={tint} play={climb || !!celebrate} delay={lightAt} celebrate={!!celebrate}>
                {dotNode}
              </Lit>
            ) : done && climb ? (
              <Tick delay={RAIL_START + i * RAIL_STEP - RAIL_STEP / 2}>{dotNode}</Tick>
            ) : (
              dotNode
            )}
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
          </>
        );
        // Une seule fois par lien : les niveaux arrivent en cascade.
        return animateKey ? (
          <Appear key={key} once={`ladder:${animateKey}:${key}`} delay={staggerDelay(i)} distance={10}>
            {row(body)}
          </Appear>
        ) : (
          <View key={key}>{row(body)}</View>
        );
      })}
    </View>
  );
}

/** Le rail monte marche après marche : chaque segment franchi se remplit depuis le haut. */
const RAIL_START = 260;
const RAIL_STEP = 110;

function Rail({ done, play, delay }: { done: boolean; play: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const fill = useSharedValue(play && done ? 0 : 1);
  useEffect(() => {
    if (!play || !done) return;
    fill.value = reduced ? 1 : withDelay(delay, withTiming(1, { duration: RAIL_STEP + 40, easing: ease.standard }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: fill.value }] }));
  return (
    <View style={styles.line}>
      {done ? <Animated.View style={[StyleSheet.absoluteFill, styles.lineDone, styles.railOrigin, style]} /> : null}
    </View>
  );
}

/** Une marche passée : la pastille se coche quand le rail l'atteint. */
function Tick({ delay, children }: { delay: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(reduced ? 1 : 0.6);
  useEffect(() => {
    if (reduced) return;
    s.value = withDelay(Math.max(0, delay), withSpring(1, springs.pop));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * La marche atteinte s'allume : la pastille gonfle (ressort de peluche), son halo s'ouvre, une onde part et
 * s'efface. En cas de passage de niveau : confettis depuis la pastille et vibration de fête.
 * Animations réduites : le halo apparaît en fondu, pas de confettis.
 */
function Lit({ tint, play, delay, celebrate, children }: { tint: string; play: boolean; delay: number; celebrate: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const burst = useBurst();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const on = useSharedValue(play ? 0 : 1);
  const halo = useSharedValue(play ? 0 : 1);
  const wave = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const light = (at: number, party: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    if (reduced) {
      on.value = 1;
      halo.value = withDelay(Math.min(at, motion.base), fadeTo(1, motion.base));
      return;
    }
    on.value = withDelay(at, withSequence(withTiming(1.3, { duration: 160, easing: ease.out }), withSpring(1, springs.plush)));
    halo.value = withDelay(at + 60, withSpring(1, springs.pop));
    wave.value = withSequence(withTiming(0, { duration: 0 }), withDelay(at + 60, withTiming(1, { duration: 900, easing: ease.out })));
    timer.current = setTimeout(() => {
      hapticFor(party ? 'celebrate' : 'land');
      if (party) ref.current?.measureInWindow((x, y, w, h) => burst({ kind: 'confetti', x: x + w / 2, y: y + h / 2 }));
    }, at + 80);
  };
  useEffect(() => {
    if (play) light(delay, celebrate);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Passage de niveau connu après l'ouverture (données relues) : la marche se rallume, avec les confettis.
  const partied = useRef(celebrate);
  useEffect(() => {
    if (!celebrate || partied.current) return;
    partied.current = true;
    light(Math.max(delay, 200), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate]);
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: Math.max(0, on.value) }] }));
  const ring = useAnimatedStyle(() => ({ opacity: Math.min(1, halo.value), transform: [{ scale: 0.5 + 0.5 * halo.value }] }));
  const ripple = useAnimatedStyle(() => ({ opacity: wave.value > 0 && wave.value < 1 ? 0.6 * (1 - wave.value) : 0, transform: [{ scale: 1 + 1.4 * wave.value }] }));
  return (
    <View ref={ref} collapsable={false}>
      {/* Niveau actuel : halo de 4 pt (`box-shadow: 0 0 0 4px` à 25 %). */}
      <Animated.View pointerEvents="none" style={[styles.haloRing, { backgroundColor: alpha(tint, 0.25) }, ring]} />
      <Animated.View pointerEvents="none" style={[styles.wave, { borderColor: tint }, ripple]} />
      <Animated.View style={dot}>{children}</Animated.View>
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
  haloRing: { position: 'absolute', left: -4, top: -4, right: -4, bottom: -4, borderRadius: radius.pill },
  wave: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: radius.pill, borderWidth: 2 },
  railOrigin: { transformOrigin: '50% 0%' },
  locked: { backgroundColor: alpha(color.white, 0.06), borderWidth: 1.5, borderStyle: 'dashed', borderColor: alpha(color.white, 0.25) },
  title: { lineHeight: 17 },
  progress: { marginTop: space.sm },
  nextChip: { backgroundColor: veil.line },
});
