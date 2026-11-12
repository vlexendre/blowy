import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentRef, ReactElement, ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, Platform, type RefreshControlProps, ScrollView, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InkProvider } from '../lib/ink';
import { color, type GradientName, gradient as gradients, space } from '../theme';

export interface ScreenTemplateProps {
  children?: ReactNode;
  /** Barre du haut (souvent `<Header />`), hors défilement. */
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
  /** Espace réservé en bas du contenu (ex. `TAB_BAR_SPACE`). */
  bottomSpace?: number;
  /** Évite le clavier (défaut vrai). */
  keyboard?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Gabarit de base : fond nuit, zones de sécurité, en-tête, corps défilant ou fixe, pied collant, clavier. */
export function ScreenTemplate({
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
  contentStyle,
}: ScreenTemplateProps) {
  const insets = useSafeAreaInsets();
  const top = edges.includes('top') ? insets.top : 0;
  const safeBottom = edges.includes('bottom') ? insets.bottom : 0;
  const pad = padded ? { paddingHorizontal: gutter } : null;
  const bodyBottom = (footer ? 0 : safeBottom) + bottomSpace + (scroll ? space.xl : 0);

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.fill}
      contentContainerStyle={[styles.grow, pad, { paddingBottom: bodyBottom }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, pad, { paddingBottom: bodyBottom }, contentStyle]}>{children}</View>
  );

  const inner = (
    <>
      {body}
      {footer ? <View style={[pad, styles.footer, { paddingBottom: Math.max(safeBottom, space.lg) }]}>{footer}</View> : null}
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {background !== 'night' ? <LinearGradient colors={gradients[background]} style={StyleSheet.absoluteFill} /> : null}
      <InkProvider value={color.white} mute={color.mute}>
        {header ? <View style={[pad, styles.header, headerStyle]}>{header}</View> : null}
        {keyboard ? (
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {inner}
          </KeyboardAvoidingView>
        ) : (
          inner
        )}
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  header: { paddingTop: space.xs, paddingBottom: space.sm },
  footer: { paddingTop: space.md, gap: space.sm },
});
