import type { Mood, Outfit, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import {
  GestureDetector,
  type PanGestureConfig,
  type TapGestureConfig,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  measure,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { fitAnchor, hasOutfit } from '../../assets/fit';
import { isFullBody, type PetPose, petImage, RENDER_RATIO } from '../../assets/pets';
import { DressedPet } from '../../atoms/DressedPet';
import { Icon } from '../../atoms/Icon';
import { hapticFor } from '../../lib/haptics';
import { ease, fadeTo, springs, useMotionActive, useReducedMotion } from '../../lib/motion';
import { useScrollLock } from '../../lib/scroll-lock';
import { motion } from '../../theme';
import { Burst } from '../Burst';
import { isNight, useSeed } from '../seed';
import { Bang, SoftShadow, Strawberry, SweatDrop } from './PetProps';

/** Réactions qu'on peut demander au pet (`ref.current.react(…)`). */
export type PetActorReaction = 'feed' | 'play' | 'nap' | 'cuddle' | 'joy' | 'no' | 'wave' | 'surprise';

export interface PetActorHandle {
  /** Joue une réaction (soins, garde-robe, refus…). */
  react: (kind: PetActorReaction) => void;
  /** Réveille le pet s'il dort (en sursaut). */
  wake: () => void;
}

/** Ce que le doigt a fait au pet. */
export type PetTouch = 'tap' | 'double' | 'snuggle' | 'grab' | 'throw';

export interface PetActorProps {
  species: Species;
  /** Tenue : avec au moins un objet, pose `debout` habillée (il s'exprime par le corps et de petits signes). */
  outfit?: Outfit | null;
  /** Largeur de la toile (hauteur = size / 0,9). */
  size: number;
  /** Pose de repos sans tenue. Défaut `debout`. */
  mood?: Mood | PetPose;
  /** Id du pet : graine de son hasard (règle 8). */
  seed?: string;
  /** Il boude : mouvements plus lents et lourds, humeurs tristes. */
  sulking?: boolean;
  /** Vie au repos (respiration, petits sauts, humeurs). Défaut vrai. */
  idle?: boolean;
  /** Répond au toucher (tap, double tap, appui long). Défaut vrai. */
  touch?: boolean;
  /** On peut l'attraper et le lancer. Défaut faux. */
  grabbable?: boolean;
  /** S'endort après ce délai sans toucher (ms) ; `null` : jamais. Défaut 25 s. La nuit (22 h – 7 h), il dort d'emblée. */
  sleepAfter?: number | null;
  /** Ombre au sol qui réagit aux sauts. Défaut vrai. */
  shadow?: boolean;
  /** Objets de la tenue cachés (en vol vers lui). */
  hiddenItems?: readonly string[];
  /** Appelé après chaque geste sur le pet. */
  onTouch?: (touch: PetTouch) => void;
  /** Le pet est tenu ou en l'air (pour passer son conteneur au premier plan et ne plus le rogner). */
  onGrabChange?: (grabbed: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Humeurs jouées au repos (corps sans tenue). */
const IDLE_MOODS: readonly PetPose[] = ['joie', 'smug', 'amour', 'surpris', 'salut'];
const SULK_MOODS: readonly PetPose[] = ['triste', 'colere'];
const BUSTS: readonly PetPose[] = ['neutre', 'salut', 'joie', 'smug', 'amour', 'surpris', 'triste', 'colere', 'dodo'];
/** Les bustes s'arrêtent à 84 % de la toile, le corps entier touche le sol à 95,5 % : on les pose au sol. */
const BUST_DROP = 0.115;
const LAG = { damping: 12, stiffness: 190, mass: 0.7 } as const;
const PLUSH = springs.plush;

const clamp = (v: number, a: number, b: number) => {
  'worklet';
  return Math.min(b, Math.max(a, v));
};

/** Au-delà d'une limite, le doigt ne tire plus qu'au tiers (effet élastique). */
const rubber = (v: number, min: number, max: number) => {
  'worklet';
  if (v < min) return min - (min - v) * 0.3;
  if (v > max) return max + (v - max) * 0.3;
  return v;
};

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Lancer sur un axe : va vers le bord, rebondit dessus (amorti) s'il l'atteint, puis rentre à la maison en ressort. */
function throwAxis(sv: SharedValue<number>, v: number, min: number, max: number, onImpact: () => void, onHome: () => void) {
  'worklet';
  const x0 = sv.value;
  const target = x0 + v * 0.32;
  if (target > max || target < min) {
    const wall = target > max ? max : min;
    const t1 = clamp((Math.abs(wall - x0) / Math.max(1, Math.abs(v))) * 1000 * 1.25, 70, 420);
    const rebound = wall - (target - wall) * 0.4;
    sv.value = withSequence(
      withTiming(wall, { duration: t1, easing: Easing.out(Easing.sin) }, (done) => {
        if (done) onImpact();
      }),
      withTiming(rebound, { duration: 300, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) onHome();
      }),
      withSpring(0, PLUSH),
    );
  } else {
    sv.value = withSequence(
      withTiming(target, { duration: 340, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) onHome();
      }),
      withSpring(0, PLUSH),
    );
  }
}

/**
 * Le grand pet vivant (accueil, garde-robe, fêtes) : il respire, sautille, change d'humeur, réagit au toucher
 * (tap : s'écrase et un cœur s'envole ; double tap : saute ; appui long : se blottit), se laisse attraper et lancer
 * (`grabbable`), s'endort sans toucher et se réveille en sursaut. `ref.react(…)` joue les réactions des soins.
 * Avec « réduire les animations » : plus de déplacements ni de boucles, seulement les changements d'humeur en fondu.
 */
export const PetActor = forwardRef<PetActorHandle, PetActorProps>(function PetActor(
  {
    species,
    outfit,
    size,
    mood = 'debout',
    seed: seedId,
    sulking = false,
    idle = true,
    touch = true,
    grabbable = false,
    sleepAfter = 25_000,
    shadow = true,
    hiddenItems,
    onTouch,
    onGrabChange,
    accessibilityLabel,
    accessibilityHint,
    style,
  },
  ref,
) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const seed = useSeed(seedId, 'actor');
  const scrollLock = useScrollLock();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const dressed = hasOutfit(outfit);
  const h = Math.round(size / RENDER_RATIO);
  const head = fitAnchor(species, 'headTop');
  const mouth = fitAnchor(species, 'mouth');
  const ground = fitAnchor(species, 'ground');
  const restIsBody = isFullBody(mood as PetPose) || mood === 'debout';

  // — État lent (React) : humeur affichée, sommeil, accessoires en scène, particules.
  const [expr, setExpr] = useState<PetPose | null>(null);
  const [asleep, setAsleep] = useState(false);
  const [napping, setNapping] = useState(false);
  const [prop, setProp] = useState<'food' | 'ball' | null>(null);
  const [hearts, setHearts] = useState(0);
  const [love, setLove] = useState(0);
  const [stars, setStars] = useState(0);
  const [sparkles, setSparkles] = useState(0);
  const [preload, setPreload] = useState(false);

  // — Valeurs animées (fil natif).
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const rot = useSharedValue(0);
  const breath = useSharedValue(0);
  const amp = useSharedValue(1);
  const free = useSharedValue(0);
  /** Lâché : il rentre ; le sol ne compte (écrasement à l'arrivée) qu'une fois repassé au-dessus de sa place. */
  const returning = useSharedValue(0);
  const exprO = useSharedValue(0);
  const bang = useSharedValue(0);
  const sweat = useSharedValue(0);
  const lagX = useSharedValue(0);
  const lagY = useSharedValue(0);
  const lagR = useSharedValue(0);
  const foodP = useSharedValue(0);
  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);
  const ballR = useSharedValue(0);
  const ballO = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const moved = useSharedValue(0);
  const bounds = useSharedValue<Bounds>({ minX: -size, maxX: size, minY: -size, maxY: size * 0.3 });
  const winW = useSharedValue(win.width);
  const winH = useSharedValue(win.height);
  const topInset = useSharedValue(insets.top);
  const bottomInset = useSharedValue(insets.bottom);
  const box = useAnimatedRef<View>();

  useEffect(() => {
    winW.value = win.width;
    winH.value = win.height;
    topInset.value = insets.top;
    bottomInset.value = insets.bottom;
  }, [win.width, win.height, insets.top, insets.bottom, winW, winH, topInset, bottomInset]);

  // — Minuteries de la chorégraphie (annulées au démontage et à chaque nouvelle réaction).
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const busy = useRef(false);
  const asleepRef = useRef(false);
  asleepRef.current = asleep;
  const exprTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIdle = useRef<string | undefined>(undefined);

  /** Humeur affichée un moment (corps sans tenue), puis retour au repos. */
  const express = useCallback(
    (pose: PetPose | null, ms = 1200) => {
      if (dressed) return;
      if (exprTimer.current) clearTimeout(exprTimer.current);
      setExpr(pose);
      if (pose && ms > 0) exprTimer.current = setTimeout(() => setExpr(asleepRef.current ? 'dodo' : null), ms);
    },
    [dressed],
  );
  useEffect(
    () => () => {
      if (exprTimer.current) clearTimeout(exprTimer.current);
    },
    [],
  );

  // Changement d'humeur : le pet s'écrase un instant et l'image change au creux de l'écrasement (pas de fantôme
  // entre deux poses de formes différentes), puis il se redresse en ressort.
  const showExpr = !dressed && !!expr && expr !== mood;
  const lastExpr = useRef<PetPose | null>(null);
  if (showExpr && expr) lastExpr.current = expr;
  useEffect(() => {
    const to = showExpr ? 1 : 0;
    if (reduced) {
      exprO.value = fadeTo(to, motion.fast);
      return;
    }
    exprO.value = withDelay(70, withTiming(to, { duration: 20 }));
    if (!busy.current && !asleepRef.current) {
      sy.value = withSequence(withTiming(0.9, { duration: 80, easing: ease.out }), withSpring(1, springs.pop));
      sx.value = withSequence(withTiming(1.07, { duration: 80, easing: ease.out }), withSpring(1, springs.pop));
    }
  }, [expr, showExpr, reduced, exprO, sx, sy]);

  // Précharge des humeurs (évite un blanc au premier changement).
  useEffect(() => {
    const id = setTimeout(() => setPreload(true), 1200);
    return () => clearTimeout(id);
  }, []);

  // — Respiration (boucle native, coupée hors écran et si animations réduites).
  useEffect(() => {
    const run = active && !reduced;
    if (!run) {
      cancelAnimation(breath);
      breath.value = withTiming(0, { duration: motion.fast });
      return;
    }
    const half = asleep ? 2100 : sulking ? 1800 : motion.breath;
    amp.value = withTiming(asleep ? 1.6 : sulking ? 0.7 : 1, { duration: motion.slow });
    breath.value = withRepeat(withSequence(withTiming(1, { duration: half, easing: ease.inOut }), withTiming(0, { duration: half, easing: ease.inOut })), -1);
    return () => cancelAnimation(breath);
  }, [active, reduced, asleep, sulking, breath, amp]);

  // — Suiveurs en retard : chapeaux et signes au-dessus de la tête suivent le corps avec un temps de retard.
  useAnimatedReaction(
    () => [x.value, y.value, rot.value] as const,
    ([a, b, c]) => {
      lagX.value = withSpring(a, LAG);
      lagY.value = withSpring(b, LAG);
      lagR.value = withSpring(c, LAG);
    },
  );

  useAnimatedReaction(
    () => returning.value === 1 && y.value <= 0,
    (back) => {
      if (back) {
        returning.value = 0;
        free.value = 0;
      }
    },
  );

  // — Impact au sol en revenant d'un lancer : vibration.
  useAnimatedReaction(
    () => y.value > 0 && free.value === 0,
    (now, before) => {
      if (now && before === false) scheduleOnRN(hapticFor, 'land');
    },
  );

  // — Chorégraphies.
  const hop = useCallback(
    (height: number, dx = 0, at = 0) => {
      const H = height;
      const land = 1 - Math.min(0.24, (H / size) * 0.55);
      const T = { crouch: 110, up: 270, down: 230 };
      sy.value = withDelay(
        at,
        withSequence(
          withTiming(0.86, { duration: T.crouch, easing: ease.out }),
          withTiming(1.12, { duration: 130, easing: ease.out }),
          withTiming(1, { duration: T.up - 130 }),
          withTiming(1.05, { duration: T.down }),
          withTiming(land, { duration: 70, easing: ease.out }),
          withSpring(1, PLUSH),
        ),
      );
      sx.value = withDelay(
        at,
        withSequence(
          withTiming(1.1, { duration: T.crouch, easing: ease.out }),
          withTiming(0.9, { duration: 130, easing: ease.out }),
          withTiming(1, { duration: T.up - 130 }),
          withTiming(0.97, { duration: T.down }),
          withTiming(2 - land, { duration: 70, easing: ease.out }),
          withSpring(1, PLUSH),
        ),
      );
      y.value = withDelay(
        at + T.crouch,
        withSequence(withTiming(-H, { duration: T.up, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: T.down, easing: Easing.in(Easing.quad) })),
      );
      if (dx) x.value = withDelay(at + T.crouch, withTiming(x.value + dx, { duration: T.up + T.down, easing: ease.inOut }));
      later(at + T.crouch + T.up + T.down, () => hapticFor('land'));
    },
    [size, sx, sy, x, y, later],
  );

  const squish = useCallback(
    (lean = 0) => {
      sx.value = withSequence(withTiming(1.1, { duration: motion.instant, easing: ease.out }), withSpring(1, PLUSH));
      sy.value = withSequence(withTiming(0.88, { duration: motion.instant, easing: ease.out }), withSpring(1, PLUSH));
      rot.value = withSequence(withTiming(lean * 5, { duration: 120 }), withSpring(0, PLUSH));
    },
    [sx, sy, rot],
  );

  const showBang = useCallback(() => {
    bang.value = reduced
      ? withSequence(fadeTo(1, motion.fast), withDelay(700, fadeTo(0)))
      : withSequence(
          withTiming(1.15, { duration: 120, easing: ease.out }),
          withTiming(1, { duration: 80 }),
          withDelay(520, withTiming(0, { duration: motion.fast })),
        );
  }, [bang, reduced]);
  const showSweat = useCallback(() => {
    sweat.value = 0;
    sweat.value = reduced
      ? withSequence(fadeTo(1, motion.fast), withDelay(800, fadeTo(0)))
      : withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) });
  }, [sweat, reduced]);

  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armSleep = useCallback(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    if (sleepAfter === null || !idle) return;
    const night = isNight();
    sleepTimer.current = setTimeout(
      () => {
        if (busy.current) return;
        setAsleep(true);
      },
      night ? Math.min(sleepAfter, 8000) : sleepAfter,
    );
  }, [sleepAfter, idle]);
  useEffect(() => {
    if (sleepAfter !== null && idle && isNight()) {
      const id = setTimeout(() => setAsleep(true), 600);
      return () => clearTimeout(id);
    }
    armSleep();
    return () => {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
    };
  }, [armSleep, sleepAfter, idle]);
  useEffect(() => {
    if (asleep) {
      express('dodo', 0);
      if (!reduced) {
        rot.value = withSpring(sulking ? -3 : 4, springs.soft);
        sy.value = withSpring(0.96, springs.soft);
      }
    }
  }, [asleep, express, reduced, rot, sy, sulking]);

  const wake = useCallback(() => {
    if (!asleepRef.current) return;
    setAsleep(false);
    asleepRef.current = false;
    express('surpris', 900);
    showBang();
    hapticFor('land');
    if (!reduced) {
      rot.value = withSequence(withTiming(-7, { duration: 60 }), withTiming(6, { duration: 70 }), withTiming(-3, { duration: 70 }), withSpring(0, PLUSH));
      sy.value = withSequence(withTiming(1.14, { duration: 90, easing: ease.out }), withSpring(1, PLUSH));
      y.value = withSequence(withTiming(-size * 0.1, { duration: 120, easing: ease.out }), withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) }));
    }
    armSleep();
  }, [express, showBang, reduced, rot, sy, y, size, armSleep]);

  const react = useCallback(
    (kind: PetActorReaction) => {
      if (asleepRef.current && kind !== 'nap') {
        setAsleep(false);
        asleepRef.current = false;
        if (!reduced) rot.value = withSpring(0, PLUSH);
      }
      clearTimers();
      busy.current = true;
      armSleep();
      const done = (ms: number) => later(ms, () => (busy.current = false));
      if (reduced) {
        const pose: Record<PetActorReaction, PetPose> = {
          feed: 'joie',
          play: 'joie',
          nap: 'dodo',
          cuddle: 'amour',
          joy: 'joie',
          no: 'colere',
          wave: 'salut',
          surprise: 'surpris',
        };
        express(pose[kind], kind === 'nap' ? 2400 : 1400);
        if (kind === 'surprise') showBang();
        if (kind === 'no') showSweat();
        done(1400);
        return;
      }
      switch (kind) {
        case 'feed': {
          setProp('food');
          foodP.value = 0;
          express('surpris', 420);
          rot.value = withSequence(withTiming(-4, { duration: 200 }), withTiming(0, { duration: 200 }));
          sy.value = withTiming(1.04, { duration: 300 });
          foodP.value = withTiming(1, { duration: 380, easing: Easing.in(Easing.quad) });
          later(380, () => {
            foodP.value = withTiming(2, { duration: 90 });
            express('joie', 1200);
            hapticFor('press');
            const c = (v: number) => withTiming(v, { duration: 90, easing: ease.inOut });
            sy.value = withSequence(c(0.88), c(1.05), c(0.9), c(1.04), c(0.94), withSpring(1, PLUSH));
            sx.value = withSequence(c(1.08), c(0.97), c(1.06), c(0.98), c(1.03), withSpring(1, PLUSH));
          });
          later(700, () => setStars((n) => n + 1));
          later(900, () => setProp(null));
          done(1300);
          break;
        }
        case 'play': {
          setProp('ball');
          const D = 1500;
          ballO.value = 1;
          ballX.value = size * 0.8;
          ballY.value = -size * 0.5;
          ballR.value = 0;
          ballX.value = withTiming(-size * 1.05, { duration: D, easing: Easing.linear });
          ballR.value = withTiming(-760, { duration: D, easing: Easing.linear });
          const b = (to: number, d: number, up: boolean) => withTiming(to, { duration: d, easing: up ? Easing.out(Easing.quad) : Easing.in(Easing.quad) });
          ballY.value = withSequence(
            b(0, 300, false),
            b(-size * 0.34, 250, true),
            b(0, 250, false),
            b(-size * 0.18, 200, true),
            b(0, 200, false),
            b(-size * 0.07, 140, true),
            b(0, 140, false),
          );
          ballO.value = withDelay(D - 220, withTiming(0, { duration: 220 }));
          express('surpris', 380);
          rot.value = withSequence(withTiming(4, { duration: 250 }), withTiming(-5, { duration: 300 }), withSpring(0, PLUSH));
          later(380, () => express('joie', 1500));
          later(260, () => hop(size * 0.18, -size * 0.12));
          later(900, () => hop(size * 0.14, -size * 0.14));
          later(1500, () => {
            x.value = withTiming(0, { duration: 520, easing: ease.inOut });
            hop(size * 0.1, 0, 0);
            setSparkles((n) => n + 1);
          });
          later(D + 80, () => setProp(null));
          done(2200);
          break;
        }
        case 'nap': {
          setNapping(true);
          express('dodo', 2700);
          amp.value = withTiming(1.7, { duration: 400 });
          sy.value = withTiming(0.93, { duration: 520, easing: ease.inOut });
          sx.value = withTiming(1.03, { duration: 520, easing: ease.inOut });
          rot.value = withTiming(4, { duration: 600, easing: ease.inOut });
          later(2700, () => {
            setNapping(false);
            amp.value = withTiming(1, { duration: 400 });
            // Il s'étire en se réveillant.
            sy.value = withSequence(withTiming(1.1, { duration: 300, easing: ease.out }), withSpring(1, PLUSH));
            sx.value = withSequence(withTiming(0.94, { duration: 300, easing: ease.out }), withSpring(1, PLUSH));
            rot.value = withSpring(0, PLUSH);
            express('joie', 900);
          });
          done(3300);
          break;
        }
        case 'cuddle': {
          express('amour', 1700);
          setLove((n) => n + 1);
          hapticFor('land');
          sx.value = withSequence(withTiming(1.12, { duration: 170, easing: ease.out }), withTiming(1.08, { duration: 380 }), withSpring(1, PLUSH));
          sy.value = withSequence(withTiming(0.9, { duration: 170, easing: ease.out }), withTiming(0.93, { duration: 380 }), withSpring(1, PLUSH));
          rot.value = withSequence(
            withTiming(-5, { duration: 220, easing: ease.inOut }),
            withTiming(5, { duration: 320, easing: ease.inOut }),
            withSpring(0, PLUSH),
          );
          done(1500);
          break;
        }
        case 'joy': {
          express('joie', 1300);
          hop(size * 0.26);
          later(560, () => setStars((n) => n + 1));
          done(1200);
          break;
        }
        case 'no': {
          express('colere', 1100);
          showSweat();
          const s = (v: number, d = 75) => withTiming(v, { duration: d, easing: ease.inOut });
          rot.value = withSequence(s(-9), s(8), s(-7), s(5), s(-3), withSpring(0, PLUSH));
          sy.value = withSequence(withTiming(0.96, { duration: 120 }), withSpring(1, springs.pop));
          done(900);
          break;
        }
        case 'wave': {
          express('salut', 1700);
          const s = (v: number) => withTiming(v, { duration: 260, easing: ease.inOut });
          rot.value = withSequence(s(-6), s(6), s(-5), s(4), withSpring(0, PLUSH));
          if (dressed) setSparkles((n) => n + 1);
          hop(size * 0.08, 0, 0);
          done(1500);
          break;
        }
        case 'surprise': {
          express('surpris', 1000);
          showBang();
          hop(size * 0.12);
          done(900);
          break;
        }
      }
    },
    [reduced, express, showBang, showSweat, clearTimers, later, armSleep, hop, size, dressed, foodP, ballO, ballX, ballY, ballR, rot, sx, sy, x, amp],
  );

  useImperativeHandle(ref, () => ({ react, wake }), [react, wake]);

  // — Vie au repos : une petite chose toutes les 3,5 à 7 s, jamais deux fois la même de suite.
  useEffect(() => {
    if (!idle || reduced || !active) return;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!busy.current && !asleepRef.current && free.value === 0) {
        const choices = sulking ? ['sigh', 'turn', 'mood'] : ['hop', 'look', 'wiggle', 'mood', 'mood'];
        const what = seed.pick(choices, lastIdle.current);
        lastIdle.current = what;
        if (what === 'hop') hop(size * 0.1);
        else if (what === 'look') {
          const side = seed.chance(0.5) ? 1 : -1;
          rot.value = withSequence(withSpring(side * 7, springs.soft), withDelay(900, withSpring(0, springs.soft)));
          x.value = withSequence(withSpring(side * 3, springs.soft), withDelay(900, withSpring(0, springs.soft)));
        } else if (what === 'wiggle') {
          const w = (v: number) => withTiming(v, { duration: 110, easing: ease.inOut });
          rot.value = withSequence(w(-4), w(4), w(-3), w(2), withSpring(0, PLUSH));
        } else if (what === 'sigh') {
          sy.value = withSequence(
            withTiming(1.04, { duration: 700, easing: ease.inOut }),
            withTiming(0.95, { duration: 900, easing: ease.inOut }),
            withSpring(1, springs.soft),
          );
        } else if (what === 'turn') {
          rot.value = withSequence(withSpring(-5, springs.soft), withDelay(1400, withSpring(0, springs.soft)));
        } else if (dressed) {
          setSparkles((n) => n + 1);
          sy.value = withSequence(withTiming(0.95, { duration: 100 }), withSpring(1, PLUSH));
        } else {
          express(seed.pick(sulking ? SULK_MOODS : IDLE_MOODS, expr ?? undefined), 1300);
        }
      }
      id = setTimeout(tick, seed.range(sulking ? 5200 : 3500, sulking ? 9000 : 7000));
    };
    id = setTimeout(tick, seed.range(1600, 3000));
    return () => clearTimeout(id);
    // `expr` lu au moment du tirage seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle, reduced, active, sulking, dressed, seed, hop, express, size, rot, sy, x, free]);

  // — Toucher.
  const lastTap = useRef(0);
  const locked = useRef(false);
  const lock = useCallback(
    (on: boolean) => {
      if (locked.current === on) return;
      locked.current = on;
      scrollLock.setLocked(on);
    },
    [scrollLock],
  );
  useEffect(() => () => lock(false), [lock]);
  /** Début d'un geste : `hold` (appui long, il se blottit déjà) ou `carry` (on l'emporte). */
  const startJS = useCallback(
    (kind: 'hold' | 'carry') => {
      busy.current = true;
      clearTimers();
      lock(true);
      if (asleepRef.current) {
        setAsleep(false);
        asleepRef.current = false;
      }
      if (kind === 'hold') {
        express('amour', 0);
        hapticFor('land');
        return;
      }
      onGrabChange?.(true);
      express('surpris', 0);
      showBang();
      hapticFor('press');
      onTouch?.('grab');
    },
    [clearTimers, lock, express, showBang, onGrabChange, onTouch],
  );
  /** Fin d'un geste : `snuggle` (tenu sans bouger), `drop` (posé), `throw` (lancé). */
  const endJS = useCallback(
    (kind: 'snuggle' | 'drop' | 'throw') => {
      lock(false);
      busy.current = false;
      armSleep();
      if (kind === 'snuggle') {
        react('cuddle');
        onTouch?.('snuggle');
        return;
      }
      express('joie', 1100);
      if (kind === 'throw') onTouch?.('throw');
      later(kind === 'throw' ? 1400 : 800, () => onGrabChange?.(false));
    },
    [lock, armSleep, react, onTouch, express, later, onGrabChange],
  );
  const impactJS = useCallback(() => {
    hapticFor('land');
  }, []);

  const onTap = useCallback(
    (tx: number) => {
      const now = Date.now();
      const double = now - lastTap.current < 320;
      lastTap.current = double ? 0 : now;
      if (asleepRef.current) {
        wake();
        onTouch?.('tap');
        return;
      }
      armSleep();
      if (double) {
        if (!reduced) hop(size * 0.3);
        express('joie', 1200);
        later(640, () => setStars((n) => n + 1));
        onTouch?.('double');
        return;
      }
      hapticFor('press');
      if (!reduced) squish(tx < size / 2 ? -1 : 1);
      setHearts((n) => n + 1);
      express(sulking ? 'triste' : 'joie', 900);
      onTouch?.('tap');
    },
    [wake, armSleep, reduced, hop, size, express, later, squish, sulking, onTouch],
  );

  // Trampolines stables : les gestes (et leurs worklets) ne sont recréés que si leurs réglages changent, jamais à
  // chaque rendu (un geste recréé pendant qu'on tient le pet serait annulé).
  const startRef = useRef(startJS);
  startRef.current = startJS;
  const endRef = useRef(endJS);
  endRef.current = endJS;
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const startStable = useCallback((kind: 'hold' | 'carry') => startRef.current(kind), []);
  const endStable = useCallback((kind: 'snuggle' | 'drop' | 'throw') => endRef.current(kind), []);
  const tapStable = useCallback((tx: number) => tapRef.current(tx), []);

  const canGrab = grabbable && touch && !reduced;
  /** 0 : rien · 1 : tenu sans bouger (appui long) · 2 : emporté. */
  const holdMode = useSharedValue(0);
  const { sideCfg, holdCfg, tapCfg } = useMemo(() => {
    const grabStart = (long: boolean) => {
      'worklet';
      cancelAnimation(x);
      cancelAnimation(y);
      const m = measure(box);
      if (m) {
        const pad = 4;
        bounds.value = {
          // Les images ont une marge transparente d'environ 5 % : le pet touche le bord sans en sortir.
          minX: -m.pageX + pad - size * 0.04,
          maxX: winW.value - m.pageX - m.width - pad + size * 0.04,
          minY: -m.pageY + topInset.value + pad - h * 0.1,
          maxY: winH.value - m.pageY - m.height - bottomInset.value - pad,
        };
      }
      startX.value = x.value;
      startY.value = y.value;
      moved.value = 0;
      free.value = 1;
      holdMode.value = long ? 1 : 2;
      sy.value = withSpring(long ? 1.07 : 1.04, springs.pop);
      sx.value = withSpring(long ? 0.95 : 0.97, springs.pop);
      if (long) y.value = withSpring(y.value - size * 0.04, springs.pop);
      scheduleOnRN(startStable, long ? 'hold' : 'carry');
    };
    type PanEvent = { translationX: number; translationY: number; velocityX: number; velocityY: number };
    const grabMove = (e: PanEvent, mayCarry: boolean) => {
      'worklet';
      moved.value = Math.max(moved.value, Math.hypot(e.translationX, e.translationY));
      if (holdMode.value === 1) {
        if (!mayCarry || moved.value < 10) return;
        holdMode.value = 2;
        startX.value = x.value - e.translationX;
        startY.value = y.value - e.translationY;
        scheduleOnRN(startStable, 'carry');
      }
      const b = bounds.value;
      x.value = rubber(startX.value + e.translationX, b.minX, b.maxX);
      y.value = rubber(startY.value + e.translationY, b.minY, b.maxY);
      const speed = Math.hypot(e.velocityX, e.velocityY);
      const st = Math.min(0.15, speed / 4500);
      const vertical = Math.abs(e.velocityY) / (speed + 1);
      rot.value = withSpring(clamp(e.velocityX * 0.012, -18, 18), { damping: 18, stiffness: 260 });
      sy.value = withSpring(1.04 + st * vertical - st * 0.5 * (1 - vertical), { damping: 20, stiffness: 320 });
      sx.value = withSpring(0.97 + st * (1 - vertical) - st * 0.5 * vertical, { damping: 20, stiffness: 320 });
    };
    const impact = (axis: 'x' | 'y') => {
      'worklet';
      if (axis === 'x') {
        sx.value = withSequence(withTiming(0.8, { duration: 60 }), withSpring(1, PLUSH));
        sy.value = withSequence(withTiming(1.12, { duration: 60 }), withSpring(1, PLUSH));
      } else {
        sy.value = withSequence(withTiming(0.8, { duration: 60 }), withSpring(1, PLUSH));
        sx.value = withSequence(withTiming(1.14, { duration: 60 }), withSpring(1, PLUSH));
      }
      scheduleOnRN(impactJS);
    };
    const grabEnd = (e: PanEvent) => {
      'worklet';
      const b = bounds.value;
      const speed = Math.hypot(e.velocityX, e.velocityY);
      rot.value = withSpring(0, PLUSH);
      const mode = holdMode.value;
      holdMode.value = 0;
      if (mode === 1) {
        returning.value = 1;
        x.value = withSpring(0, PLUSH);
        y.value = withSpring(0, PLUSH);
        sx.value = withSpring(1, PLUSH);
        sy.value = withSpring(1, PLUSH);
        scheduleOnRN(endStable, 'snuggle');
        return;
      }
      const thrown = speed > 900;
      if (thrown) {
        throwAxis(
          x,
          e.velocityX,
          b.minX,
          b.maxX,
          () => impact('x'),
          () => undefined,
        );
        throwAxis(
          y,
          e.velocityY,
          b.minY,
          b.maxY,
          () => impact('y'),
          () => {
            returning.value = 1;
          },
        );
      } else {
        returning.value = 1;
        x.value = withSpring(0, PLUSH);
        // Lâché sous sa place, il remonte sans s'envoler (moins de dépassement) ; au-dessus, il retombe en rebondissant.
        y.value = withSpring(0, y.value > 0 ? { ...PLUSH, damping: 15 } : { ...PLUSH, damping: 9 });
      }
      sx.value = withSpring(1, PLUSH);
      sy.value = withSpring(1, PLUSH);
      scheduleOnRN(endStable, thrown ? 'throw' : 'drop');
    };

    // Attraper à l'horizontale tout de suite ; à la verticale, l'écran défile (le geste échoue) ;
    // après un appui de 0,35 s, on le tient : sans bouger il se blottit, en bougeant on l'emporte.
    const sideCfg: PanGestureConfig = {
      enabled: canGrab,
      activeOffsetX: [-10, 10],
      failOffsetY: [-14, 14],
      onActivate: () => {
        'worklet';
        grabStart(false);
      },
      onUpdate: (e) => {
        'worklet';
        grabMove(e, true);
      },

      onDeactivate: (e) => {
        'worklet';
        grabEnd(e);
      },
    };
    const holdCfg: PanGestureConfig = {
      enabled: touch && !reduced,
      activateAfterLongPress: 350,
      onActivate: () => {
        'worklet';
        grabStart(true);
      },
      onUpdate: (e) => {
        'worklet';
        grabMove(e, canGrab);
      },
      onDeactivate: (e) => {
        'worklet';
        grabEnd(e);
      },
    };
    const tapCfg: TapGestureConfig = {
      enabled: touch,
      runOnJS: true,
      maxDuration: 340,
      onActivate: (e) => tapStable(e.x),
    };
    return { sideCfg, holdCfg, tapCfg };
    // Valeurs animées et trampolines stables : seuls ces réglages recréent les gestes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, h, canGrab, touch, reduced]);
  const panSide = usePanGesture(sideCfg);
  const panHold = usePanGesture(holdCfg);
  const tap = useTapGesture(tapCfg);
  const gesture = useCompetingGestures(panHold, panSide, tap);

  // — Styles animés.
  const drop = BUST_DROP * h;
  const body = useAnimatedStyle(() => {
    const groundHit = free.value === 0 && y.value > 0 ? Math.min(0.26, (y.value / size) * 1.3) : 0;
    const yy = free.value === 0 && y.value > 0 ? 0 : y.value;
    const b = breath.value * amp.value;
    return {
      transform: [
        { translateX: x.value },
        { translateY: yy - 2 * b },
        { rotate: `${rot.value}deg` },
        { scaleX: sx.value * (1 - 0.02 * b) * (1 + groundHit * 0.8) },
        { scaleY: sy.value * (1 + 0.03 * b) * (1 - groundHit) },
      ],
    };
  });
  const headLag = useAnimatedStyle(() => ({
    transform: [
      { translateX: clamp((lagX.value - x.value) * 0.5, -8, 8) },
      { translateY: clamp((lagY.value - y.value) * 0.35, -8, 8) },
      { rotate: `${clamp((lagR.value - rot.value) * 0.9, -10, 10)}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => {
    const lift = clamp(-y.value / (size * 0.5), 0, 1);
    const away = clamp((Math.abs(x.value) + Math.max(0, y.value)) / (size * 0.7), 0, 1);
    return { opacity: (1 - lift * 0.6) * (1 - away), transform: [{ translateX: x.value * 0.9 }, { scaleX: 1 - lift * 0.45 }, { scaleY: 1 - lift * 0.3 }] };
  });
  const restStyle = useAnimatedStyle(() => ({ opacity: 1 - exprO.value }));
  const exprStyle = useAnimatedStyle(() => ({ opacity: exprO.value }));
  const signs = useAnimatedStyle(() => ({
    // Suivent le corps (même porté vers le bas) ; au sol, ils ne s'enfoncent pas avec l'écrasement.
    transform: [{ translateX: lagX.value }, { translateY: (free.value ? lagY.value : Math.min(0, lagY.value)) + (restIsBody ? exprO.value * drop * 0.8 : 0) }],
  }));
  const bangStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, bang.value),
    transform: [{ scale: bang.value }, { rotate: `${(1 - bang.value) * -30}deg` }],
  }));
  const sweatStyle = useAnimatedStyle(() => {
    const t = sweat.value;
    return { opacity: t <= 0 ? 0 : t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1, transform: [{ translateY: t * 14 }] };
  });
  const headX = head.x * size;
  const headY = head.y * h;
  const foodSize = size * 0.2;
  const foodStyle = useAnimatedStyle(() => {
    const p = foodP.value;
    const fall = Math.min(1, p);
    const eaten = Math.max(0, p - 1);
    const y0 = headY - size * 0.55;
    const y1 = mouth.y * h - foodSize * 0.55;
    return {
      opacity: p >= 2 ? 0 : 1,
      transform: [{ translateX: x.value }, { translateY: y0 + (y1 - y0) * fall }, { rotate: `${fall * 40}deg` }, { scale: 1 - eaten }],
    };
  });
  const ballSize = size * 0.17;
  const ballStyle = useAnimatedStyle(() => ({
    opacity: ballO.value,
    transform: [{ translateX: ballX.value }, { translateY: ballY.value }, { rotate: `${ballR.value}deg` }],
  }));

  const expressive = lastExpr.current;
  const exprIsBust = expressive ? !isFullBody(expressive) : false;
  const bustOffset = restIsBody && exprIsBust ? drop : 0;
  const busts = useMemo(() => (preload && !dressed ? BUSTS : []), [preload, dressed]);

  return (
    <View
      ref={box}
      collapsable={false}
      accessible
      accessibilityRole={touch ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onAccessibilityTap={touch ? () => onTap(size / 2) : undefined}
      style={[{ width: size, height: h }, style]}
    >
      {shadow ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.abs, { width: size * 0.7, height: size * 0.1, left: size * 0.15, top: ground.y * h - size * 0.055 }, shadowStyle]}
        >
          <SoftShadow width={size * 0.7} height={size * 0.1} />
        </Animated.View>
      ) : null}
      <GestureDetector gesture={gesture} touchAction="pan-y">
        <Animated.View style={[styles.fill, styles.origin, body]}>
          {/* Les images ne captent rien : le doigt agit sur le corps (pas de glisser-déposer d'image sur le web). */}
          {dressed ? (
            <DressedPet species={species} outfit={outfit} size={size} hidden={hiddenItems} headStyle={reduced ? undefined : headLag} style={styles.inert} />
          ) : (
            <>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, restStyle]}>
                <Image source={petImage(species, mood)} contentFit="contain" style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateY: bustOffset }] }, exprStyle]}>
                {expressive ? <Image source={petImage(species, expressive)} contentFit="contain" style={StyleSheet.absoluteFill} /> : null}
              </Animated.View>
            </>
          )}
        </Animated.View>
      </GestureDetector>
      {/* Signes au-dessus de la tête (décoratifs) : suivent le corps avec un temps de retard. */}
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, signs]}>
        <Animated.View style={[styles.abs, { left: headX + size * 0.12, top: headY - size * 0.1 }, bangStyle]}>
          <Bang size={Math.round(size * 0.13)} />
        </Animated.View>
        <Animated.View style={[styles.abs, { left: headX + size * 0.2, top: headY + size * 0.02 }, sweatStyle]}>
          <SweatDrop size={Math.round(size * 0.11)} />
        </Animated.View>
        <Burst
          kind="hearts"
          trigger={hearts}
          seed={`${seedId ?? species}:h${hearts % 3}`}
          count={hearts % 2 ? 3 : 4}
          spread={size * 0.42}
          size={size * 0.1}
          style={[styles.abs, { left: headX, top: headY + size * 0.05 }]}
        />
        <Burst
          kind="hearts"
          trigger={love}
          seed={`${seedId ?? species}:love`}
          count={7}
          spread={size * 0.6}
          size={size * 0.12}
          style={[styles.abs, { left: headX, top: headY + size * 0.12 }]}
        />
        <Burst
          kind="stars"
          trigger={stars}
          seed={`${seedId ?? species}:s`}
          spread={size * 0.36}
          size={size * 0.075}
          style={[styles.abs, { left: headX, top: headY + size * 0.2 }]}
        />
        <Burst
          kind="sparkles"
          trigger={sparkles}
          seed={`${seedId ?? species}:k${sparkles % 4}`}
          spread={size * 0.3}
          size={size * 0.07}
          style={[styles.abs, { left: headX + size * 0.18, top: headY }]}
        />
        {asleep || napping ? (
          reduced ? (
            <View style={[styles.abs, { left: headX + size * 0.16, top: headY - size * 0.06 }]}>
              <Bang size={Math.round(size * 0.12)} mark="z" />
            </View>
          ) : (
            <Burst
              kind="zzz"
              loop
              size={size * 0.1}
              spread={size * 0.42}
              style={[styles.abs, { left: headX + size * 0.14, top: headY + (restIsBody && !dressed ? drop * 0.9 : 0) }]}
            />
          )
        ) : null}
      </Animated.View>
      {prop === 'food' ? (
        <Animated.View pointerEvents="none" style={[styles.abs, { left: mouth.x * size - foodSize / 2, top: 0 }, foodStyle]}>
          <Strawberry size={foodSize} />
        </Animated.View>
      ) : null}
      {prop === 'ball' ? (
        <Animated.View pointerEvents="none" style={[styles.abs, { left: size / 2 - ballSize / 2, top: ground.y * h - ballSize }, ballStyle]}>
          <Icon name="balle" size={ballSize} />
        </Animated.View>
      ) : null}
      {busts.length ? (
        <View pointerEvents="none" style={styles.preload} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {busts.map((b) => (
            <Image key={b} source={petImage(species, b)} style={styles.preloadImg} />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  origin: { transformOrigin: '50% 95%' },
  abs: { position: 'absolute' },
  inert: { pointerEvents: 'none' },
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  preloadImg: { width: 1, height: 1 },
});
