import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { InkProvider } from '../lib/ink';
import { hitSlopFor, layout } from '../lib/styles';
import { color } from '../theme';
import type { TitleContent } from '../types';

export interface EncountersHeroProps {
  /** « cette semaine ». */
  kicker: string;
  /** « NINO A CROISÉ / 3 PETS. » */
  title: TitleContent;
  text?: string;
  species?: Species;
  /** Bouton blanc en haut à droite (« la carte »), avec la puce « + » de Blowy+. */
  action?: { label: string; onPress: () => void; accessibilityLabel?: string; plus?: string };
}

/** Panneau corail de l'onglet Rencontres : le pet de profil regarde au loin. */
export function EncountersHero({ kicker, title, text, species, action }: EncountersHeroProps) {
  return (
    <Panel gradient="coral" radius={32} padding="none" style={styles.panel}>
      {species ? (
        <View style={styles.pet} pointerEvents="none">
          <PetImage species={species} mood="cote" size={156} animation="breathe" />
        </View>
      ) : null}
      <View style={[layout.rowBetween, styles.top]}>
        {/* Petits textes à l'encre sombre : le blanc ne tient pas le contraste sur le corail clair (AA). */}
        <Text variant="bodyHeavy" size={13} color={color.dark} style={styles.kicker}>
          {kicker}
        </Text>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityLabel={action.accessibilityLabel ?? action.label} haptic="selection" hitSlop={hitSlopFor(34)} style={[layout.row, styles.action]}>
            <Text variant="bodyHeavy" size={13} color={color.dark}>
              {action.label}
            </Text>
            {action.plus ? (
              <LinearGradient colors={[color.violet, color.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
                <InkProvider value={color.white}>
                  <Text variant="bodyHeavy" size={9}>
                    {action.plus}
                  </Text>
                </InkProvider>
              </LinearGradient>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      <Title text={title} size={38} style={styles.title} />
      {text ? (
        <Text variant="bodyBold" size={13} color={color.dark} style={styles.text}>
          {text}
        </Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 150, paddingTop: 12, paddingBottom: 14, paddingHorizontal: 16 },
  pet: { position: 'absolute', right: -32, bottom: -30 },
  top: { zIndex: 2 },
  kicker: { letterSpacing: 1.04, textTransform: 'uppercase' },
  action: { height: 34, paddingHorizontal: 14, gap: 6, borderRadius: 999, backgroundColor: color.white },
  plus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  title: { marginTop: 6, zIndex: 2 },
  text: { marginTop: 4, maxWidth: 220, lineHeight: 17, zIndex: 2 },
});
