import type { Outfit, Species } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { badgeFrame, FIT_CANVAS } from '../assets/fit';
import { color, radius, size as sizes, speciesColor } from '../theme';
import { DressedPet } from './DressedPet';

export interface PetBadgeProps {
  species: Species;
  outfit?: Outfit | null;
  /** Diamètre. Défaut 44. */
  size?: number;
  /** Fond du disque ; défaut la couleur de l'espèce. */
  background?: string;
  /** Anneau de couleur autour (séparé par un liseré nuit), comme `Avatar`. */
  ring?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const SLOTS = ['body', 'face', 'head'] as const;

/** Médaillon rond du pet habillé : tête et épaules, avec les objets de la tête et du visage (rangées de chat, en-têtes). */
export function PetBadge({ species, outfit, size = 44, background, ring, accessibilityLabel, style }: PetBadgeProps) {
  const frame = badgeFrame(species);
  const k = size / frame.side;
  const disc = (
    <View style={[styles.disc, { width: size, height: size, backgroundColor: background ?? speciesColor[species] }]}>
      <DressedPet
        species={species}
        outfit={outfit}
        slots={SLOTS}
        size={FIT_CANVAS.width * k}
        style={{ position: 'absolute', left: -(frame.cx - frame.side / 2) * k, top: -(frame.cy - frame.side / 2) * k }}
      />
    </View>
  );
  return (
    <View accessible={!!accessibilityLabel} accessibilityRole={accessibilityLabel ? 'image' : undefined} accessibilityLabel={accessibilityLabel} style={[styles.self, style]}>
      {ring ? (
        <View style={[styles.gap, { backgroundColor: ring }]}>
          <View style={[styles.gap, { backgroundColor: color.night }]}>{disc}</View>
        </View>
      ) : (
        disc
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  gap: { padding: sizes.ring, borderRadius: radius.pill },
  disc: { borderRadius: radius.pill, overflow: 'hidden' },
});
