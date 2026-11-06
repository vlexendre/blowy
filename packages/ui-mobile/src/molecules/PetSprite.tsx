/**
 * Pet animé des maquettes : image d'asset (@blowy/sprites) + animation de keyframes CSS exacte
 * (`sq` squash & stretch 2,4 s ancré au sol, `peek`, `beat`, `pop`, `bounce`, `bob`, `wob`).
 * « Réduire les animations » : pose de repos (aucune boucle). Positionnement absolu optionnel
 * (props `left/right/top/bottom`) pour les compositions de scène.
 */
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { KEYFRAMES, type KeyframeName } from '../foundations/keyframes';
import { useKeyframeStyle } from '../foundations/motion-clock';
import { Sprite } from '../atoms/Sprite';

export type SpriteMotion = 'sq' | 'peek' | 'beat' | 'pop' | 'bounce' | 'bob' | 'wob' | 'none';

export interface PetSpriteProps {
  /** Chemin du manifest @blowy/sprites (ex. `nino/young/joyful.webp`). */
  path: string | null;
  size: number;
  height?: number;
  motion?: SpriteMotion;
  /** `animation-delay` (ms, négatif = déphasage : −600, −1200, −1800 sur Welcome). */
  delayMs?: number;
  /** Durée surchargée (ex. `.sq` 2,2 s sur Chat, `.sq2` 2,8 s). */
  durationMs?: number;
  flip?: boolean;
  accessibilityLabel?: string;
  left?: DimensionValue;
  right?: DimensionValue;
  top?: DimensionValue;
  bottom?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export const transformOriginOf = (name: KeyframeName): string => {
  const o = (KEYFRAMES[name] as { origin?: readonly [number, number] }).origin ?? [0.5, 0.5];
  return `${o[0] * 100}% ${o[1] * 100}%`;
};

export function PetSprite({ path, size, height, motion = 'sq', delayMs, durationMs, flip, accessibilityLabel, left, right, top, bottom, style }: PetSpriteProps) {
  const name: KeyframeName = motion === 'none' ? 'sq' : motion;
  const anim = useKeyframeStyle(name, { delayMs, durationMs, disabled: motion === 'none', withOpacity: motion === 'pop' || motion === 'bounce' });
  const absolute = left !== undefined || right !== undefined || top !== undefined || bottom !== undefined;
  return (
    <Animated.View style={[absolute ? { position: 'absolute', left, right, top, bottom } : null, { width: size, height: height ?? size, transformOrigin: transformOriginOf(name) }, anim, style]}>
      <View style={flip ? { transform: [{ scaleX: -1 }] } : null}>
        <Sprite path={path} size={size} height={height} accessibilityLabel={accessibilityLabel} />
      </View>
    </Animated.View>
  );
}
