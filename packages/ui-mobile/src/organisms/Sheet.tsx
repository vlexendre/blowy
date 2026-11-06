/**
 * Feuille modale (paywall, actions courtes, menu de sécurité). Glisse depuis le bas ; en
 * mouvement réduit, apparaît sans translation. Fermeture par bouton explicite + geste retour.
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useA11yPrefs } from '../foundations/accessibility';
import { color, radius, scrim, space } from '../foundations/theme';
import { Header } from '../molecules/Header';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  title?: string;
  children: ReactNode;
  testID?: string;
}

export function Sheet({ visible, onClose, closeLabel, title, children, testID }: SheetProps) {
  const { reduceMotion } = useA11yPrefs();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={closeLabel}
          accessibilityRole="button"
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}
          accessibilityViewIsModal
        >
          <View style={styles.grip} />
          <Header title={title} onClose={onClose} closeLabel={closeLabel} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: scrim.sheet },
  sheet: {
    backgroundColor: color.cream,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    maxHeight: '90%',
  },
  grip: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.creamShadow,
    marginBottom: space.sm,
  },
  content: { gap: space.md, paddingTop: space.md, paddingBottom: space.lg },
});
