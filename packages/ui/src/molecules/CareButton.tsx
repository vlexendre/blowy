import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { GestureDetector, type PanGestureConfig, usePanGesture } from 'react-native-gesture-handler';
import Animated, { measure, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Loader } from '../atoms/Loader';
import { Pressable } from '../atoms/Pressable';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { haptic, hapticFor } from '../lib/haptics';
import { InkProvider } from '../lib/ink';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { useScrollLock } from '../lib/scroll-lock';
import { lureHits, type PetLure } from '../motion/pets/lure';
import { Pulse } from '../motion/PopIn';
import { color, motion, opacity, size as sizes, veil } from '../theme';

export interface CareButtonProps {
  /** Le geste (« nourrir »). */
  label: string;
  /** Picto (`CareIcon`) ou élément libre ; il prend l'encre du disque (sombre sur jaune, blanc sinon). */
  icon: ReactNode;
  /** Ce qui voyage dans le jeton quand on glisse le soin jusqu'au pet (la nourriture, le jouet) ; défaut le picto. */
  carry?: ReactNode;
  onPress?: () => void;
  /** Geste conseillé maintenant (`.care.hot` : disque jaune qui brille). */
  hot?: boolean;
  /** Le pet n'en veut pas (`canCare` faux) : estompé (`.care.off`) ; un appui le fait « non de la tête ». */
  refused?: boolean;
  /** Pourquoi il refuse (« il n'a plus faim. ») : lu par le lecteur d'écran. */
  refusedLabel?: string;
  /** Appui sur un geste refusé (pour afficher la raison ailleurs). */
  onRefusedPress?: () => void;
  /** Requête en cours : trois boules rebondissent dans le disque (`Loader`). */
  loading?: boolean;
  /** Bouton inactif (ex. pendant un autre soin). */
  disabled?: boolean;
  /**
   * Glisser jusqu'au pet : appuyer puis glisser soulève le picto ; lâché sur le pet (`lure.target`), il y entre et
   * le soin part (même effet qu'un tap) ; lâché ailleurs, il revient en ressort. Sans `lure`, tap seul.
   */
  lure?: PetLure;
  /** Diamètre du disque. Défaut 64. */
  size?: number;
  /**
   * Niveau du besoin que ce geste comble, en petite barre sous le libellé (faim sous « Nourrir ») : les besoins et
   * les gestes se lisent d'un seul bloc. `accessibilityLabel` : « faim, 35 sur 100 », ajouté au libellé lu.
   */
  level?: CareLevel;
  /** Disque seul, sans libellé visible (la pastille des soins dans la carte du minimoa) ; le libellé reste lu. */
  hideLabel?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Niveau d'un besoin porté par un bouton de soin. */
export interface CareLevel {
  /** De 0 (à plat) à 100 (comblé). */
  value: number;
  /** Sous ce seuil, la barre passe au rouge. Défaut 40. */
  lowAt?: number;
  accessibilityLabel: string;
}

/** Tenir ce temps avant de pouvoir glisser (un glissé immédiat fait défiler l'écran). */
const HOLD_MS = 140;
/** Le picto porté passe au-dessus du doigt (sinon le doigt le cache). */
const LIFT = 34;

/** Bouton rond d'un soin (`.care` de V6-Accueil) : disque, libellé ; rebond et vibration à l'appui ; glissable jusqu'au pet. */
export function CareButton({
  label,
  icon,
  carry,
  hideLabel = false,
  onPress,
  hot,
  refused,
  refusedLabel,
  onRefusedPress,
  loading,
  disabled,
  lure,
  size = 64,
  level,
  accessibilityHint,
  style,
}: CareButtonProps) {
  const reduced = useReducedMotion();
  const scrollLock = useScrollLock();
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { translateX: shake.value }] }));
  const inactive = disabled || loading;
  const lit = hot && !refused;
  /** Un glissé vient de finir : le relâchement ne compte pas comme un tap. */
  const dragged = useRef(0);
  const [lifted, setLifted] = useState(false);

  const press = () => {
    if (Date.now() - dragged.current < 450) return;
    if (refused) {
      haptic('warning');
      if (!reduced)
        shake.value = withSequence(
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 70 }),
          withTiming(-4, { duration: 60 }),
          withTiming(0, { duration: 50 }),
        );
      onRefusedPress?.();
      return;
    }
    haptic('medium');
    if (!reduced) pop.value = withSequence(withSpring(1.14, motion.press), withSpring(1, motion.pop));
    onPress?.();
  };

  // — Glisser jusqu'au pet. Le picto porté : décalage (fil natif), échelle, inclinaison selon la vitesse.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const fade = useSharedValue(1);

  const startJS = useCallback(() => {
    dragged.current = Date.now();
    setLifted(true);
    scrollLock.setLocked(true);
    hapticFor('press');
  }, [scrollLock]);
  const endJS = useCallback(
    (hit: boolean) => {
      dragged.current = Date.now();
      scrollLock.setLocked(false);
      if (hit) {
        haptic('medium');
        onPress?.();
        // Une fois entré dans le pet, le picto repousse dans son disque (le disque montre d'abord le chargement).
        setTimeout(() => {
          tx.value = 0;
          ty.value = 0;
          fade.value = 1;
          scale.value = 0.4;
          scale.value = withSpring(1, springs.pop);
        }, 240);
      }
      setTimeout(() => setLifted(false), hit ? 260 : 420);
    },
    [scrollLock, onPress, tx, ty, fade, scale],
  );
  // Trampolines stables : le geste n'est recréé que si `canDrag` change (jamais pendant qu'on porte le picto).
  const startRef = useRef(startJS);
  startRef.current = startJS;
  const endRef = useRef(endJS);
  endRef.current = endJS;
  const startStable = useCallback(() => startRef.current(), []);
  const endStable = useCallback((hit: boolean) => endRef.current(hit), []);

  const canDrag = !!lure && !refused && !inactive;
  const cfg = useMemo<PanGestureConfig>(() => {
    const l = lure;
    return {
      enabled: canDrag,
      activateAfterLongPress: HOLD_MS,
      onActivate: (e) => {
        'worklet';
        if (!l) return;
        tx.value = withSpring(e.translationX, springs.press);
        ty.value = withSpring(e.translationY - LIFT, springs.press);
        scale.value = withSpring(1.32, springs.pop);
        fade.value = 1;
        l.x.value = e.absoluteX;
        l.y.value = e.absoluteY - LIFT;
        l.on.value = 1;
        scheduleOnRN(startStable);
      },
      onUpdate: (e) => {
        'worklet';
        if (!l) return;
        tx.value = e.translationX;
        ty.value = e.translationY - LIFT;
        tilt.value = withSpring(Math.max(-16, Math.min(16, e.velocityX * 0.01)), { damping: 18, stiffness: 260 });
        l.x.value = e.absoluteX;
        l.y.value = e.absoluteY - LIFT;
      },
      onDeactivate: (e) => {
        'worklet';
        if (!l) return;
        const px = e.absoluteX;
        const py = e.absoluteY - LIFT;
        const rect = measure(l.target);
        const hit = lureHits(px, py, rect);
        l.on.value = 0;
        tilt.value = withSpring(0, springs.pop);
        if (hit && rect) {
          // Il entre dans le pet (vers la bouche, au tiers haut), rapetisse et s'efface, puis repousse dans son disque.
          const dx = rect.pageX + rect.width * 0.5 - px;
          const dy = rect.pageY + rect.height * 0.42 - py;
          tx.value = withTiming(tx.value + dx, { duration: 180, easing: ease.in });
          ty.value = withTiming(ty.value + dy, { duration: 180, easing: ease.in });
          scale.value = withTiming(0.2, { duration: 180, easing: ease.in });
          fade.value = withTiming(0, { duration: 180 });
        } else {
          // Lâché ailleurs : il revient à sa place en ressort.
          tx.value = withSpring(0, springs.plush);
          ty.value = withSpring(0, springs.plush);
          scale.value = withSpring(1, springs.plush);
        }
        scheduleOnRN(endStable, hit);
      },
    };
    // Valeurs animées et trampolines stables : seul `canDrag` (et le lien au pet) recrée le geste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDrag, lure]);
  const pan = usePanGesture(cfg);
  const carried = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${tilt.value}deg` }, { scale: scale.value }],
  }));

  const ink = lit ? color.dark : color.white;
  const button = (
    <Pressable
      onPress={press}
      disabled={inactive}
      haptic={false}
      scaleTo={0.92}
      accessibilityLabel={[label, level?.accessibilityLabel, refused ? refusedLabel : null].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive || !!refused, busy: !!loading }}
      style={[styles.root, refused && styles.off, disabled && !loading && styles.inactive, lifted && styles.lifted, style]}
    >
      {/* Conseillé : deux battements pour attirer l'œil, puis repos. */}
      <Pulse active={!!lit && !lifted} beats={2} delay={700}>
        <Animated.View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }, lit ? styles.hot : null, anim]}>
          <InkProvider value={ink}>
            {loading ? (
              <Loader color={ink} size={7} />
            ) : (
              <Animated.View
                pointerEvents="none"
                style={[styles.token, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }, lifted && (lit ? styles.tokenHot : styles.tokenOn), carried]}
              >
                {/* Porté, le picto voyage dans un jeton rond (lisible sur le panneau coloré du pet). */}
                {lifted && carry ? carry : icon}
              </Animated.View>
            )}
          </InkProvider>
        </Animated.View>
      </Pulse>
      {hideLabel ? null : (
        <Text variant="bodyHeavy" size={13} center numberOfLines={1} color={color.white}>
          {label}
        </Text>
      )}
      {level ? (
        <View style={styles.level} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ProgressBar value={level.value / 100} height={5} color={level.value < (level.lowAt ?? 40) ? color.danger : color.accent} />
        </View>
      ) : null}
    </Pressable>
  );
  if (!lure) return button;
  return (
    <GestureDetector gesture={pan} touchAction="pan-y">
      {button}
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // `.care` : colonne, écart 6, libellé 12/800.
  root: { flex: 1, minWidth: sizes.touch, alignItems: 'center', gap: 5 },
  // Barre du besoin sous le libellé : courte, centrée (le disque reste la cible).
  level: { width: '62%', maxWidth: 52, marginTop: 1 },
  // Le picto porté passe devant les autres soins.
  lifted: { zIndex: 20, elevation: 20 },
  // `.care u` : disque 64 #221E3C, filet blanc 12 %.
  disc: { alignItems: 'center', justifyContent: 'center', backgroundColor: color.card, borderWidth: sizes.border, borderColor: veil.track },
  // `.care.hot u` : jaune, ombre 0 8 18 jaune 35 %.
  hot: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    shadowColor: color.accent,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  token: { alignItems: 'center', justifyContent: 'center' },
  tokenOn: { backgroundColor: color.card, borderWidth: sizes.border, borderColor: veil.glassStrong },
  tokenHot: { backgroundColor: color.accent },
  // `.care.off` : opacité .38.
  off: { opacity: opacity.dim },
  inactive: { opacity: opacity.disabled },
});
