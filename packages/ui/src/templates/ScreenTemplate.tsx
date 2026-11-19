import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cloneElement, type ComponentProps, type ComponentRef, type ReactElement, type ReactNode, type Ref, useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { type SharedValue, useAnimatedRef, useAnimatedStyle, useScrollOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loader } from '../atoms/Loader';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { useReducedMotion } from '../lib/motion';
import { ScrollLockProvider, useScrollLock } from '../lib/scroll-lock';
import { alpha, color, type GradientName, gradient as gradients, space, veil } from '../theme';

export interface ScreenTemplateProps {
  children?: ReactNode;
  /**
   * Barre du haut (souvent `<Header />`). Corps défilant : elle reste collée en haut et le contenu passe dessous,
   * derrière un verre flouté qui n'apparaît qu'une fois le contenu défilé (au repos, rien n'est caché).
   */
  header?: ReactNode;
  /** Pied collé en bas (bouton principal, composer), au-dessus du clavier. */
  footer?: ReactNode;
  /** Corps défilant (défaut) ou fixe (listes, chat). */
  scroll?: boolean;
  /** Fond : nuit unie (défaut) ou un dégradé plein écran. */
  background?: GradientName | 'night';
  /** Marges latérales de `tokens.space.lg`. Défaut vrai. */
  padded?: boolean;
  /** Marge latérale personnalisée quand `padded` (ex. 18 pour l'inscription). */
  gutter?: number;
  /** Espacements de la barre du haut (défaut 4 au-dessus, 8 en dessous). */
  headerStyle?: StyleProp<ViewStyle>;
  /** Bords protégés par la zone de sécurité. Défaut haut et bas. */
  edges?: readonly ('top' | 'bottom')[];
  /** Espace réservé en bas du contenu (ex. `useTabBarSpace()`). */
  bottomSpace?: number;
  /** Évite le clavier (défaut vrai). */
  keyboard?: boolean;
  /**
   * Tirer pour rafraîchir. L'indicateur natif (roue) est remplacé par trois boules qui se remplissent à mesure
   * qu'on tire puis rebondissent (`Loader`) ; si l'indicateur est déjà transparent (`PetRefresh`), rien n'est ajouté.
   */
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
  /** Défilement : fonction, ou gestionnaire Reanimated (`useAnimatedScrollHandler`, ex. `PetRefresh`). */
  onScroll?: ((e: NativeSyntheticEvent<NativeScrollEvent>) => void) | ComponentProps<typeof Animated.ScrollView>['onScroll'];
  scrollEventThrottle?: number;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Petit titre qui apparaît dans la barre du haut quand le grand titre est sorti de l'écran (corps défilant
   * sans `header`, ex. onglets). `compactAfter` : défilement (pt) à partir duquel il apparaît.
   */
  compactTitle?: string;
  compactAfter?: number;
}

/** Hauteur de la barre du petit titre (sous la zone de sécurité). */
const COMPACT = 44;
/** Défilement sur lequel le verre de la barre du haut apparaît. */
const MATERIAL_IN = 14;
/** Distance de tirage pour remplir les trois boules du rafraîchissement. */
const PULL = 72;

/**
 * Gabarit de base : fond nuit, zones de sécurité, en-tête, corps défilant ou fixe, pied collant, clavier.
 * Corps défilant : la page occupe toute la hauteur ; l'en-tête (ou, sans en-tête, la bande de la barre d'état)
 * reste collé en haut et le contenu passe dessous derrière un verre flouté qui s'allume dès qu'on défile.
 * Fournit le verrou de défilement (`useScrollLock`) : un pet attrapé bloque le défilement le temps du geste.
 */
export function ScreenTemplate(props: ScreenTemplateProps) {
  return (
    <ScrollLockProvider>
      <ScreenBody {...props} />
    </ScrollLockProvider>
  );
}

