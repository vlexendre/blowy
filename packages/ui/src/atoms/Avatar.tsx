import type { FaceVisibility } from '@blowy/domain';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { type PetPose, petImage } from '../assets/pets';
import { color, opacity, radius, size as sizes, speciesColor } from '../theme';
import type { PetLook } from '../types';
import { Text } from './Text';

export interface AvatarProps {
  /** Diamètre. Défaut 44. */
  size?: number;
  /** Photo de profil. */
  uri?: string | null;
  /** Nom : initiale de repli et libellé d'accessibilité. */
  name?: string;
  /** Pet montré à la place du visage (visage caché, pas de photo, ou avatar de pet). */
  pet?: PetLook;
  /** Visibilité du visage selon le niveau du lien (`hidden` → pet, `blurred` → flou). */
  face?: FaceVisibility;
  blurred?: boolean;
  hidden?: boolean;
  /** Pose du pet affiché (défaut `face`, `fantome` pour un lien fantôme). */
  pose?: PetPose;
  /** Anneau de couleur autour (séparé du fond par un liseré nuit). */
  ring?: string;
  /** Liseré nuit seul (avatars superposés). */
  cutout?: boolean;
  dimmed?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Disque : photo (nette ou floue), visage de pet sur sa couleur, ou initiale. */
export function Avatar({ size = 44, uri, name, pet, face, blurred, hidden, pose = 'face', ring, cutout, dimmed, accessibilityLabel, style }: AvatarProps) {
  const isHidden = hidden ?? face === 'hidden';
  const isBlurred = blurred ?? face === 'blurred';
  const showPet = !!pet && (isHidden || !uri);
  const bg = showPet && pet ? speciesColor[pet.species] : color.card;
  const label = accessibilityLabel ?? name ?? pet?.name;
  const content =
    showPet && pet ? (
      <Image source={petImage(pet.species, pose)} contentFit="cover" style={styles.fill} />
    ) : uri ? (
      <Image source={{ uri }} contentFit="cover" blurRadius={isBlurred ? Math.round(size / 4) : 0} transition={150} style={styles.fill} />
    ) : (
      <Text variant="h3" size={Math.round(size * 0.42)}>{(name ?? '?').slice(0, 1)}</Text>
    );
  let node = <View style={[styles.disc, { width: size, height: size, backgroundColor: bg }]}>{content}</View>;
  if (ring || cutout) node = <View style={[styles.gap, { backgroundColor: color.night }]}>{node}</View>;
  if (ring) node = <View style={[styles.gap, { backgroundColor: ring }]}>{node}</View>;
  return (
    <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} style={[styles.self, dimmed && styles.dimmed, style]}>
      {node}
    </View>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  gap: { padding: sizes.ring, borderRadius: radius.pill },
  disc: { borderRadius: radius.pill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fill: { width: '100%', height: '100%' },
  dimmed: { opacity: opacity.ghost },
});
