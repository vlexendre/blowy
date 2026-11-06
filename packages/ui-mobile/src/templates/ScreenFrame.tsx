/**
 * Cadre commun des templates : fond crème, zones sûres, défilement, bandeau hors ligne
 * optionnel. Interne aux templates (pas exporté) pour éviter un « Screen » générique.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '../foundations/theme';

export interface ScreenFrameProps {
  children: ReactNode;
  /** Bandeau en tête (hors ligne, démo). */
  banner?: ReactNode;
  /** Pied collant (CTA) hors défilement. */
  footer?: ReactNode;
  scroll?: boolean;
  bottomSpace?: number;
  testID?: string;
  tone?: 'cream' | 'ink';
}

export function ScreenFrame({
  children,
  banner,
  footer,
  scroll = true,
  bottomSpace = 0,
  testID,
  tone = 'cream',
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const bg = tone === 'ink' ? color.ink : color.cream;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + space.xl }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, { paddingBottom: bottomSpace }]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: bg, paddingTop: insets.top }]}
      testID={testID}
    >
      {banner ? <View style={styles.banner}>{banner}</View> : null}
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, space.lg), backgroundColor: bg },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md },
  banner: { paddingHorizontal: space.lg, paddingTop: space.xs },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.sm },
});
