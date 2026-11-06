/**
 * Puce `.chip` : `inline-flex; gap 6; rayon 999`.
 *   md : marges 6/12, Inter 12 px 700 (Welcome, Craft)   sm : marges 5/10, 11 px 800→700 (majorité)
 * Puce blanche : ombre `0 2px 0 rgba(0,0,0,.07)` (`strong` : .08). `pulse` : anneau `@keyframes
 * pulse` (1,8 s, `ease`) qui REMPLACE l'ombre comme l'animation CSS remplace le style en ligne.
 * Sélection signalée par un fond encre ET une coche (jamais la couleur seule).
 */
import type { ReactNode } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { sampleKeyframes } from '../foundations/keyframes';
import { useKeyframeValues } from '../foundations/motion-clock';
import { color, radii, textSpec, type Tone } from '../foundations/theme';
import { chipStyle } from './styles';
import { bodyFont } from '../foundations/typography';
import { Icon, type IconName } from './Icon';

export interface ChipProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Élément visuel à gauche (sprite, pièce…). */
  leading?: ReactNode;
  /** Pastille ronde 7 px de cette couleur avant le libellé (« en ligne »). */
  dot?: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  size?: 'sm' | 'md';
  /** Ombre portée des puces blanches ; `none` pour les puces colorées (défaut selon le ton). */
  drop?: 'soft' | 'strong' | 'none';
  /** Anneau pulsé (`.pulse`) de cette couleur rgba à alpha plein de la maquette. */
  pulse?: 'online' | 'lime' | 'coral';
}

const PULSE_RGB: Record<NonNullable<ChipProps['pulse']>, [string, number]> = {
  online: ['46,173,106', 0.5],
  lime: ['200,245,66', 0.7],
  coral: ['255,90,60', 0.55],
};

function PulseRing({ kind }: { kind: NonNullable<ChipProps['pulse']> }) {
  const [rgb, a0] = PULSE_RGB[kind];
  const { live, t, still } = useKeyframeValues('pulse');
  const ring = (spread: number, a: number) => {
    'worklet';
    // Anneau EXTÉRIEUR uniquement (comme `box-shadow` : rien ne se peint sous la puce).
    return {
      top: -spread,
      left: -spread,
      right: -spread,
      bottom: -spread,
      borderWidth: spread,
      borderColor: `rgba(${rgb},${a0 * a})`,
    };
  };
  const animated = useAnimatedStyle(() => {
    if (!live) return {};
    const v = sampleKeyframes('pulse', t.value);
    return ring(v.spread, v.a);
  }, [live]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', borderRadius: radii.pill },
        still ? ring(still.spread, still.a) : animated,
      ]}
    />
  );
}

export function Chip({
  label,
  tone: t = 'white',
  icon,
  leading,
  dot,
  selected,
  onPress,
  accessibilityLabel,
  testID,
  size = 'md',
  drop,
  pulse,
}: ChipProps) {
  const effTone: Tone = selected ? 'ink' : t;
  const { box, fg } = chipStyle(
    effTone,
    size,
    pulse ? 'none' : (drop ?? (effTone === 'white' ? 'soft' : 'none')),
  );
  const sp = size === 'md' ? textSpec.chip : textSpec.chipSmall;
  const content = (
    <>
      {pulse ? <PulseRing kind={pulse} /> : null}
      {selected ? (
        <Icon name="check" size={14} tint={color.lime} />
      ) : icon ? (
        <Icon name={icon} size={14} tint={fg} />
      ) : null}
      {dot ? (
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: dot }} />
      ) : null}
      {leading}
      <RNText
        style={[bodyFont(sp.size, sp.weight), { color: fg }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.6}
      >
        {label}
      </RNText>
    </>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel ?? label} testID={testID} style={box}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      testID={testID}
      hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
      style={({ pressed }) => [
        box,
        pressed ? { transform: [{ translateY: 2 }], boxShadow: [] } : null,
      ]}
    >
      {content}
    </Pressable>
  );
}
