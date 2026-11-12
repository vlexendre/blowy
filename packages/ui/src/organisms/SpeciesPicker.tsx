import { SPECIES, type Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { PetPose } from '../assets/pets';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { hitSlopFor, layout } from '../lib/styles';
import { alpha, color, craft, radius, shadow, space } from '../theme';

export interface SpeciesPickerProps {
  value: Species;
  onChange: (species: Species) => void;
  species?: readonly Species[];
  /** Nom lu de chaque espèce (accessibilité). */
  names: Record<Species, string>;
  /** Ce que dit le pet choisi (« salut, moi c'est nino 👋 »). */
  speech?: string;
  /** Mot mis en couleur dans la bulle (le nom). */
  speechHighlight?: string;
  /** Autocollant (« exemplaire unique »). */
  badge?: string;
  /** Pose du grand aperçu. Défaut `debout` (corps entier). */
  pose?: PetPose;
}

const SWATCH = 48;

/** Choix du pet à la création (V6-Craft) : grand aperçu sur sa couleur + une pastille par espèce. */
export function SpeciesPicker({ value, onChange, species = SPECIES, names, speech, speechHighlight, badge, pose = 'debout' }: SpeciesPickerProps) {
  const look = craft[value];
  return (
    <View>
      <View style={styles.stage}>
        <LinearGradient colors={look.gradient} style={[StyleSheet.absoluteFill, styles.stageFill]} />
        <View pointerEvents="none" style={styles.petBox}>
          <PetImage key={value} species={value} mood={pose} size={300} rotate={4} animation="breathe" outline accessibilityLabel={names[value]} style={shadow.soft} />
        </View>
        {speech ? <SpeechBubble text={speech} highlight={speechHighlight} highlightColor={look.swatch} chat style={styles.speech} /> : null}
        {badge ? (
          <View style={styles.badge}>
            <Text variant="bodyHeavy" size={12} color={color.dark} style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <View accessibilityRole="radiogroup" style={[layout.rowBetween, styles.swatches]}>
        {species.map((s) => {
          const on = s === value;
          return (
            <Pressable
              key={s}
              onPress={() => onChange(s)}
              haptic="selection"
              scaleTo={0.9}
              accessibilityRole="radio"
              accessibilityLabel={names[s]}
              accessibilityState={{ checked: on }}
              hitSlop={hitSlopFor(SWATCH)}
              style={[styles.swatch, { backgroundColor: craft[s].swatch }, on ? styles.swatchOn : styles.swatchOff]}
            >
              {on ? <View pointerEvents="none" style={styles.ring} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, borderRadius: radius.xl - 4 },
  stageFill: { borderRadius: radius.xl - 4 },
  petBox: { position: 'absolute', left: 0, right: 0, bottom: -18, alignItems: 'center' },
  speech: { position: 'absolute', top: space.lg, left: 14 },
  badge: { position: 'absolute', right: 14, bottom: 14, paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color.white },
  badgeText: { lineHeight: 16 },
  swatches: { marginTop: 30 },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: radius.pill },
  swatchOff: { borderWidth: 2, borderColor: alpha(color.white, 0.25) },
  swatchOn: { transform: [{ scale: 1.08 }] },
  // `box-shadow: 0 0 0 3px nuit, 0 0 0 6px blanc` : anneau blanc séparé de la pastille par la nuit.
  ring: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: radius.pill, borderWidth: 3, borderColor: color.white },
});
