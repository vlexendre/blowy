import { memo, useEffect, useMemo, useRef } from 'react';
import { type StyleProp, StyleSheet, Text as RNText, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, type SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useMotionActive, useReducedMotion } from '../lib/motion';
import { color, extra, type } from '../theme';
import { hashString, makeSeed } from './seed';

export type BurstKind = 'hearts' | 'stars' | 'sparkles' | 'confetti' | 'zzz';

export interface BurstProps {
  kind: BurstKind;
  /** À incrémenter pour (re)jouer l'explosion. 0 = rien (sauf `loop`). */
  trigger?: number;
  /** Joue en boucle tant que vrai (les « z » d'un pet qui dort). */
  loop?: boolean;
  /** Nombre de particules (défaut selon le genre ; 16 au plus). */
  count?: number;
  /** Rayon / hauteur de dispersion (pt). Défaut selon le genre. */
  spread?: number;
  /** Taille des particules (pt). Défaut selon le genre. */
  size?: number;
  /** Graine des trajectoires (même graine, même dessin). */
  seed?: string;
  /** Couleurs (confettis, étoiles) ; défaut la palette de l'app. */
  colors?: readonly string[];
  /** Appelé à la fin d'une explosion. */
  onDone?: () => void;
  /**
   * Le point d'origine : `Burst` est une vue de taille nulle, à placer en absolu là où ça doit jaillir
   * (ex. `style={{ position: 'absolute', left: 120, top: 40 }}`).
   */
  style?: StyleProp<ViewStyle>;
}

interface Particle {
  delay: number;
  dur: number;
  angle: number;
  dist: number;
  size: number;
  spin: number;
  sway: number;
  tint: string;
}

const CONFIG: Record<BurstKind, { count: number; spread: number; size: number; dur: number }> = {
  hearts: { count: 6, spread: 100, size: 20, dur: 1100 },
  stars: { count: 8, spread: 64, size: 16, dur: 720 },
  sparkles: { count: 5, spread: 34, size: 12, dur: 900 },
  confetti: { count: 16, spread: 160, size: 11, dur: 1500 },
  zzz: { count: 3, spread: 64, size: 20, dur: 1800 },
};

const PALETTE = [color.accent, color.rose, color.violet, color.coral, extra.sky, color.white] as const;
const MAX = 16;

function makeParticles(kind: BurstKind, n: number, spread: number, size: number, seed: string, colors: readonly string[]): Particle[] {
  const r = makeSeed(hashString(`${seed}:${kind}`));
  const c = CONFIG[kind];
  return Array.from({ length: Math.min(MAX, n) }, (_, i) => {
    const frac = n > 1 ? i / (n - 1) : 0.5;
    switch (kind) {
      case 'hearts':
        return {
          delay: i * 85,
          dur: c.dur,
          angle: (frac - 0.5) * 1.6 + r.range(-0.15, 0.15),
          dist: spread * r.range(0.65, 1),
          size: size * r.range(0.7, 1.15),
          spin: r.range(-14, 14),
          sway: r.range(5, 11),
          tint: i % 3 === 2 ? color.rose : extra.heart,
        };
      case 'stars':
        return {
          delay: r.range(0, 60),
          dur: c.dur,
          angle: (i / n) * Math.PI * 2 + r.range(-0.2, 0.2),
          dist: spread * r.range(0.6, 1),
          size: size * r.range(0.7, 1.2),
          spin: r.range(60, 140),
          sway: 0,
          tint: colors[i % colors.length] ?? color.accent,
        };
      case 'sparkles':
        return {
          delay: i * 110,
          dur: c.dur * 0.7,
          angle: (i / n) * Math.PI * 2 + r.range(-0.4, 0.4),
          dist: spread * r.range(0.5, 1),
          size: size * r.range(0.6, 1.1),
          spin: r.range(40, 90),
          sway: 0,
          tint: i % 2 ? color.white : color.accent,
        };
      case 'confetti':
        return {
          delay: r.range(0, 90),
          dur: c.dur * r.range(0.85, 1.1),
          angle: (frac - 0.5) * 2.4 + r.range(-0.12, 0.12),
          dist: spread * r.range(1.1, 1.9),
          size: size * r.range(0.7, 1.2),
          spin: r.range(360, 900) * (i % 2 ? 1 : -1),
          sway: r.range(0.6, 1.4),
          tint: colors[i % colors.length] ?? color.accent,
        };
      case 'zzz':
        return { delay: i * 560, dur: c.dur, angle: 0, dist: spread, size: size + i * 5, spin: r.range(-12, 6), sway: i * 7, tint: color.white };
    }
  });
}

const HEART = 'M12 21s-7.4-4.5-9.5-9.2C1.1 8.4 3.1 5 6.6 5c2.1 0 3.7 1.1 5.4 3.1C13.7 6.1 15.3 5 17.4 5c3.5 0 5.5 3.4 4.1 6.8C19.4 16.5 12 21 12 21z';
const STAR = 'M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9-7.9-2.6 7.9-2.6z';

