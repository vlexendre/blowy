/**
 * Mouvement (docs/MOTION.md) : primitives d'animation et pets qui jouent avec l'écran.
 * Les primitives n'importent que `lib/`, `theme` et l'atome `Text` ; les pets (`pets/`) s'appuient sur les atomes.
 */
export { Appear, type AppearFrom, type AppearProps, resetAppearMemory, Stagger, staggerDelay, type StaggerProps } from './Appear';
export { Burst, type BurstKind, type BurstProps } from './Burst';
export { CountUp, type CountUpProps } from './CountUp';
export {
  type FlightOptions,
  HostPortal,
  type HostBurstOptions,
  type Measurable,
  type MeasurableNode,
  measureInWindow,
  MotionHost,
  type MotionHostProps,
  type Rect,
  useBurst,
  useFlyTo,
  useMotionHost,
} from './MotionHost';
export { PopIn, type PopInProps, Pulse, type PulseProps, Shake, type ShakeHandle, type ShakeProps } from './PopIn';
export { useReveal, type RevealOptions } from './reveal';
export { currentMinute, hashString, isNight, makeSeed, mulberry32, type Seed, useSeed } from './seed';
export { Shimmer, type ShimmerProps } from './Shimmer';
export { TypingDots, type TypingDotsProps } from './TypingDots';
export { HelloPeek, type HelloPeekProps } from './pets/HelloPeek';
export { PetEntrance, type PetEntranceProps } from './pets/PetEntrance';
export { KeyboardPeek, type KeyboardPeekProps } from './pets/KeyboardPeek';
export { PetActor, type PetActorHandle, type PetActorProps, type PetActorReaction, type PetTouch } from './pets/PetActor';
export { type PeekEdge, type PeekSafeArea, PetPeek, type PetPeekProps } from './pets/PetPeek';
export { PetRefresh, type PetRefreshProps, type PetRefreshScroll } from './pets/PetRefresh';
export {
  ease,
  fadeTo,
  MotionFocus,
  type MotionFocusProps,
  MotionProvider,
  type MotionProviderProps,
  pressScaleFor,
  springs,
  useAnimatedNumber,
  type AnimatedNumberOptions,
  useFocusPause,
  useForeground,
  useLoop,
  useMotionActive,
  usePressFeedback,
  useReducedMotion,
} from '../lib/motion';
export { haptic, hapticFor, type HapticKind, type HapticMoment } from '../lib/haptics';
export { ScrollLockProvider, useScrollLock } from '../lib/scroll-lock';
