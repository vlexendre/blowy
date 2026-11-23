import type { FaceVisibility } from '@blowy/domain';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { hasOutfit } from '../assets/fit';
import { type PetPose, petImage } from '../assets/pets';
import { color, opacity, petTint, radius, size as sizes } from '../theme';
import type { PetLook } from '../types';
import { PetBadge } from './PetBadge';
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
  /**
   * Visibilité du visage : `hidden` → pet ; `blurred` → vignette déjà très floue faite par le serveur (seule photo
   * envoyée avant le lien), à peine adoucie ici, avec le pet en petit médaillon ; `clear` → photo nette.
   */
  face?: FaceVisibility;
  /** Flou forcé, sur la photo comme sur le pet (aperçu verrouillé). */
  blurred?: boolean;
  hidden?: boolean;
  /** Pose du pet affiché (défaut `face`, `fantome` pour un lien fantôme). */
  pose?: PetPose;
  /** Fond du disque derrière le pet ; défaut la couleur de l'espèce. */
  bg?: string;
  /** Anneau de couleur autour (séparé du fond par un liseré nuit). */
  ring?: string;
  /** Liseré nuit seul (avatars superposés). */
  cutout?: boolean;
  dimmed?: boolean;
  /** Montre le pet habillé (médaillon) quand `pet.outfit` contient un objet et que la pose est `face`. Défaut vrai. */
  dressed?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Au-dessous de ce diamètre, la vignette floue n'a pas de médaillon du pet (illisible). */
const MARK_MIN = 30;
/** Adoucissement de la vignette floue (déjà floue côté serveur : on lisse seulement l'agrandissement). */
const SOFTEN = 2;

/** Disque : photo (nette ou floue), visage de pet sur sa couleur, ou initiale. */
export function Avatar({ size = 44, uri, name, pet, face, blurred, hidden, pose = 'face', bg: discBg, ring, cutout, dimmed, dressed = true, accessibilityLabel, style }: AvatarProps) {
  const isHidden = hidden ?? face === 'hidden';
  const isBlurred = blurred ?? face === 'blurred';
  const showPet = !!pet && (isHidden || !uri);
  // Disque du pet : `petTint` (Nino sur jaune, comme dans toutes les maquettes).
  const bg = showPet && pet ? (discBg ?? petTint[pet.species]) : color.card;
  const label = accessibilityLabel ?? name ?? pet?.name;
  const showDressed = showPet && !!pet && dressed && pose === 'face' && !blurred && hasOutfit(pet.outfit);
  const content =
    showDressed && pet ? (
      <PetBadge species={pet.species} outfit={pet.outfit} size={size} />
    ) : showPet && pet ? (
      <Image source={petImage(pet.species, pose)} contentFit="cover" blurRadius={blurred ? Math.round(size / 6) : 0} style={styles.fill} />
    ) : uri ? (
      <Image source={{ uri }} contentFit="cover" blurRadius={blurred ? Math.round(size / 4) : isBlurred ? SOFTEN : 0} transition={150} style={styles.fill} />
    ) : (
      <Text variant="h3" size={Math.round(size * 0.42)}>{(name ?? '?').slice(0, 1)}</Text>
    );
  let node = <View style={[styles.disc, { width: size, height: size, backgroundColor: bg }]}>{content}</View>;
  if (ring || cutout) node = <View style={[styles.gap, { backgroundColor: color.night }]}>{node}</View>;
  if (ring) node = <View style={[styles.gap, { backgroundColor: ring }]}>{node}</View>;
  // Vignette floue d'une personne pas encore liée : son minimoa en petit, en bas à droite, pour la reconnaître.
  const markSize = Math.round(size * 0.42);
  const mark =
    !showPet && uri && isBlurred && !blurred && pet && size >= MARK_MIN ? (
      <View style={[styles.mark, { borderRadius: radius.pill }]}>
        <PetBadge species={pet.species} outfit={pet.outfit} size={markSize} background={petTint[pet.species]} />
      </View>
    ) : null;
  return (
    <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} style={[styles.self, dimmed && styles.dimmed, style]}>
      {node}
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  self: { alignSelf: 'flex-start' },
  gap: { padding: sizes.ring, borderRadius: radius.pill },
  disc: { borderRadius: radius.pill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fill: { width: '100%', height: '100%' },
  mark: { position: 'absolute', right: -2, bottom: -2, padding: sizes.ring, backgroundColor: color.night },
  dimmed: { opacity: opacity.ghost },
});
