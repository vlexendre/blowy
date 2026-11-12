import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { PortraitTile } from '../molecules/PortraitTile';
import { PopIn } from '../motion/PopIn';
import { space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface ProfileHeroProps {
  /** « ALEX. / ET NINO. » */
  title: TitleContent;
  /** « ta photo reste floue jusqu'au niveau 5 de chaque lien. » */
  hint: string;
  photoUri?: string | null;
  /** Libellé lu de la photo (floutée). */
  photoLabel: string;
  pet: PetLook;
  /** Fond et anneau de la pastille du pet (défaut : couleur de l'espèce). */
  petColor: string;
  onPhotoPress?: () => void;
}

const TILE_W = 104;
const TILE_H = 128;
const BADGE = 48;

/** Panneau rose de Moi : ta photo floutée, ton pet en pastille, ton nom et celui du pet. */
export function ProfileHero({ title, hint, photoUri, photoLabel, pet, petColor, onPhotoPress }: ProfileHeroProps) {
  const photo = (
    <>
      <PortraitTile uri={photoUri} width={TILE_W} height={TILE_H} blurred accessibilityLabel={photoLabel} />
      {/* Le pet arrive en « pop » sur le coin de ta photo. */}
      <PopIn delay={220} from={0.3} style={styles.badge} pointerEvents="none">
        <Avatar size={BADGE} pet={pet} hidden bg={petColor} ring={petColor} accessibilityLabel={pet.name} />
      </PopIn>
    </>
  );
  return (
    <Panel gradient="rose" radius={32} padding="lg" style={styles.panel}>
      {onPhotoPress ? (
        <Pressable onPress={onPhotoPress} accessibilityLabel={photoLabel} scaleTo={0.97}>
          {photo}
        </Pressable>
      ) : (
        <View>{photo}</View>
      )}
      <View style={styles.texts}>
        <Title text={title} size={50} />
        <Text variant="body" size={13} style={styles.hint}>
          {hint}
        </Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  // La pastille du pet déborde de 16 à droite de la photo : l'écart la laisse hors du texte.
  panel: { flexDirection: 'row', alignItems: 'center', gap: space.md + 12 },
  // L'anneau (2 + 2 pt) déborde du disque de 48 : la pastille est à -12 / -10 du coin, comme `.ava`.
  badge: { position: 'absolute', right: -12 - 4, bottom: -10 - 4 },
  texts: { flex: 1, minWidth: 0 },
  hint: { marginTop: 6 },
});
