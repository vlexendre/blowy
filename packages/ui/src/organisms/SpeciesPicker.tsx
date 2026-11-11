import { SPECIES, type Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { type PetPose, petImage } from '../assets/pets';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Sticker } from '../atoms/Sticker';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { layout } from '../lib/styles';
import { color, radius, size, space, speciesColor, speciesGradient } from '../theme';

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

const SWATCH = 58;

/** Choix du pet à la création : grand aperçu sur sa couleur + pastilles des quatre espèces. */
export function SpeciesPicker({ value, onChange, species = SPECIES, names, speech, speechHighlight, badge, pose = 'debout' }: SpeciesPickerProps) {
  return (
    <View style={layout.gapLg}>
      <Panel gradient={speciesGradient[value]} padding="lg" style={styles.stage}>
        {speech ? <SpeechBubble text={speech} highlight={speechHighlight} highlightColor={color.accent} style={styles.speech} /> : null}
        <PetImage key={value} species={value} mood={pose} size={230} animation="breathe" outline accessibilityLabel={names[value]} style={styles.pet} />
        {badge ? <Sticker label={badge} tone="white" rotate={-3} size="sm" style={styles.badge} /> : null}
      </Panel>
      <View accessibilityRole="radiogroup" style={layout.rowBetween}>
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
              style={[styles.swatchRing, on && styles.swatchOn]}
            >
              <View style={[styles.swatch, { backgroundColor: speciesColor[s] }]}>
                <Image source={petImage(s, 'face')} contentFit="cover" style={styles.face} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, alignItems: 'center', justifyContent: 'flex-end' },
  speech: { position: 'absolute', top: space.lg, left: space.lg, zIndex: 1 },
  pet: { marginBottom: -space.xl },
  badge: { position: 'absolute', right: space.lg, bottom: space.lg },
  swatchRing: { padding: 3, borderRadius: radius.pill, borderWidth: 3, borderColor: 'transparent', minWidth: size.touch, minHeight: size.touch },
  swatchOn: { borderColor: color.white },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: radius.pill, overflow: 'hidden' },
  face: { width: '100%', height: '100%' },
});
