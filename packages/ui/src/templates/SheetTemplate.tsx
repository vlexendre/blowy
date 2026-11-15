import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable as RNPressable, type StyleProp, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { GestureDetector, GestureHandlerRootView, type PanGestureConfig, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { IconButton } from '../atoms/IconButton';
import { Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { InkProvider } from '../lib/ink';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { useOverlay } from '../lib/overlay';
import { layout } from '../lib/styles';
import { alpha, color, extra, motion, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';
import { useUiStrings } from '../lib/strings';

export interface SheetTemplateProps {
  visible: boolean;
  onClose: () => void;
  title?: TitleContent;
  children?: ReactNode;
  footer?: ReactNode;
  /** Libellé lu du bouton et du fond de fermeture. Défaut « Fermer ». */
  closeLabel?: string;
  /** En-tête libre à la place du titre et du bouton fermer (V6-LienOptions : avatar + nom). */
  header?: ReactNode;
  /** Écran présenté en modale transparente par le routeur : pas de `Modal` natif. */
  asScreen?: boolean;
  /**
   * Feuille haute « nue » (Blowy+) : presque toute la hauteur de l'écran, sans en-tête ni marges ; le contenu fait sa
   * mise en page et défile lui-même. On la tire vers le bas par sa poignée (`SheetHandle`, autour de la barre du
   * haut) ou en tirant le contenu au-delà du haut ; `useSheet().close()` la fait redescendre puis appelle `onClose`.
   */
  bare?: boolean;
}

interface SheetControl {
  /** Redescend en glissant (fondu si animations réduites), puis `onClose`. */
  close: () => void;
  pan: ReturnType<typeof usePanGesture> | null;
}

const SheetContext = createContext<SheetControl | null>(null);

/** La feuille qui contient ce composant (nulle hors d'une feuille). */
export function useSheet(): SheetControl | null {
  return useContext(SheetContext);
}

/** Zone qu'on tire pour descendre une feuille `bare` (barre du haut) ; hors d'une feuille, une simple vue. */
export function SheetHandle({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const sheet = useContext(SheetContext);
  if (!sheet?.pan) return <View style={style}>{children}</View>;
  return (
    <GestureDetector gesture={sheet.pan}>
      <View style={style}>{children}</View>
    </GestureDetector>
  );
}

/** Écart laissé en haut d'une feuille haute (on voit l'écran d'en dessous : c'est une feuille, pas une page). */
const BARE_GAP = 10;

/** Ressort de montée : rapide, un soupçon de dépassement, se pose (feuille = masse). */
const RISE = { ...springs.soft, stiffness: 190, damping: 21 } as const;

/**
 * Feuille modale qui monte du bas en ressort sur un voile qui s'assombrit ; toucher le voile ferme.
 * On peut la tirer vers le bas : elle suit le doigt (élastique vers le haut) et se ferme si on la lâche assez bas
 * ou assez vite, sinon elle remonte. Elle redescend en glissant à la fermeture. Animations réduites : fondus.
 */
export function SheetTemplate({ visible, onClose, title, children, footer, closeLabel: closeLabelProp, header, asScreen, bare }: SheetTemplateProps) {
  const uiStrings = useUiStrings();
  const closeLabel = closeLabelProp ?? uiStrings.close;
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  // Feuille ouverte : aucun pet décoratif (salut, tête au-dessus des onglets) ne passe par-dessus.
  useOverlay(mounted);
  const sheetH = useSharedValue(win.height);
  const y = useSharedValue(win.height);
  const scrim = useSharedValue(0);
  const fade = useSharedValue(reduced ? 0 : 1);
  const dismissed = useRef(false);

  useEffect(() => {
    if (visible) {
      dismissed.current = false;
      setMounted(true);
      if (reduced) {
        y.value = 0;
        fade.value = 0;
        fade.value = fadeTo(1, motion.base);
        scrim.value = fadeTo(1, motion.base);
      } else {
        fade.value = 1;
        y.value = sheetH.value;
        y.value = withSpring(0, RISE);
        scrim.value = withTiming(1, { duration: motion.base });
      }
      return;
    }
    if (!mounted) return;
    if (dismissed.current) {
      setMounted(false);
      return;
    }
    const done = () => setMounted(false);
    scrim.value = reduced ? fadeTo(0, motion.fast) : withTiming(0, { duration: motion.fast });
    if (reduced) {
      fade.value = fadeTo(0, motion.fast);
      const id = setTimeout(done, motion.fast + 20);
      return () => clearTimeout(id);
    }
    y.value = withTiming(sheetH.value, { duration: motion.base, easing: Easing.in(Easing.quad) }, (f) => {
      if (f) scheduleOnRN(done);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  /** Stable : le geste n'est pas recréé à chaque rendu (il serait annulé pendant qu'on tire). */
  const dismiss = useCallback(() => {
    dismissed.current = true;
    hapticFor('press');
    closeRef.current();
  }, []);

  // Le geste reste disponible avec « réduire les animations » (manipulation directe) ; seules les animations
  // de retour et de sortie deviennent des fondus.
  const panCfg = useMemo<PanGestureConfig>(
    () => ({
      activeOffsetY: 8,
      failOffsetX: [-24, 24],
      onUpdate: (e) => {
        'worklet';
        const t = e.translationY;
        y.value = t > 0 ? t : t * 0.18;
        scrim.value = 1 - Math.max(0, Math.min(1, t / Math.max(1, sheetH.value))) * 0.85;
      },
      onDeactivate: (e) => {
        'worklet';
        const h = sheetH.value;
        if (y.value > h * 0.3 || e.velocityY > 900) {
          if (reduced) fade.value = fadeTo(0, motion.fast);
          else
            y.value = withTiming(h, {
              duration: Math.max(120, Math.min(260, ((h - y.value) / Math.max(1, e.velocityY)) * 1000)),
              easing: Easing.out(Easing.quad),
            });
          scrim.value = fadeTo(0, motion.fast);
          scheduleOnRN(dismiss);
        } else {
          y.value = reduced ? 0 : withSpring(0, { ...RISE, damping: 18 });
          scrim.value = fadeTo(1, motion.fast);
        }
      },
    }),
    [reduced, dismiss, y, scrim, fade, sheetH],
  );
  const pan = usePanGesture(panCfg);

  // Fermeture animée (croix, « continuer », voile, contenu tiré vers le bas) : la feuille descend, puis `onClose`.
  const close = useCallback(() => {
    if (dismissed.current) return;
    const h = sheetH.value;
    scrim.value = fadeTo(0, motion.fast);
    if (reduced) {
      fade.value = fadeTo(0, motion.fast);
      setTimeout(dismiss, motion.fast);
      return;
    }
    y.value = withTiming(h, { duration: motion.base, easing: Easing.in(Easing.quad) }, (f) => {
      if (f) scheduleOnRN(dismiss);
    });
  }, [reduced, dismiss, y, scrim, fade, sheetH]);
  const control = useMemo<SheetControl>(() => ({ close, pan: bare ? pan : null }), [close, bare, pan]);

  const sheetStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: Math.max(-24, y.value) }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  const bareSheet = bare ? (
    <Animated.View
      accessibilityViewIsModal
      onLayout={(e) => {
        sheetH.value = e.nativeEvent.layout.height + insets.bottom;
      }}
      style={[styles.sheet, styles.bare, { height: win.height - insets.top - BARE_GAP }, sheetStyle]}
    >
      <SheetContext.Provider value={control}>
        <InkProvider value={color.white} mute={color.mute}>
          {children}
        </InkProvider>
      </SheetContext.Provider>
      <View pointerEvents="none" style={[styles.grabber, styles.bareGrabber]} />
    </Animated.View>
  ) : null;

  const content = mounted ? (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
        <RNPressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={bare ? close : onClose} style={layout.fill} />
      </Animated.View>
      {bareSheet ?? (
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityViewIsModal
          onLayout={(e) => {
            sheetH.value = e.nativeEvent.layout.height + insets.bottom;
          }}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 30) }, sheetStyle]}
        >
          <InkProvider value={color.white} mute={color.mute}>
            <View style={styles.grabber} />
            {header ?? (
              <View style={[layout.rowBetween, layout.gapMd]}>
                {title ? <Title text={title} variant="h2" style={layout.grow} /> : <View />}
                <IconButton glyph="close" label={closeLabel} onPress={onClose} size={40} />
              </View>
            )}
            <View style={styles.body}>{children}</View>
            {footer ? <View style={layout.gapSm}>{footer}</View> : null}
          </InkProvider>
        </Animated.View>
      </GestureDetector>
      )}
    </View>
  ) : null;
  if (asScreen) return content;
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={layout.fill}>{content}</GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  // `.scrim` : rgba(5,4,12,.72).
  scrim: { backgroundColor: alpha(color.night, 0.72) },
  // `.sheet` : rayon 32 en haut, padding 10 16 30, blocs séparés de 10, filet blanc à 10 % en haut.
  sheet: {
    backgroundColor: color.panel,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: veil.glass,
    paddingHorizontal: space.lg,
    paddingTop: 10,
    gap: 10,
    maxHeight: '90%',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: extra.switchOff,
    marginBottom: space.xs,
  },
  body: { gap: 10 },
  bare: { maxHeight: '100%', paddingHorizontal: 0, paddingTop: 0, gap: 0, overflow: 'hidden', backgroundColor: color.night },
  bareGrabber: { position: 'absolute', top: 8, marginBottom: 0, backgroundColor: alpha(color.white, 0.32) },
});
