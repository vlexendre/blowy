/**
 * Un minimoa habillé, seul, sur fond transparent (route : /dev/look?species=nino&pose=coucou&head=bob&face=lunettes_rondes&body=echarpe&toy=ballon).
 * Sert à capturer les tenues du site (apps/web/public/img/m/tenue_*.webp) tel que l'app les dessine (`DressedPet`).
 * `?size=900` : largeur de la toile (défaut 900, la toile du pack) ; une marge transparente laisse dépasser les objets.
 */
import { type Outfit, type Species } from '@blowy/domain';
import { type BodyPose, DressedPet } from '@blowy/ui';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

const SPECIES: Species[] = ['nino', 'suzie', 'gaston', 'pia'];

export default function Look() {
  const q = useLocalSearchParams<{ species?: string; pose?: string; size?: string; head?: string; face?: string; body?: string; toy?: string }>();
  const species = (SPECIES.includes(q.species as Species) ? q.species : 'nino') as Species;
  const size = Number(q.size) || 900;
  const outfit: Outfit = {};
  for (const slot of ['head', 'face', 'body', 'toy'] as const) if (q[slot]) outfit[slot] = q[slot];
  const pad = size * 0.3;
  return (
    <View testID="look" style={{ alignSelf: 'flex-start', padding: pad, backgroundColor: 'transparent' }}>
      <DressedPet species={species} outfit={outfit} pose={(q.pose ?? 'neutre') as BodyPose} size={size} />
    </View>
  );
}
