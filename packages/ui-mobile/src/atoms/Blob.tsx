/**
 * Halo coloré `.blob` (`border-radius:50%;filter:blur(70px)`), animé par `drift` (`.dr1` 10 s ;
 * `.dr2` 12 s, délai −5 s, `reverse`). Le flou est reproduit exactement par un dégradé radial
 * (foundations/blur.ts) : rendu identique iOS / Android / web, sans filtre.
 * Les props de position reprennent la boîte de la maquette (avant flou).
 */
import { useId, useMemo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { blobExtent, blurredDiscStops } from '../foundations/blur';
import { useKeyframeStyle } from '../foundations/motion-clock';
import { blob as BLOB } from '../foundations/theme';

export type BlobDrift = 'dr1' | 'dr2' | 'none';

export interface BlobProps {
  /** Diamètre de la boîte CSS (px). */
  size: number;
  color: string;
  opacity?: number;
  /** Écart-type du flou (CSS `blur(<σ>)`), 70 par défaut. */
  blur?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  drift?: BlobDrift;
}

export const DRIFT_OPTIONS: Record<Exclude<BlobDrift, 'none'>, { durationMs: number; delayMs: number; reverse: boolean }> = {
  dr1: { durationMs: 10000, delayMs: 0, reverse: false },
  dr2: { durationMs: 12000, delayMs: -5000, reverse: true },
};

export function Blob({ size, color, opacity = 1, blur = BLOB.blur, top, left, right, bottom, drift = 'dr1' }: BlobProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const R = size / 2;
  const extent = blobExtent(R, blur);
  const stops = useMemo(() => blurredDiscStops(R, blur, opacity, 32), [R, blur, opacity]);
  const motion = useKeyframeStyle('drift', drift === 'none' ? { disabled: true } : DRIFT_OPTIONS[drift]);
  return (
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: 'absolute', width: size, height: size, top, left, right, bottom }, motion]}>
      <View style={{ position: 'absolute', left: R - extent, top: R - extent, width: extent * 2, height: extent * 2 }}>
        <Svg width={extent * 2} height={extent * 2}>
          <Defs>
            <RadialGradient id={`blob${id}`} cx={extent} cy={extent} r={extent} fx={extent} fy={extent} gradientUnits="userSpaceOnUse">
              {stops.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />
              ))}
            </RadialGradient>
          </Defs>
          <Circle cx={extent} cy={extent} r={extent} fill={`url(#blob${id})`} />
        </Svg>
      </View>
    </Animated.View>
  );
}
