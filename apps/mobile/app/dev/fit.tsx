/**
 * Planche de contrôle de l'habillage (route : /dev/fit?species=nino) : 6 poses du pack × 12 objets représentatifs,
 * rendus comme dans l'app (`DressedPet`). Sert à vérifier à l'œil que chaque objet a l'air porté, pose par pose.
 * `?items=bob,cape` : seulement ces objets ; `?size=240` : cases plus grandes ; `?flat=1` : rendu simple (sans ombre, voile ni fourrure), pour comparer.
 */
import type { Outfit, Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { type BodyPose, DressedPet, EncounterStage, PetStage, Text } from '@blowy/ui';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

const POSES: BodyPose[] = ['neutre', 'joie', 'boude', 'dodo', 'marche', 'check'];
const ITEMS: Outfit[] = [
  { head: 'bob' },
  { head: 'casquette' },
  { head: 'couronne' },
  { face: 'lunettes_rondes' },
  { face: 'lunettes_etoile' },
  { body: 'noeud_pap' },
  { body: 'echarpe' },
  { body: 'collier_perles' },
  { body: 'sac_a_dos' },
  { body: 'cape' },
  { head: 'casque_audio' },
  { toy: 'doudou' },
];
const CELL = 118;

export default function FitBoard() {
  const q = useLocalSearchParams<{ species?: string; flat?: string; size?: string; items?: string; stage?: string; shape?: string; hat?: string; pair?: string; wave?: string }>();
  const species = (['nino', 'suzie', 'gaston', 'pia'].includes(q.species ?? '') ? q.species : 'nino') as Species;
  const cell = Number(q.size) || CELL;
  if (q.pair) {
    // Rencontre (`?pair=1&wave=1`) : les deux minimoas face à face, habillés ; `wave` : on a salué (check / joie).
    return (
      <View style={{ flex: 1, backgroundColor: color.night, padding: 14, paddingTop: 60 }}>
        <EncounterStage
          onBack={() => undefined}
          backLabel="Retour"
          compat="91 %"
          me={{ pet: { species, name: 'Momo', outfit: { head: q.hat ?? 'bob' } }, label: 'toi' }}
          them={{ pet: { species: species === 'pia' ? 'gaston' : 'pia', name: 'Lulu', outfit: { body: 'echarpe' } }, label: 'Léa' }}
          saysLabel="ce qu’ils se sont dit"
          text="Rien sans ton tap."
          waveKey={q.wave ? 1 : 0}
        />
      </View>
    );
  }
  if (q.stage) {
    // Scène de l'accueil seule (`?stage=1&shape=boude&hat=bob`) : boude, nuit (heure du système), tenue.
    return (
      <View style={{ flex: 1, backgroundColor: color.night, padding: 14, paddingTop: 60 }}>
        <PetStage
          pet={{ species, name: 'Momo', outfit: q.hat ? { head: q.hat } : undefined, id: 'dev' }}
          shape={q.shape === 'boude' ? 'boude' : 'en_forme'}
          shapeLabel={q.shape === 'boude' ? 'Il boude' : 'En pleine forme'}
          speech={q.shape === 'boude' ? 'Tu m’as oublié…' : 'On sort ce soir ?'}
        />
      </View>
    );
  }
  return (
    <ScrollView style={{ backgroundColor: color.night }} contentContainerStyle={{ padding: 8 }}>
      <Text size={13}>{`${species} · ${POSES.join(' · ')}`}</Text>
      {ITEMS.filter((o) => !q.items || q.items.split(',').some((id) => Object.values(o).includes(id))).map((outfit) => (
        <View key={Object.values(outfit).join()} style={{ flexDirection: 'row' }}>
          {POSES.map((pose) => (
            <View key={pose} style={{ width: cell, height: cell / 0.9, margin: 2, borderRadius: 10, backgroundColor: color.panel }}>
              <DressedPet species={species} outfit={outfit} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
