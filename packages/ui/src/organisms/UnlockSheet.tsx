import type { Outfit, Species } from '@blowy/domain';
import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { DressedPet } from '../atoms/DressedPet';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { haptic } from '../lib/haptics';
import { useLoop } from '../lib/motion';
import { alpha, color, shadow } from '../theme';
import type { TitleContent } from '../types';

export interface UnlockSheetProps {
  visible: boolean;
  /** L'objet débloqué (`PetView.newItems`). */
  itemId: string;
  /** Son nom (`itemLabel`), lu par le lecteur d'écran. */
  itemName: string;
  /** Le pet, déjà habillé avec l'objet (aperçu). */
  pet: { species: Species; outfit?: Outfit | null; name?: string };
  /** Puce en haut à gauche (« nouveau ! »). */
  kicker: string;
  /** « TACHES DE ROUSSEUR / POUR NINO. » */
  title: TitleContent;
  /** Ligne sous le titre (« 1 jour de soins. c'est mérité. »). */
  text?: string;
  /** Bouton jaune (« il le porte »). */
  wearLabel: string;
  onWear: () => void;
  wearing?: boolean;
  /** Bouton verre (« ranger dans la garde-robe »). */
  closeLabel: string;
  onClose: () => void;
}

const PET = 250;

/** Fête d'un objet tout juste gagné (V6-Debloque) : plein écran jaune, le pet qui le porte déjà, « il le porte » ou « ranger ». */
export function UnlockSheet({ visible, itemId, itemName, pet, kicker, title, text, wearLabel, onWear, wearing, closeLabel, onClose }: UnlockSheetProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const t = useLoop(1300, visible);
  // `.sq` : petit saut écrasé en boucle.
  const hop = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * t.value }, { scaleX: 1 - 0.03 * t.value }, { scaleY: 1 + 0.04 * t.value }],
  }));
  useEffect(() => {
    if (visible) haptic('success');
  }, [visible, itemId]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 18) + 8 }]} accessibilityViewIsModal>
          <Animated.View key={itemId} entering={reduced ? undefined : ZoomIn.springify().damping(15)} style={styles.grow}>
            <Panel gradient="accent" radius={32} padding="none" style={styles.grow}>
              <View style={styles.panel}>
                <Chip label={kicker} tone="dark" ink={color.accent} style={styles.kicker} />
                <View style={styles.stage}>
                  <Animated.View style={[styles.origin, hop]}>
                    <DressedPet species={pet.species} outfit={pet.outfit} size={PET} accessibilityLabel={pet.name ? `${pet.name}, ${itemName}` : itemName} />
                  </Animated.View>
                  <Animated.View entering={reduced ? undefined : FadeIn.delay(350)} style={[styles.item, shadow.soft]}>
                    <ItemImage id={itemId} size={58} />
                  </Animated.View>
                </View>
                <Title text={title} size={52} center style={styles.title} />
                {text ? (
                  <Text variant="bodyBold" size={15} center style={styles.text}>
                    {text}
                  </Text>
                ) : null}
              </View>
            </Panel>
          </Animated.View>
          <View style={styles.actions}>
            <Button label={wearLabel} onPress={onWear} loading={wearing} />
            <Button label={closeLabel} variant="ghost" onPress={onClose} disabled={wearing} />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // `.wrap` : padding 0 14, écart 12, fond nuit.
  root: { flex: 1, paddingHorizontal: 14, gap: 12, backgroundColor: color.night },
  grow: { flex: 1 },
  // `.panel` jaune : contenu calé en bas, centré, padding bas 20.
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  kicker: { position: 'absolute', top: 18, left: 18 },
  stage: { width: PET * 1.12, alignItems: 'center', marginBottom: -4 },
  origin: { transformOrigin: '50% 100%' },
  item: {
    position: 'absolute',
    top: 6,
    right: 0,
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color.white, 0.85),
    borderWidth: 3,
    borderColor: color.white,
  },
  title: { marginTop: 8 },
  text: { marginTop: 6 },
  // Boutons : écart 8, 26 au-dessus du bas.
  actions: { gap: 8 },
});
