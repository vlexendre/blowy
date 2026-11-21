import type { Mood, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { type ReactElement, type ReactNode, useEffect } from 'react';
import { Platform, RefreshControl, type RefreshControlProps, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  cancelAnimation,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type PetPose, petImage, RENDER_RATIO } from '../../assets/pets';
import { ease, useMotionActive, useReducedMotion } from '../../lib/motion';
import { color } from '../../theme';

/** Ce que `PetRefresh` donne à la liste qu'il entoure. */
export interface PetRefreshScroll {
  /** À passer tel quel (`refreshControl` d'un `ScrollView`, d'une `FlatList` ou d'un gabarit). */
  refreshControl: ReactElement<RefreshControlProps>;
  /** Gestionnaire de défilement Reanimated : à passer à un `Animated.ScrollView` / `Animated.FlatList` (ou `onScroll` d'un gabarit). */
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  scrollEventThrottle: number;
}

export interface PetRefreshProps {
  species: Species;
  /** Humeur pendant qu'il tire (défaut `surpris`) ; il passe à `joie` pendant le rafraîchissement. */
  mood?: Mood | PetPose;
  refreshing: boolean;
  onRefresh: () => void;
  /** Rend la liste avec les props fournies. */
  children: (scroll: PetRefreshScroll) => ReactNode;
  /** Distance entre le haut de ce conteneur et le haut de la liste (en-tête fixe au-dessus). Défaut : la zone sûre du haut. */
  top?: number;
  /** En tirant trop loin en bas de la liste, un pet passe aussi la tête par le bas. Défaut vrai. */
  bottomPeek?: boolean;
  /** Espace laissé en bas (barre d'onglets) pour le pet du bas. Défaut 0. */
  bottomInset?: number;
  /** Taille du buste. Défaut 64. */
  size?: number;
  /**
   * Sens du geste : rapetisser ce qui est en haut en descendant (`true`), le regrandir en remontant ou tout en haut
   * (`false`). Seuls les gestes de la personne comptent (pas un défilement fait par l'app).
   */
  onCollapse?: (collapsed: boolean) => void;
  /** Près du haut ou du bas du contenu (une fois par taille de contenu) : pour en charger plus. `y` : défilement. */
  onEdge?: (edge: 'top' | 'bottom', y: number) => void;
}

/** Distance de tirage à laquelle iOS déclenche le rafraîchissement (≈ la hauteur du pet qui grimpe). */
const PULL = 72;

/**
 * Tirer pour rafraîchir avec un pet : à mesure qu'on tire, il grimpe dans l'espace qui s'ouvre au-dessus de la
 * liste, se balance pendant le chargement, puis retombe quand la liste remonte. En bas de liste, tirer trop loin
 * fait passer la tête d'un autre pet. Le pet remplace l'indicateur natif (rendu transparent).
 * Web : pas de tirage élastique, donc ni pet ni rafraîchissement par le geste (la liste fonctionne normalement).
 * « Réduire les animations » : indicateur natif normal, sans pet.
 */
export function PetRefresh({
  species,
  mood = 'surpris',
  refreshing,
  onRefresh,
  children,
  top,
  bottomPeek = true,
  bottomInset = 0,
  size = 64,
  onCollapse,
  onEdge,
}: PetRefreshProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const pull = useSharedValue(0);
  const over = useSharedValue(0);
  const bob = useSharedValue(0);
  const h = size / RENDER_RATIO;
  const last = useSharedValue(0);
  const acc = useSharedValue(0);
  const dragging = useSharedValue(false);
  const collapsed = useSharedValue(false);
  const tell = (c: boolean) => onCollapse?.(c);
  const watch = !!onCollapse;
  const edgeAt = useSharedValue({ top: -1, bottom: -1 });
  const edge = (e: 'top' | 'bottom', y: number) => onEdge?.(e, y);
  const watchEdge = !!onEdge;
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      dragging.value = true;
      acc.value = 0;
    },
    onMomentumEnd: () => {
      dragging.value = false;
    },
    onScroll: (e) => {
      if (watchEdge && e.contentSize.height > 0) {
        const y = e.contentOffset.y;
        const h = e.contentSize.height;
        if (y < 500 && y > 0 && edgeAt.value.top !== h) {
          edgeAt.value = { ...edgeAt.value, top: h };
          runOnJS(edge)('top', y);
        }
        if (y + e.layoutMeasurement.height > h - 500 && edgeAt.value.bottom !== h) {
          edgeAt.value = { ...edgeAt.value, bottom: h };
          runOnJS(edge)('bottom', y);
        }
      }
      if (watch) {
        const y = e.contentOffset.y;
        const d = y - last.value;
        last.value = y;
        if (y <= 8) {
          if (collapsed.value) {
            collapsed.value = false;
            runOnJS(tell)(false);
          }
        } else if (dragging.value) {
          acc.value = (d > 0) === (acc.value > 0) ? acc.value + d : d;
          if (acc.value > 28 && !collapsed.value) {
            collapsed.value = true;
            runOnJS(tell)(true);
          } else if (acc.value < -28 && collapsed.value) {
            collapsed.value = false;
            runOnJS(tell)(false);
          }
        }
      }
      pull.value = Math.max(0, -e.contentOffset.y);
      over.value = Math.max(0, e.contentOffset.y + e.layoutMeasurement.height - e.contentSize.height);
    },
  });
  useEffect(() => {
    if (!refreshing || reduced || !active) {
      cancelAnimation(bob);
      bob.value = withTiming(0, { duration: 160 });
      return;
    }
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 380, easing: ease.inOut }), withTiming(-1, { duration: 380, easing: ease.inOut })), -1, true);
    return () => cancelAnimation(bob);
  }, [refreshing, reduced, active, bob]);

  // Cadre de hauteur fixe dont le bas suit le bord de la liste (transformations seulement) : il rogne le pet.
  const clip = useAnimatedStyle(() => ({ opacity: pull.value > 2 ? 1 : 0, transform: [{ translateY: pull.value - h }] }));
  const climber = useAnimatedStyle(() => {
    const k = Math.min(1, pull.value / PULL);
    // Il grimpe : sa tête monte du bord de la liste jusqu'à être à moitié sortie, en se balançant.
    const visible = Math.min(pull.value, h * 0.55);
    return {
      transform: [
        { translateY: h - visible - h * 0.17 },
        { rotate: `${(1 - k) * 14 * Math.sin(pull.value / 9) + bob.value * 6}deg` },
        { scale: 0.85 + 0.15 * k },
      ],
    };
  });
  const bottom = useAnimatedStyle(() => {
    const visible = Math.min(over.value, h * 0.5);
    return { opacity: over.value > 4 ? 1 : 0, transform: [{ translateY: h * 0.83 - visible }, { rotate: `${Math.sin(over.value / 12) * 6}deg` }] };
  });

  const enabled = Platform.OS !== 'web' && !reduced;
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enabled ? 'transparent' : color.mute} colors={[color.accent]} />
  );
  return (
    <View style={styles.fill}>
      {children({ refreshControl, onScroll, scrollEventThrottle: 16 })}
      {enabled ? (
        <>
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.clip, { top: top ?? insets.top, height: h }, clip]}
          >
            <Animated.View style={[styles.pet, { width: size, height: h, marginLeft: -size / 2 }, climber]}>
              <Image source={petImage(species, refreshing ? 'joie' : mood)} contentFit="contain" style={StyleSheet.absoluteFill} />
            </Animated.View>
          </Animated.View>
          {bottomPeek ? (
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.bottomClip, { bottom: bottomInset, height: h * 0.55 }]}
            >
              <Animated.View style={[styles.pet, { width: size, height: h, marginLeft: -size / 2, top: 0 }, bottom]}>
                <Image source={petImage(species, 'smug')} contentFit="contain" style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  clip: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  bottomClip: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  pet: { position: 'absolute', left: '50%', top: 0 },
});
