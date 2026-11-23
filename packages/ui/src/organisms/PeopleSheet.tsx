import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, type PanGestureConfig, useNativeGesture, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { haptic } from '../lib/haptics';
import { useReducedMotion } from '../lib/motion';
import { color, motion, radius, space, veil } from '../theme';

/** Les trois crans : replié (le titre seul), à mi-hauteur, ouvert. */
export type SheetDetent = 'peek' | 'half' | 'full';
const ORDER: readonly SheetDetent[] = ['peek', 'half', 'full'];

/**
 * Hauteur cachée sous la barre d'onglets flottante, en bas de la feuille (fournie par `MapTemplate`) : la feuille
 * descend jusqu'au bas de l'écran, et ses crans comptent cette hauteur en plus de ce qu'ils montrent.
 */
export const SheetBottomInset = createContext(0);

export interface PeopleSheetProps {
  /** « Aujourd'hui · 3 personnes » : toujours visible, même replié. */
  title: string;
  /** Une ligne sous le titre (« Personne ne voit où tu es exactement »). */
  subtitle?: string;
  /** La liste (personnes du jour, bonjours reçus…). */
  children: ReactNode;
  /** Cran au premier affichage. Défaut : à mi-hauteur, replié sur un petit écran (moins de 700 pt de haut). */
  initial?: SheetDetent;
  /** Cachée (une fiche est ouverte par-dessus la carte) : la feuille descend hors de l'écran. */
  hidden?: boolean;
  /** Libellés des actions VoiceOver (« Ouvrir la liste », « Replier la liste ») : fournis par l'écran. */
  expandA11y: string;
  collapseA11y: string;
  /** Hauteur visible une fois posée, depuis le bas de la feuille (0 si cachée) : la carte y cale sa marge et la mention légale. */
  onVisibleChange?: (height: number) => void;
}

/** Hauteur du haut de la feuille repliée (poignée + titre), avant la mesure. */
const PEEK_GUESS = 76;
/** Sous cette hauteur d'écran (iPhone SE, mini en paysage…), la feuille commence repliée : la carte d'abord. */
const SMALL_SCREEN = 700;
/** Ressort des crans : presque critique (comme une feuille iOS), il part à la vitesse du doigt. */
const SNAP = { damping: 34, stiffness: 300, mass: 1 } as const;
/** Projection du lâcher (s) : un geste vif emmène la feuille au cran suivant, comme sur iOS. */
const PROJECT = 0.18;

/**
 * Feuille à crans posée sur une carte (onglet Quartier), au comportement d'une feuille iOS : repliée, on ne voit que
 * son titre ; à mi-hauteur, les premières lignes ; ouverte, toute la liste. On la tire n'importe où : tant que la liste
 * est en haut, tirer la liste fait monter ou descendre la feuille ; ouverte en entier, la liste défile. Le geste et le
 * ressort tournent sur le fil d'interface ; le ressort reprend la vitesse du doigt pour choisir le cran.
 * Toucher le titre : replié ↔ mi-hauteur. VoiceOver : le titre est un bouton « développé / réduit », avec deux
 * actions (ouvrir, replier) ; repliée, la liste est masquée à VoiceOver. Animations réduites : hors geste, la feuille
 * se pose sans glisser. Remplit son conteneur jusqu'au bas de l'écran (sous la barre d'onglets) ; la place en bas de la
 * liste suit le cran, pour qu'on atteigne toujours la dernière ligne.
 */
