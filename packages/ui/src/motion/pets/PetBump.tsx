import type { Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { petImage, RENDER_RATIO } from '../../assets/pets';
import { hapticFor } from '../../lib/haptics';
import { ease, springs, useReducedMotion } from '../../lib/motion';
import { Burst } from '../Burst';
import { type Rect, useMotionHost } from '../MotionHost';

export interface PetBumpOptions {
  /** Ton pet (arrive de la gauche). */
  left: Species;
  /** Son pet (arrive de la droite). */
  right: Species;
  /** Départ de chaque pet (ex. sa place sur la scène, mesurée) ; défaut : hors de l'écran, sur le côté. */
  from?: { left?: Rect | null; right?: Rect | null };
  /** Hauteur (fenêtre) de la ligne où ils se rencontrent. Défaut : 42 % de la fenêtre. */
  y?: number;
  /** Taille des pets. Défaut 132. */
  size?: number;
}

/** Course (ms), rebond après le choc, et durée totale avant de disparaître. */
const RUN = 560;
const HOLD = 520;
const OUT = 260;
/** Attente après le montage de l'écran qui s'ouvre (ses propres entrées démarrent d'abord). */
const SETTLE = 160;
/** Attente maximale des images avant de partir quand même. */
const LOAD_MAX = 700;

/**
 * Les deux pets se courent dessus en sautillant, se cognent (écrasés l'un contre l'autre), rebondissent en
 * arrière, des cœurs et des étoiles jaillissent du point de contact, puis ils s'effacent. Joué au-dessus de tout
 * (calque du `MotionHost`), transparent aux touchers : la navigation qui suit l'acceptation n'attend pas.
 */
function Bump({ left, right, from, y, size, onEnd }: Required<Pick<PetBumpOptions, 'left' | 'right' | 'size'>> & { from?: PetBumpOptions['from']; y?: number; onEnd: () => void }) {
  const win = useWindowDimensions();
  const h = size / RENDER_RATIO;
  const line = y ?? win.height * 0.42;
  const cx = win.width / 2;
  // Au contact, les deux corps se chevauchent un peu (le pelage déborde du cadre).
  const meetL = cx - size * 0.76;
  const meetR = cx - size * 0.24;
  const startL = from?.left ? from.left.x + from.left.width / 2 - size / 2 : -size * 1.1;
  const startR = from?.right ? from.right.x + from.right.width / 2 - size / 2 : win.width + size * 0.1;
  const startLy = from?.left ? from.left.y + from.left.height - h : line - h / 2;
  const startRy = from?.right ? from.right.y + from.right.height - h : line - h / 2;
  const run = useSharedValue(0);
  const squash = useSharedValue(0);
  const recoil = useSharedValue(0);
  const fade = useSharedValue(0);
  const [boom, setBoom] = useState(0);
  // Les deux images doivent être prêtes (sinon la course se joue à vide) ; au pire on part au bout de LOAD_MAX.
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (loaded >= 2) setReady(true);
  }, [loaded]);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), LOAD_MAX);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Départ après deux images et un court répit : l'écran qui s'ouvre en même temps (lien) a fini de se monter,
    // la course se voit en entier au lieu d'être avalée par ce travail.
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = () => {
      run.value = withTiming(1, { duration: RUN, easing: Easing.in(Easing.quad) });
      squash.value = withDelay(RUN, withSequence(withTiming(1, { duration: 70, easing: ease.out }), withSpring(0, springs.plush)));
      recoil.value = withDelay(RUN, withSequence(withTiming(1, { duration: 200, easing: ease.out }), withSpring(0.35, springs.soft)));
      // Apparaît d'un coup (même fil que le départ), puis s'efface après le choc.
      fade.value = withSequence(withTiming(1, { duration: 60 }), withDelay(RUN + HOLD - 60, withTiming(0, { duration: OUT })));
      timers.push(
        setTimeout(() => {
          hapticFor('land');
          setBoom(1);
        }, RUN),
        setTimeout(() => hapticFor('celebrate'), RUN + 180),
        setTimeout(onEnd, RUN + HOLD + OUT + 40),
      );
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => timers.push(setTimeout(start, SETTLE)));
    });
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Les valeurs animées sont lues ici même (le style s'y abonne), puis passées au calcul.
  const geo = { startL, startR, startLy, startRy, meetL, meetR, line, h, size };
  const leftStyle = useAnimatedStyle(() => petStyle(-1, run.value, squash.value, recoil.value, fade.value, geo));
  const rightStyle = useAnimatedStyle(() => petStyle(1, run.value, squash.value, recoil.value, fade.value, geo));
  const spot = { left: cx, top: line - h * 0.12 };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.pet, { width: size, height: h }, leftStyle]}>
        <Image source={petImage(left, 'cote')} contentFit="contain" onLoad={() => setLoaded((n) => n + 1)} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.pet, { width: size, height: h }, rightStyle]}>
        <Image source={petImage(right, 'cote')} contentFit="contain" onLoad={() => setLoaded((n) => n + 1)} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {boom ? (
        <>
          <Burst kind="stars" trigger={boom} count={8} spread={58} style={[styles.spot, spot]} />
          <Burst kind="hearts" trigger={boom} count={6} spread={110} style={[styles.spot, spot]} />
        </>
      ) : null}
    </View>
  );
}

