/**
 * Entrée `.pop` (`pop .65s cubic-bezier(.2,1.2,.3,1) both` + `animation-delay` en cascade
 * .08/.16/.24/.36/.44/.52 s sur Welcome). Mouvement réduit : contenu affiché directement.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useKeyframeStyle } from '../foundations/motion-clock';

export interface PopInProps {
  delayMs?: number;
  /** Durée (.45–.65 s selon les écrans ; 650 par défaut). */
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  pointerEvents?: 'box-none' | 'none' | 'auto' | 'box-only';
}

export function PopIn({ delayMs = 0, durationMs, style, children, pointerEvents }: PopInProps) {
  const anim = useKeyframeStyle('pop', { delayMs, durationMs, withOpacity: true });
  return (
    <Animated.View pointerEvents={pointerEvents} style={[style, anim]}>
      {children}
    </Animated.View>
  );
}