const ParticleView = memo(function ParticleView({ kind, part, p, total }: { kind: BurstKind; part: Particle; p: SharedValue<number>; total: number }) {
  const style = useAnimatedStyle(() => {
    const raw = (p.value * total - part.delay) / part.dur;
    if (raw <= 0 || raw >= 1) return { opacity: 0, transform: [{ scale: 0 }] };
    const t = raw;
    const out = 1 - (1 - t) * (1 - t) * (1 - t);
    switch (kind) {
      case 'hearts': {
        const x = Math.sin(part.angle) * part.dist * 0.55 * out + Math.sin(t * Math.PI * 2.2) * part.sway;
        const y = -Math.cos(part.angle * 0.5) * part.dist * out;
        const s = t < 0.18 ? (t / 0.18) * 1.1 : t < 0.3 ? 1.1 - ((t - 0.18) / 0.12) * 0.1 : 1 - Math.max(0, t - 0.75) * 0.8;
        const o = t < 0.08 ? t / 0.08 : t > 0.7 ? (1 - t) / 0.3 : 1;
        return { opacity: o, transform: [{ translateX: x }, { translateY: y }, { rotate: `${part.spin * Math.sin(t * 6)}deg` }, { scale: s }] };
      }
      case 'stars':
      case 'sparkles': {
        const x = Math.cos(part.angle) * part.dist * out;
        const y = Math.sin(part.angle) * part.dist * out - (kind === 'sparkles' ? 10 * t : 0);
        const s = t < 0.25 ? (t / 0.25) * 1.15 : 1.15 * (1 - (t - 0.25) / 0.75);
        return {
          opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
          transform: [{ translateX: x }, { translateY: y }, { rotate: `${part.spin * t}deg` }, { scale: Math.max(0, s) }],
        };
      }
      case 'confetti': {
        const sec = (t * part.dur) / 1000;
        const v = part.dist * 2.1;
        const x = Math.sin(part.angle) * v * sec * 0.62;
        const y = -Math.cos(part.angle) * v * sec + 0.5 * 900 * sec * sec;
        const spin = part.spin * t;
        return {
          opacity: t > 0.78 ? (1 - t) / 0.22 : 1,
          transform: [{ translateX: x }, { translateY: y }, { rotate: `${spin}deg` }, { scaleY: Math.cos(((spin * Math.PI) / 180) * part.sway) }],
        };
      }
      case 'zzz': {
        const x = part.sway + t * 26 + Math.sin(t * Math.PI * 2) * 4;
        const y = -t * part.dist;
        const o = t < 0.2 ? t / 0.2 : t > 0.65 ? (1 - t) / 0.35 : 1;
        return { opacity: o * 0.95, transform: [{ translateX: x }, { translateY: y }, { rotate: `${part.spin}deg` }, { scale: 0.6 + 0.5 * t }] };
      }
    }
  });
  const half = part.size / 2;
  let body;
  if (kind === 'hearts')
    body = (
      <Svg width={part.size} height={part.size} viewBox="0 0 24 24">
        <Path d={HEART} fill={part.tint} />
      </Svg>
    );
  else if (kind === 'stars' || kind === 'sparkles')
    body = (
      <Svg width={part.size} height={part.size} viewBox="0 0 24 24">
        <Path d={STAR} fill={part.tint} />
      </Svg>
    );
  else if (kind === 'confetti') body = <View style={{ width: part.size * 0.62, height: part.size, borderRadius: 2, backgroundColor: part.tint }} />;
  else body = <RNText style={[styles.z, { fontSize: part.size, lineHeight: part.size * 1.1, color: part.tint }]}>z</RNText>;
  return <Animated.View style={[styles.particle, { left: -half, top: -half }, style]}>{body}</Animated.View>;
});

/**
 * Explosion de particules (cœurs, étoiles, scintillements, confettis, « z ») en vues simples : un seul moteur
 * d'animation par explosion, transformations et opacité seulement, particules créées une fois puis réutilisées.
 * Décoratif : ignoré par les lecteurs d'écran, ne capte aucun toucher. Rien avec « réduire les animations ».
 */
export function Burst({ kind, trigger = 0, loop = false, count, spread, size, seed = 'burst', colors = PALETTE, onDone, style }: BurstProps) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const c = CONFIG[kind];
  const n = count ?? c.count;
  const parts = useMemo(
    () => makeParticles(kind, n, spread ?? c.spread, size ?? c.size, seed, colors),
    [kind, n, spread, size, seed, colors, c.spread, c.size],
  );
  const total = useMemo(() => Math.max(...parts.map((q) => q.delay + q.dur)), [parts]);
  const p = useSharedValue(0);
  const started = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (reduced || trigger === 0 || loop) return;
    started.current = true;
    p.value = 0;
    p.value = withTiming(1, { duration: total, easing: Easing.linear });
    const id = setTimeout(() => done.current?.(), total);
    return () => clearTimeout(id);
  }, [trigger, reduced, loop, total, p]);
  useEffect(() => {
    if (!loop) return;
    if (reduced || !active) {
      cancelAnimation(p);
      p.value = 0;
      return;
    }
    started.current = true;
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: total, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(p);
  }, [loop, reduced, active, total, p]);
  if (reduced || (!started.current && trigger === 0 && !loop)) return <View pointerEvents="none" style={[styles.origin, style]} />;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.origin, style]}>
      {parts.map((part, i) => (
        <ParticleView key={i} kind={kind} part={part} p={p} total={total} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { width: 0, height: 0, overflow: 'visible' },
  particle: { position: 'absolute' },
  z: { fontFamily: type.h3.fontFamily, includeFontPadding: false },
});
