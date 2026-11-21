/**
 * Carte dessinée de la zone (maquette V6-GCarte) : remplace la vraie carte là où elle n'existe pas (web, module natif
 * absent) et sert de repli. Les positions sont de vraies coordonnées (arrondies par le serveur) projetées autour du
 * centre ; les rues sont un décor. La zone est un cercle pointillé jaune ; au-delà, des silhouettes floues.
 */
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useMotionActive, useReducedMotion } from '../lib/motion';
import { MapBlob, MapSticker } from '../molecules/MapSticker';
import { alpha, color, extra } from '../theme';
import type { PetLook } from '../types';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface ZoneMapPin {
  key: string;
  position: MapPoint;
  pet: PetLook;
  label: string;
  accessibilityLabel: string;
  selected?: boolean;
  /** Présenté aujourd'hui : anneau jaune. */
  hot?: boolean;
  /** Sa photo, floue tant que le lien n'est pas noué ; pastille verte si venu aujourd'hui. */
  photo?: string | null;
  blurred?: boolean;
  online?: boolean;
  onPress?: () => void;
}

export interface ZoneMapProps {
  center: MapPoint;
  radiusKm: number;
  me?: { pet: PetLook; label: string; accessibilityLabel: string } | null;
  pins: readonly ZoneMapPin[];
  /** Silhouettes floues (au-delà de la zone), sans identité. */
  blurred?: readonly MapPoint[];
  /** Les autocollants se posent du centre vers l'extérieur (une fois). */
  land?: boolean;
  /** Hauteur réservée en haut (en-tête) et en bas (fiche) : la zone se centre entre les deux. */
  insetTop?: number;
  insetBottom?: number;
}

const KM_PER_DEG = 111.32;
/** Écart minimal entre deux autocollants (visage + puce du prénom, plus haut que large). */
const STICKER = 84;

/** Projection équirectangulaire autour du centre : km → points. */
export function projectAround(center: MapPoint, p: MapPoint, pxPerKm: number): { dx: number; dy: number } {
  const kx = KM_PER_DEG * Math.cos((center.latitude * Math.PI) / 180);
  return { dx: (p.longitude - center.longitude) * kx * pxPerKm, dy: -(p.latitude - center.latitude) * KM_PER_DEG * pxPerKm };
}

/**
 * Écarte les autocollants trop proches (déterministe, quelques passes) sans les sortir du disque de rayon `r`.
 * `pinned` premiers points fixes (toi, au centre) : seuls les autres bougent.
 */
function spread(points: { x: number; y: number }[], min: number, r: number, pinned = 0): { x: number; y: number }[] {
  const out = points.map((p) => ({ ...p }));
  for (let pass = 0; pass < 12; pass++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        // La puce sous le visage allonge l'autocollant : un écart vertical compte un peu moins.
        const dy = (b.y - a.y) * 0.8;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= min) continue;
        const ux = d === 0.01 ? 1 : dx / d;
        const uy = d === 0.01 ? 0 : dy / d;
        // Un point fixe ne bouge pas : l'autre fait tout le chemin.
        const aFixed = i < pinned;
        const push = aFixed ? min - d : (min - d) / 2;
        if (!aFixed) {
          a.x -= ux * push;
          a.y -= uy * push;
        }
        b.x += ux * push;
        b.y += uy * push;
      }
    }
    for (const p of out.slice(pinned)) {
      const d = Math.hypot(p.x, p.y);
      if (d > r) {
        p.x *= r / d;
        p.y *= r / d;
      }
    }
  }
  return out;
}

