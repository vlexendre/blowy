import type { ReactNode } from 'react';
import { Modal, Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../atoms/IconButton';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';

export interface SheetTemplateProps {
  visible: boolean;
  onClose: () => void;
  title?: TitleContent;
  children?: ReactNode;
  footer?: ReactNode;
  /** Libellé lu du bouton et du fond de fermeture. Défaut « Fermer ». */
  closeLabel?: string;
}

/** Feuille modale qui monte du bas, sur un voile sombre (toucher le voile ferme). */
export function SheetTemplate({ visible, onClose, title, children, footer, closeLabel = 'Fermer' }: SheetTemplateProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <View style={styles.root}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.scrim]}>
            <RNPressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={layout.fill} />
          </Animated.View>
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            exiting={SlideOutDown}
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}
          >
            <InkProvider value={color.white} mute={color.mute}>
              <View style={styles.grabber} />
              <View style={[layout.rowBetween, layout.gapMd]}>
                {title ? <Title text={title} variant="h2" style={layout.grow} /> : <View />}
                <IconButton glyph="close" label={closeLabel} onPress={onClose} size={40} />
              </View>
              <View style={styles.body}>{children}</View>
              {footer ? <View style={layout.gapSm}>{footer}</View> : null}
            </InkProvider>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: veil.scrim },
  sheet: {
    backgroundColor: color.panel,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: veil.line,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.md,
    maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: veil.off, marginBottom: space.xs },
  body: { gap: space.md },
});
