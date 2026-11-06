import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '../foundations/theme';
import { Header } from '../molecules/Header';

export interface ChatScreenTemplateProps {
  title: string;
  onBack: () => void;
  backLabel: string;
  trailing?: ReactNode;
  /** Bandeaux sous l'en-tête (blocage en attente…). */
  banner?: ReactNode;
  /** Fil (ChatThread) — occupe l'espace restant. */
  thread: ReactNode;
  /** Au-dessus du compositeur (suggestion du pet). */
  aboveComposer?: ReactNode;
  composer: ReactNode;
  /** Feuilles modales (menu sécurité). */
  overlays?: ReactNode;
  testID?: string;
}

/** Écran de conversation : en-tête, fil inversé, compositeur collé au clavier. */
export function ChatScreenTemplate({
  title,
  onBack,
  backLabel,
  trailing,
  banner,
  thread,
  aboveComposer,
  composer,
  overlays,
  testID,
}: ChatScreenTemplateProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
      testID={testID}
    >
      <View style={styles.head}>
        <Header title={title} onBack={onBack} backLabel={backLabel} trailing={trailing} />
        {banner}
      </View>
      <View style={styles.flex}>{thread}</View>
      {aboveComposer ? <View style={styles.head}>{aboveComposer}</View> : null}
      <View style={{ paddingBottom: insets.bottom }}>{composer}</View>
      {overlays}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  head: { paddingHorizontal: space.lg, gap: space.sm },
  flex: { flex: 1 },
});
