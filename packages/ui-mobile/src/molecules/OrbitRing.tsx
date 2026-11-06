/**
 * Orbite de V4-Welcome : cercle pointillé (`border:2px dashed rgba(22,17,13,.15)`, 270 px de
 * contenu) qui tourne en 24 s linéaire (`.orb`) ; chaque satellite tourne en sens inverse (`.cnt`)
 * pour rester droit. Les satellites sont placés comme en CSS (top/left… + marges).
 */
import type { ReactNode } from 'react';
import { type DimensionValue } from 'react-native';
import Animated from 'react-native-reanimated';
import { useKeyframeStyle } from '../foundations/motion-clock';
import { alpha } from '../foundations/theme';

export interface OrbitSatellite {
  key: string;
  node: ReactNode;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  marginTop?: number;
  marginLeft?: number;
}

export interface OrbitRingProps {
  /** Diamètre du contenu (CSS `width`, hors bordure). */
  size?: number;
  borderWidth?: number;
  durationMs?: number;
  satellites?: readonly OrbitSatellite[];
}

function Satellite({ s, durationMs }: { s: OrbitSatellite; durationMs: number }) {
  const counter = useKeyframeStyle('orbit', { durationMs, reverse: true });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: s.top,
          left: s.left,
          right: s.right,
          bottom: s.bottom,
          marginTop: s.marginTop,
          marginLeft: s.marginLeft,
        },
        counter,
      ]}
    >
      {s.node}
    </Animated.View>
  );
}

export function OrbitRing({
  size = 270,
  borderWidth = 2,
  durationMs = 24000,
  satellites = [],
}: OrbitRingProps) {
  const spin = useKeyframeStyle('orbit', { durationMs });
  const outer = size + borderWidth * 2;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth,
          borderStyle: 'dashed',
          borderColor: alpha.orbitDash,
        },
        spin,
      ]}
    >
      {satellites.map((s) => (
        <Satellite key={s.key} s={s} durationMs={durationMs} />
      ))}
    </Animated.View>
  );
}