/** Verre de la barre du haut : flou sombre + teinte nuit + filet, en fondu selon le défilement (transformations et opacité seulement). */
function BarMaterial({ offset, from, span, style }: { offset: SharedValue<number>; from: number; span: number; style?: StyleProp<ViewStyle> }) {
  const shown = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (offset.value - from) / span)) }));
  return (
    <Animated.View pointerEvents="none" style={[styles.material, style, shown]}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
    </Animated.View>
  );
}

/** Petit titre de la barre du haut : monte et apparaît quand le grand titre est sorti. */
function CompactTitle({ offset, after, title }: { offset: SharedValue<number>; after: number; title: string }) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => {
    const k = Math.min(1, Math.max(0, (offset.value - after) / 18));
    return { opacity: k, transform: [{ translateY: reduced ? 0 : (1 - k) * 6 }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.compact, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text variant="bodyHeavy" size={17} numberOfLines={1} center>
        {title}
      </Text>
    </Animated.View>
  );
}

/** Une boule du rafraîchissement : elle se remplit quand on a tiré assez loin (la 1re, puis la 2e, puis la 3e). */
function RefreshDot({ offset, index }: { offset: SharedValue<number>; index: number }) {
  const style = useAnimatedStyle(() => {
    const pull = Math.max(0, -offset.value);
    const k = Math.min(1, Math.max(0, (pull - 12 - index * (PULL / 4)) / (PULL / 4)));
    return { opacity: 0.25 + 0.75 * k, transform: [{ scale: 0.6 + 0.4 * k }] };
  });
  return <Animated.View style={[styles.refreshDot, style]} />;
}

/** Rafraîchissement : trois boules qui se remplissent en tirant, puis rebondissent pendant le chargement (`Loader`). */
function RefreshDots({ offset, refreshing, top }: { offset: SharedValue<number>; refreshing: boolean; top: number }) {
  const row = useAnimatedStyle(() => ({ opacity: refreshing ? 1 : Math.min(1, Math.max(0, (-offset.value - 8) / 24)) }));
  return (
    <Animated.View pointerEvents="none" style={[styles.refresh, { top }, row]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {refreshing ? (
        <Loader color="accent" size={8} />
      ) : (
        <View style={styles.refreshRow}>
          {[0, 1, 2].map((i) => (
            <RefreshDot key={i} offset={offset} index={i} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function ScreenBody({
  children,
  header,
  footer,
  scroll = true,
  background = 'night',
  padded = true,
  gutter = space.lg,
  headerStyle,
  edges = ['top', 'bottom'],
  bottomSpace = 0,
  keyboard = true,
  refreshControl,
  scrollRef,
  onScroll,
  scrollEventThrottle,
  contentStyle,
  compactTitle,
  compactAfter = 72,
}: ScreenTemplateProps) {
  const insets = useSafeAreaInsets();
  const { locked } = useScrollLock();
  // Clavier ouvert : il couvre déjà la zone du bas ; le pied (champ du chat) se pose juste dessus, sans marge en trop.
  const keyboardUp = useKeyboardUp(keyboard && !!footer);
  const top = edges.includes('top') ? insets.top : 0;
  const safeBottom = edges.includes('bottom') ? insets.bottom : 0;
  const pad = padded ? { paddingHorizontal: gutter } : null;
  const bodyBottom = (footer ? 0 : safeBottom) + bottomSpace + (scroll ? space.xl : 0);
  const aref = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scroll ? aref : null);
  const setRef = useCallback(
    (node: Animated.ScrollView | null) => {
      aref(node);
      if (!scrollRef) return;
      if (typeof scrollRef === 'function') scrollRef(node as unknown as ComponentRef<typeof ScrollView>);
      else (scrollRef as { current: unknown }).current = node;
    },
    [aref, scrollRef],
  );

  // Rafraîchissement : la roue native devient transparente, nos boules la remplacent (sauf si déjà fait par `PetRefresh`).
  const branded = !!refreshControl && refreshControl.props.tintColor !== 'transparent';
  const refresh = refreshControl && branded ? cloneElement(refreshControl, { tintColor: 'transparent', colors: [color.accent], progressBackgroundColor: color.card }) : refreshControl;
  const compact = scroll && !header && compactTitle ? compactTitle : null;

  // Barre collée en haut (corps défilant) : bande de la zone de sécurité + en-tête, verre qui s'allume au défilement.
  const bar = (
    <View style={styles.bar}>
      <BarMaterial offset={offset} from={0} span={MATERIAL_IN} style={StyleSheet.absoluteFill} />
      {compact ? <BarMaterial offset={offset} from={compactAfter} span={18} style={[styles.compactMaterial, { top }]} /> : null}
      {compact ? <View style={[styles.compactSlot, { top }]}>{<CompactTitle offset={offset} after={compactAfter} title={compact} />}</View> : null}
      {refresh && branded ? <RefreshDots offset={offset} refreshing={!!refreshControl?.props.refreshing} top={top - 36} /> : null}
      <View style={{ height: top }} />
      {header ? <View style={[pad, styles.header, headerStyle]}>{header}</View> : null}
    </View>
  );

  const body = scroll ? (
    <Animated.ScrollView
      ref={setRef}
      style={styles.fill}
      scrollEnabled={!locked}
      onScroll={onScroll as ComponentProps<typeof Animated.ScrollView>['onScroll']}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      contentContainerStyle={styles.grow}
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={refresh}
    >
      {bar}
      <View style={[styles.grow, pad, { paddingBottom: bodyBottom }, contentStyle]}>{children}</View>
    </Animated.ScrollView>
  ) : (
    <View style={[styles.fill, pad, { paddingBottom: bodyBottom }, contentStyle]}>{children}</View>
  );

  const inner = (
    <>
      {body}
      {/* Corps fixe sous un en-tête (chat) : la liste s'efface sous l'en-tête au lieu d'être coupée net. */}
      {!scroll && header && background === 'night' ? <LinearGradient pointerEvents="none" colors={[color.night, alpha(color.night, 0)]} style={styles.headerFade} /> : null}
      {footer ? (
        <View style={[pad, styles.footer, { paddingBottom: keyboardUp ? space.sm : Math.max(safeBottom, space.lg) }]}>
          {/* Le contenu qui défile s'efface en douceur au-dessus du pied au lieu d'être coupé net. */}
          {scroll && background === 'night' ? <LinearGradient pointerEvents="none" colors={[alpha(color.night, 0), color.night]} style={styles.footerFade} /> : null}
          {footer}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, scroll ? null : { paddingTop: top }]}>
      {background !== 'night' ? <LinearGradient colors={gradients[background]} style={StyleSheet.absoluteFill} /> : null}
      <InkProvider value={color.white} mute={color.mute}>
        {!scroll && header ? <View style={[pad, styles.header, headerStyle]}>{header}</View> : null}
        {keyboard ? (
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {inner}
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.fill}>{inner}</View>
        )}
      </InkProvider>
    </View>
  );
}

/** Clavier affiché (iOS : dès qu'il commence à monter, pour bouger avec lui). Écoute seulement si `active`. */
function useKeyboardUp(active: boolean): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!active || Platform.OS === 'web') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [active]);
  return active && up;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  header: { paddingTop: space.xs, paddingBottom: space.sm },
  footer: { paddingTop: space.md, gap: space.sm },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -20, height: 20 },
  bar: { zIndex: 5 },
  material: { overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: veil.line },
  tint: { backgroundColor: alpha(color.night, 0.72) },
  compactMaterial: { position: 'absolute', left: 0, right: 0, height: COMPACT },
  compactSlot: { position: 'absolute', left: space.xxxl, right: space.xxxl, height: COMPACT, justifyContent: 'center' },
  compact: { alignItems: 'center' },
  refresh: { position: 'absolute', left: 0, right: 0, height: 28, alignItems: 'center', justifyContent: 'center' },
  refreshRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  refreshDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
  headerFade: { position: 'absolute', left: 0, right: 0, top: 0, height: 14 },
});