/** Place d'un des deux pets à un instant de la scène (course, choc, recul, effacement). */
function petStyle(
  side: -1 | 1,
  p: number,
  s: number,
  recoil: number,
  fade: number,
  g: { startL: number; startR: number; startLy: number; startRy: number; meetL: number; meetR: number; line: number; h: number; size: number },
) {
  'worklet';
  const x0 = side < 0 ? g.startL : g.startR;
  const x1 = side < 0 ? g.meetL : g.meetR;
  const y0 = side < 0 ? g.startLy : g.startRy;
  const y1 = g.line - g.h / 2;
  // Trois petits sauts pendant la course ; après le choc, un saut de joie.
  const hop = p < 1 ? Math.abs(Math.sin(p * Math.PI * 3)) * g.size * 0.16 : 0;
  const joy = Math.sin(Math.min(1, recoil) * Math.PI) * g.size * 0.12;
  const back = recoil * g.size * 0.16;
  return {
    opacity: fade,
    transform: [
      { translateX: x0 + (x1 - x0) * p + side * back },
      { translateY: y0 + (y1 - y0) * p - hop - joy },
      { rotate: `${side * (recoil * 12 - (p < 1 ? 6 * p : 0))}deg` },
      // Choc : écrasé contre l'autre (plus étroit, plus haut). Le pet de gauche regarde à droite (image retournée).
      { scaleX: (side < 0 ? -1 : 1) * (1 - 0.22 * s) },
      { scaleY: 1 + 0.14 * s },
    ],
  };
}

/**
 * « Accepté » : renvoie une fonction qui joue la rencontre des deux pets au-dessus de l'écran. À appeler après le
 * succès de l'action, en même temps que la navigation (rien n'attend). Animations réduites : vibration seule.
 */
export function usePetBump(): (options: PetBumpOptions) => void {
  const host = useMotionHost();
  const reduced = useReducedMotion();
  const hostRef = useRef(host);
  hostRef.current = host;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  return useMemo(
    () =>
      ({ left, right, from, y, size = 132 }: PetBumpOptions) => {
        const h = hostRef.current;
        if (!h || reducedRef.current) {
          hapticFor('success');
          return;
        }
        let unmount: () => void = () => undefined;
        unmount = h.mount(<Bump left={left} right={right} from={from} y={y} size={size} onEnd={() => unmount()} />);
      },
    [],
  );
}

const styles = StyleSheet.create({
  pet: { position: 'absolute', left: 0, top: 0 },
  spot: { position: 'absolute' },
});
