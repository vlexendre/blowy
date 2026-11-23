import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { haptic } from '../lib/haptics';
import { color, radius, space, veil } from '../theme';

/** Les trois crans : replié (le titre seul), à mi-hauteur, ouvert. */
export type SheetDetent = 'peek' | 'half' | 'full';
const ORDER: readonly SheetDetent[] = ['peek', 'half', 'full'];

export interface PeopleSheetProps {
  /** « Aujourd'hui · 3 personnes » : toujours visible, même replié. */
  title: string;
  /** Une ligne sous le titre (« Personne ne voit où tu es exactement »). */
  subtitle?: string;
  /** La liste (personnes du jour, bonjours reçus…). */
  children: ReactNode;
  /** Cran au premier affichage. Défaut : à mi-hauteur. */
  initial?: SheetDetent;
  /** Cachée (une fiche est ouverte par-dessus la carte) : la feuille descend hors de l'écran. */
  hidden?: boolean;
  /** Libellés des actions VoiceOver (« Ouvrir la liste », « Replier la liste ») : fournis par l'écran. */
  expandA11y: string;
  collapseA11y: string;
  /** Hauteur visible une fois posée (0 si cachée) : la carte y cale sa marge et la mention légale. */
  onVisibleChange?: (height: number) => void;
}

/** Durée d'un cran (sous 400 ms ; sans rebond, même en mouvement réduit). */
const DURATION = 240;
/** Hauteur du haut de la feuille repliée (poignée + titre), avant la mesure. */
const PEEK_GUESS = 76;

/**
 * Feuille à crans posée sur une carte (onglet Quartier) : repliée, on ne voit que son titre ; à mi-hauteur, les
 * premières lignes ; ouverte, toute la liste. On la tire par sa poignée, ou on touche le titre (replié ↔ mi-hauteur).
 * VoiceOver : le titre est un bouton « développé / réduit », avec deux actions (ouvrir, replier).
 * Remplit son conteneur (la feuille ouverte en prend toute la hauteur) ; la place en bas de la liste suit le cran,
 * pour qu'on atteigne toujours la dernière ligne.
 */
export function PeopleSheet({ title, subtitle, children, initial = 'half', hidden = false, expandA11y, collapseA11y, onVisibleChange }: PeopleSheetProps) {
  const [height, setHeight] = useState(0);
  const [head, setHead] = useState(PEEK_GUESS);
  const [detent, setDetent] = useState<SheetDetent>(initial);
  // Décalage vers le bas de la feuille (0 : ouverte en entier).
  const y = useSharedValue(10_000);
  const start = useRef(0);

  const visibleOf = (d: SheetDetent): number => {
    if (height <= 0) return 0;
    if (d === 'full') return height;
    if (d === 'half') return Math.min(height, Math.max(head + 120, Math.round(height * 0.46)));
    return Math.min(height, head);
  };
  const offsetOf = (d: SheetDetent): number => height - visibleOf(d);

  const report = useRef(onVisibleChange);
  report.current = onVisibleChange;
  const settle = (d: SheetDetent, animate = true) => {
    const to = hidden ? height + space.xl : offsetOf(d);
    y.value = animate ? withTiming(to, { duration: DURATION, easing: Easing.out(Easing.cubic) }) : to;
    report.current?.(hidden ? 0 : visibleOf(d));
  };

  // Mesures, cran, ouverture d'une fiche : la feuille se pose au bon endroit.
  const measured = useRef(false);
  useEffect(() => {
    if (height <= 0) return;
    settle(detent, measured.current);
    measured.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, head, detent, hidden]);

  const go = (d: SheetDetent) => {
    if (d !== detent) haptic('selection');
    setDetent(d);
    settle(d);
  };

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderGrant: () => {
      start.current = y.value;
    },
    onPanResponderMove: (_e, g) => {
      y.value = Math.max(0, Math.min(offsetOf('peek'), start.current + g.dy));
    },
    onPanResponderRelease: (_e, g) => {
      // Le cran le plus proche de là où le doigt projette la feuille (un geste vif saute au cran suivant).
      const target = y.value + g.vy * 120;
      const best = ORDER.reduce((a, b) => (Math.abs(offsetOf(b) - target) < Math.abs(offsetOf(a) - target) ? b : a));
      go(best);
    },
    onPanResponderTerminate: () => settle(detent),
  });

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const onLayout = (e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height));
  const onHead = (e: LayoutChangeEvent) => setHead(Math.round(e.nativeEvent.layout.height));
  const open = detent !== 'peek';
  const index = ORDER.indexOf(detent);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      {height > 0 ? (
        <Animated.View
          style={[styles.sheet, { height }, style]}
          accessibilityElementsHidden={hidden}
          importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
          pointerEvents={hidden ? 'none' : 'auto'}
        >
          <View onLayout={onHead} {...pan.panHandlers}>
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
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: offsetOf(detent) + space.lg }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={open}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
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
