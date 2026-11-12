import { StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { alpha, color, extra, type } from '../../theme';

/** Fraise pleine (la croquette du soin « nourrir »), dessinée pour tomber dans la bouche du pet. */
export function Strawberry({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22.2c-4.3-1.6-8-5.8-8-10.1 0-2.9 2.7-4.5 8-4.5s8 1.6 8 4.5c0 4.3-3.7 8.5-8 10.1z" fill={color.coral} />
      <Path d="M8.3 9.8c-.9-.2-1.6.3-1.9 1.2" stroke={alpha(color.white, 0.55)} strokeWidth={1.3} strokeLinecap="round" fill="none" />
      <Path d="M6.6 8.6 9 5.4l3 2.2 3-2.2 2.4 3.2c-1.6.6-3.3.9-5.4.9s-3.8-.3-5.4-.9z" fill={extra.leaf} />
      <Path d="M12 7.4V2.6" stroke={extra.stem} strokeWidth={1.6} strokeLinecap="round" />
      {[
        [9.3, 12],
        [14.7, 12],
        [12, 14.4],
        [10, 17],
        [14, 17],
      ].map(([cx, cy], i) => (
        <Ellipse key={i} cx={cx} cy={cy} rx={0.65} ry={0.9} fill={alpha(color.accent, 0.9)} />
      ))}
    </Svg>
  );
}

/** Ombre douce au sol (ellipse en dégradé radial), sous un pet. */
export function SoftShadow({ width, height, opacity = 0.42 }: { width: number; height: number; opacity?: number }) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id="petShadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color.night} stopOpacity={opacity} />
          <Stop offset="0.6" stopColor={color.night} stopOpacity={opacity * 0.55} />
          <Stop offset="1" stopColor={color.night} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="url(#petShadow)" />
    </Svg>
  );
}

/** Goutte de sueur (gêne, refus). */
export function SweatDrop({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2.5c3.6 5.1 6.2 8.6 6.2 12.1A6.2 6.2 0 0 1 12 20.8a6.2 6.2 0 0 1-6.2-6.2c0-3.5 2.6-7 6.2-12.1z" fill={extra.sky} />
      <Circle cx={9.6} cy={14.4} r={1.4} fill={alpha(color.white, 0.8)} />
    </Svg>
  );
}

/** Pastille « ! » (surprise, réveil en sursaut). */
export function Bang({ size, mark = '!' }: { size: number; mark?: string }) {
  return (
    <View style={[styles.bang, { width: size, height: size, borderRadius: size / 2 }]}>
      <RNText style={[styles.bangText, { fontSize: size * 0.68, lineHeight: size * 0.86 }]}>{mark}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  bang: { backgroundColor: color.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.dark },
  bangText: { fontFamily: type.h3.fontFamily, color: color.dark, includeFontPadding: false, textAlign: 'center' },
});
