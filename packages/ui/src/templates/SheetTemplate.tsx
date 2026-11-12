import type { ReactNode } from 'react';
import { Modal, Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../atoms/IconButton';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { alpha, color, extra, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';

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
}

/** Feuille modale qui monte du bas, sur un voile sombre (toucher le voile ferme). */
export function SheetTemplate({
  visible,
  onClose,
  title,
  children,
  footer,
  closeLabel = 'Fermer',
  header,
  asScreen,
}: SheetTemplateProps) {
  const insets = useSafeAreaInsets();
  const content = visible ? (
    <View style={styles.root}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <RNPressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={layout.fill}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown}
        accessibilityViewIsModal
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 30) }]}
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
    </View>
  ) : null;
  if (asScreen) return content;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {content}
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
});