export function PeopleSheet({ title, subtitle, children, initial, hidden = false, expandA11y, collapseA11y, onVisibleChange }: PeopleSheetProps) {
  const win = useWindowDimensions();
  const inset = useContext(SheetBottomInset);
  const reduced = useReducedMotion();
  const [height, setHeight] = useState(0);
  const [head, setHead] = useState(PEEK_GUESS);
  const [detent, setDetent] = useState<SheetDetent>(() => initial ?? (win.height < SMALL_SCREEN ? 'peek' : 'half'));
  const detentRef = useRef(detent);
  detentRef.current = detent;

  // Décalage vers le bas de la feuille (0 : ouverte en entier), et les décalages des trois crans (replié, mi, ouvert).
  const y = useSharedValue(10_000);
  const stops = useSharedValue<number[]>([0, 0, 0]);
  const headH = useSharedValue(PEEK_GUESS);
  // Le geste en cours : départ dans l'en-tête, feuille déplacée, dernière translation lue.
  const fromHead = useSharedValue(false);
  const moved = useSharedValue(false);
  const last = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const visibleOf = useCallback(
    (d: SheetDetent): number => {
      if (height <= 0) return 0;
      if (d === 'full') return height;
      if (d === 'half') return Math.min(height, Math.max(head + inset + 120, Math.round(height * 0.5)));
      return Math.min(height, head + inset);
    },
    [height, head, inset],
  );
  const offsetOf = (d: SheetDetent): number => height - visibleOf(d);

  const report = useRef(onVisibleChange);
  report.current = onVisibleChange;
  /** Pose la feuille sur un cran (ou hors de l'écran si cachée) ; sans glissement avec « réduire les animations ». */
  const settle = (d: SheetDetent, animate: boolean) => {
    const to = hidden ? height + space.xl : offsetOf(d);
    cancelAnimation(y);
    y.value = animate && !reduced ? withTiming(to, { duration: motion.base, easing: Easing.out(Easing.cubic) }) : to;
    report.current?.(hidden ? 0 : visibleOf(d));
  };

  // Mesures, ouverture d'une fiche : la feuille se pose au bon endroit (le cran, lui, change par `go` ou le geste).
  const measured = useRef(false);
  useEffect(() => {
    if (height <= 0) return;
    stops.value = ORDER.map((d) => height - visibleOf(d));
    headH.value = head;
    settle(detentRef.current, measured.current);
    measured.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, head, inset, hidden]);

  /** Tap, action VoiceOver : un cran choisi sans le doigt. */
  const go = (d: SheetDetent) => {
    if (d !== detent) haptic('selection');
    setDetent(d);
    settle(d, true);
  };

  /** Fin d'un geste (le ressort tourne déjà sur le fil d'interface) : le cran devient l'état de l'écran. */
  const commit = useCallback(
    (i: number) => {
      const d = ORDER[i] ?? 'half';
      if (d !== detentRef.current) haptic('selection');
      detentRef.current = d;
      setDetent(d);
      report.current?.(visibleOf(d));
    },
    [visibleOf],
  );

  // Le défilement de la liste, reconnu en même temps que le geste de la feuille.
  const native = useNativeGesture({});
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const panCfg = useMemo<PanGestureConfig>(
    () => ({
      enabled: !hidden,
      activeOffsetY: [-8, 8],
      failOffsetX: [-20, 20],
      simultaneousWith: native,
      onBegin: (e) => {
        'worklet';
        fromHead.value = e.y <= headH.value;
      },
      onActivate: () => {
        'worklet';
        last.value = 0;
        moved.value = false;
      },
      onUpdate: (e) => {
        'worklet';
        const dy = e.translationY - last.value;
        last.value = e.translationY;
        const s = stops.value;
        const low = s[0] ?? 0;
        const cur = y.value;
        // Vers le haut : la feuille monte tant qu'elle n'est pas ouverte en entier ; ensuite, la liste défile.
        // Vers le bas : la feuille descend si on la tient par l'en-tête, ou si la liste est déjà en haut.
        let next = cur;
        if (dy < 0 && cur > 0) next = Math.max(0, cur + dy);
        else if (dy > 0 && (fromHead.value || scrollY.value <= 0)) next = Math.min(low, cur + dy);
        if (next !== cur) {
          if (!moved.value) cancelAnimation(y);
          moved.value = true;
          y.value = next;
        }
        // La feuille bouge : la liste reste en haut (pas de double mouvement).
        if (moved.value && y.value > 0 && scrollY.value !== 0) scrollTo(scrollRef, 0, 0, false);
      },
      onDeactivate: (e) => {
        'worklet';
        if (!moved.value) return;
        moved.value = false;
        const s = stops.value;
        const target = y.value + e.velocityY * PROJECT;
        let best = 0;
        for (let i = 1; i < s.length; i++) if (Math.abs((s[i] ?? 0) - target) < Math.abs((s[best] ?? 0) - target)) best = i;
        const to = s[best] ?? 0;
        // Le doigt lâche : le ressort reprend sa vitesse ; animations réduites, une pose courte, sans rebond.
        y.value = reduced
          ? withTiming(to, { duration: motion.fast, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.Never })
          : withSpring(to, { ...SNAP, velocity: e.velocityY, overshootClamping: to <= 0 });
        scheduleOnRN(commit, best);
      },
    }),
    [hidden, native, reduced, commit, y, stops, headH, fromHead, moved, last, scrollY, scrollRef],
  );
  const pan = usePanGesture(panCfg);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: Math.max(0, y.value) }] }));
  const onLayout = (e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height));
  const onHead = (e: LayoutChangeEvent) => setHead(Math.round(e.nativeEvent.layout.height));
  const open = detent !== 'peek';
  const index = ORDER.indexOf(detent);
  // Repliée (ou cachée) : la liste est sous la carte, hors de portée ; VoiceOver ne la lit pas.
  const listHidden = hidden || !open;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      {height > 0 ? (
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.sheet, { height }, style]}
            accessibilityElementsHidden={hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
            pointerEvents={hidden ? 'none' : 'auto'}
          >
            <View onLayout={onHead}>
              <Pressable
                onPress={() => go(open ? 'peek' : 'half')}
                haptic={false}
                scaleTo={1}
                accessibilityRole="button"
                accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
                accessibilityState={{ expanded: open }}
                accessibilityActions={[
                  { name: 'increment', label: expandA11y },
                  { name: 'decrement', label: collapseA11y },
                  { name: 'activate' },
                ]}
                onAccessibilityAction={(e) => {
                  if (e.nativeEvent.actionName === 'increment') go(ORDER[Math.min(2, index + 1)] ?? 'full');
                  else if (e.nativeEvent.actionName === 'decrement') go(ORDER[Math.max(0, index - 1)] ?? 'peek');
                  else go(open ? 'peek' : 'half');
                }}
                style={styles.head}
              >
                <View style={styles.grip} />
                <Text variant="bodyHeavy" size={17} numberOfLines={2}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text size={13} muted numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </Pressable>
            </View>
            <View style={styles.scroll} accessibilityElementsHidden={listHidden} importantForAccessibility={listHidden ? 'no-hide-descendants' : 'auto'}>
              <GestureDetector gesture={native}>
                <Animated.ScrollView
                  ref={scrollRef}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  style={styles.scroll}
                  contentContainerStyle={[styles.content, { paddingBottom: offsetOf(detent) + inset + space.lg }]}
                  showsVerticalScrollIndicator={false}
                  // Pas de rebond en haut : c'est la feuille qui descend quand on tire la liste vers le bas.
                  bounces={false}
                  overScrollMode="never"
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </Animated.ScrollView>
              </GestureDetector>
            </View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.panel,
    // Coins hauts seulement : le bas de la feuille passe sous la barre d'onglets, jusqu'au bord de l'écran.
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: veil.line,
    overflow: 'hidden',
    shadowColor: color.night,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  head: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, gap: 2, minHeight: 44 },
  grip: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: veil.off, marginBottom: space.sm },
  scroll: { flex: 1 },
  content: { paddingHorizontal: space.md, gap: space.sm + 2 },
});