export function ZoneMap({ center, radiusKm, me, pins, blurred = [], land = false, insetTop = 140, insetBottom = 200 }: ZoneMapProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const usable = Math.max(200, box.h - insetTop - insetBottom);
  const zoneR = Math.min(box.w * 0.42, usable * 0.5);
  const cx = box.w / 2;
  const cy = insetTop + usable / 2;
  const pxPerKm = zoneR / Math.max(0.1, radiusKm);

  const placed = useMemo(() => {
    const raw = pins.map((p) => {
      const { dx, dy } = projectAround(center, p.position, pxPerKm);
      return { x: dx, y: dy };
    });
    // Personne sur toi : un autocollant tombé au centre est poussé hors de ta place.
    const withMe = me ? [{ x: 0, y: 0 }, ...raw] : raw;
    const spaced = spread(withMe, STICKER, Math.max(0, zoneR - STICKER / 3), me ? 1 : 0);
    return me ? spaced.slice(1) : spaced;
  }, [pins, center, pxPerKm, zoneR, me]);

  const blobs = useMemo(
    () =>
      blurred.map((b) => {
        const { dx, dy } = projectAround(center, b, pxPerKm);
        let x = dx;
        let y = dy;
        const d = Math.hypot(x, y) || 1;
        // Toujours hors de la zone, et à l'écran (un indice, pas une adresse).
        if (d < zoneR + 34) {
          x = (x / d) * (zoneR + 34);
          y = (y / d) * (zoneR + 34);
        }
        return { x: Math.min(box.w / 2 - 30, Math.max(-box.w / 2 + 30, x)), y: Math.min(box.h - cy - insetBottom + 40, Math.max(insetTop - cy - 10, y)) };
      }),
    [blurred, center, pxPerKm, zoneR, box.w, box.h, cy, insetTop, insetBottom],
  );

  const order = useMemo(() => placed.map((p, i) => ({ i, d: Math.hypot(p.x, p.y) })).sort((a, b) => a.d - b.d).map((o) => o.i), [placed]);

  return (
    <View style={styles.root} onLayout={onLayout}>
      {box.w > 0 ? (
        <>
          <Streets w={box.w} h={box.h} />
          {blobs.map((b, i) => (
            <MapBlob key={`b${i}`} delay={i * 340} style={[styles.abs, { left: cx + b.x - 27, top: cy + b.y - 27 }]} />
          ))}
          <View pointerEvents="none" style={[styles.abs, { left: cx - zoneR, top: cy - zoneR }]}>
            <Svg width={zoneR * 2} height={zoneR * 2}>
              <Circle cx={zoneR} cy={zoneR} r={zoneR - 2} fill={alpha(color.night, 0.55)} stroke={color.accent} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
            </Svg>
          </View>
          {pins.map((p, i) => {
            const at = placed[i] ?? { x: 0, y: 0 };
            const rank = order.indexOf(i);
            return (
              <Anchor key={p.key} x={cx + at.x} y={cy + at.y}>
                <MapSticker
                  pet={p.pet}
                  label={p.label}
                  selected={p.selected}
                  hot={p.hot}
                  photo={p.photo}
                  blurred={p.blurred}
                  online={p.online}
                  onPress={p.onPress}
                  accessibilityLabel={p.accessibilityLabel}
                  landDelay={land ? 260 + rank * 110 : null}
                  floatDelay={i * 230}
                />
              </Anchor>
            );
          })}
          {me ? (
            <Anchor x={cx} y={cy}>
              <Radar />
              <MapSticker pet={me.pet} label={me.label} me accessibilityLabel={me.accessibilityLabel} size={62} landDelay={land ? 0 : null} />
            </Anchor>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/** Un autocollant centré sur son point (le visage, pas la puce, tombe sur la position). */
function Anchor({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <View style={[styles.anchor, { left: x - 60, top: y - 36 }]}>{children}</View>;
}

/** Décor : îlots et rues (aucun nom : ce n'est pas un plan). */
function Streets({ w, h }: { w: number; h: number }) {
  const blocks: ReactNode[] = [];
  for (let y = -10; y < h; y += 46) {
    for (let x = -14; x < w; x += 58) {
      const k = ((x * 7 + y * 13) >>> 0) % 5;
      blocks.push(<View key={`${x}:${y}`} style={[styles.block, { left: x + 4, top: y + 4, width: 50, height: 38 }, k === 0 ? styles.park : null]} />);
    }
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ground]}>
      {blocks}
      <View style={[styles.avenue, { top: h * 0.3, width: w * 1.6, left: -w * 0.3, transform: [{ rotate: '-14deg' }] }]} />
      <View style={[styles.avenue, { top: h * 0.62, width: w * 1.6, left: -w * 0.3, transform: [{ rotate: '8deg' }] }]} />
      <View style={[styles.avenue, styles.vertical, { left: w * 0.32, height: h * 1.2, top: -h * 0.1, transform: [{ rotate: '18deg' }] }]} />
      <View style={[styles.water, { top: h * 0.8, width: w * 1.6, left: -w * 0.3, transform: [{ rotate: '-6deg' }] }]} />
    </View>
  );
}

/** Onde jaune autour de toi (2,6 s), en pause hors écran, coupée si « réduire les animations ». */
function Radar() {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const t = useSharedValue(0.6);
  useEffect(() => {
    if (reduced || !active) {
      cancelAnimation(t);
      t.value = 0.6;
      return;
    }
    t.value = 0;
    t.value = withDelay(400, withRepeat(withTiming(1, { duration: 2600, easing: Easing.bezier(0.2, 0.6, 0.3, 1) }), -1, false));
    return () => cancelAnimation(t);
  }, [reduced, active, t]);
  const style = useAnimatedStyle(() => ({ opacity: reduced ? 0.35 : 0.8 * (1 - t.value), transform: [{ scale: 0.4 + 1.2 * t.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.radar, style]} />;
}

const RADAR = 132;

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: extra.map.ground, overflow: 'hidden' },
  ground: { backgroundColor: extra.map.ground },
  abs: { position: 'absolute' },
  anchor: { position: 'absolute', width: 120, alignItems: 'center' },
  block: { position: 'absolute', borderRadius: 5, backgroundColor: extra.map.block },
  park: { backgroundColor: extra.map.park },
  avenue: { position: 'absolute', height: 14, backgroundColor: extra.map.avenue },
  vertical: { width: 12 },
  water: { position: 'absolute', height: 40, borderRadius: 20, backgroundColor: extra.map.water },
  radar: {
    position: 'absolute',
    top: 36 - RADAR / 2,
    left: 60 - RADAR / 2,
    width: RADAR,
    height: RADAR,
    borderRadius: RADAR / 2,
    borderWidth: 2,
    borderColor: color.accent,
    backgroundColor: alpha(color.accent, 0.08),
  },
});
