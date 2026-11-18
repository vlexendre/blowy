/**
 * Planche de contrôle de l'habillage (route : /dev/fit?species=nino) : 6 poses du pack × 12 objets représentatifs,
 * rendus comme dans l'app (`DressedPet`). Sert à vérifier à l'œil que chaque objet a l'air porté, pose par pose.
 * `?winter=1` : la collection Hiver (Minimoa+) sur les 4 espèces, six tenues (`&pose=` pour une autre pose).
 * `?sheet=2&species=pia` : les 12 poses de la planche 2 (ou `?sheet=var` : les variantes), nues puis habillées (deux tenues).
 * `?items=bob,cape` : seulement ces objets ; `?size=240` : cases plus grandes ; `?flat=1` : rendu simple (sans ombre, voile ni fourrure), pour comparer.
 * `?board=hiver_echarpe` : banc d'un objet, 4 espèces × 7 poses représentatives en grand, puis la même chose à 68 pt
 * (taille de la vitrine Minimoa+) ; `?bare=1` : sans l'objet (référence) ; `&poses=joie,danse` : d'autres poses.
 */
import { itemById, type Outfit, type Species } from '@blowy/domain';
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
/** Banc d'un objet : poses représentatives (neutre, joie, fier, coucou, marche, assis, danse). */
const BOARD_POSES: BodyPose[] = ['neutre', 'joie', 'fier', 'coucou', 'marche', 'assis', 'danse'];
const SPECIES: Species[] = ['nino', 'suzie', 'gaston', 'pia'];
/** Taille des minimoas dans la vitrine Minimoa+. */
const SMALL = 68;
const FACES = ['lunettes_rondes', 'lunettes_coeur', 'lunettes_etoile', 'lunettes_pixel', 'masque_nuit', 'monocle', 'cache_oeil', 'moustache', 'nez_rouge', 'tetine', 'joues_roses', 'taches_rousseur'];
const CLOTHES = ['sweat', 'teddy', 'salopette', 'tablier', 'tutu', 'bretelles'];
const HELD = ['doudou', 'ballon', 'coeur', 'tasse', 'livre', 'fleur', 'ballons', 'gateau', 'cadeau', 'pinceau', 'micro', 'manette'];
const NECK = ['echarpe', 'bandana', 'collier_perles', 'collier_coquillage', 'chaine_or', 'noeud_pap', 'noeud_violet', 'noeud', 'casque_audio', 'cape', 'sac_a_dos', 'ailes'];
const HATS = ['bob', 'bonnet', 'casquette', 'casquette_envers', 'toque', 'sorcier', 'couronne', 'pirate', 'chapeau_fete', 'fleurs', 'chat', 'lapin'];
const SHEET2: BodyPose[] = ['colere', 'malade', 'timide', 'fier', 'rit', 'danse', 'accueil', 'assis', 'baille', 'bain', 'applaudit', 'fete'];
const SHEET_VAR: BodyPose[] = ['neutre', 'evo_sociable', 'evo_joueur', 'evo_casanier', 'evo_tendre', 'evo_piquant', 'bebe', 'oeuf', 'oeuf_fele', 'eclosion', 'fantome', 'danger'];
/** Planche des poses : nu, puis deux tenues complètes (couvre-chef, lunettes, et l'écharpe ou le sweat). */
const SHEET_OUTFITS: (Outfit | null)[] = [null, { head: 'bob', face: 'lunettes_rondes', body: 'echarpe' }, { head: 'casquette', face: 'lunettes_etoile', body: 'sweat' }];
const WINTER: Outfit[] = [
  { head: 'hiver_bonnet', face: 'hiver_lunettes', body: 'hiver_echarpe', toy: 'hiver_aura' },
  { head: 'hiver_couronne', body: 'hiver_cape', toy: 'hiver_chocolat' },
  { head: 'hiver_cache_oreilles', body: 'hiver_echarpe', toy: 'hiver_moufles' },
  { head: 'hiver_bonnet', toy: 'hiver_boule_neige' },
  { head: 'hiver_couronne', face: 'hiver_lunettes', toy: 'hiver_sapin' },
  { head: 'hiver_cache_oreilles', body: 'hiver_cape', toy: 'hiver_bonhomme' },
];
/** Fond de la planche de référence (comparaison à l'œil). */
const HAT_BG = color.panel;

export default function FitBoard() {
  const q = useLocalSearchParams<{ species?: string; flat?: string; size?: string; items?: string; stage?: string; shape?: string; hat?: string; pair?: string; wave?: string; hats?: string; faces?: string; neck?: string; clothes?: string; held?: string; pose?: string; sheet?: string; winter?: string; board?: string; bare?: string; poses?: string }>();
  const species = (['nino', 'suzie', 'gaston', 'pia'].includes(q.species ?? '') ? q.species : 'nino') as Species;
  const cell = Number(q.size) || CELL;
  if (q.board) {
    const id = q.board;
    const slot = itemById(id)?.slot ?? 'body';
    const outfit: Outfit | null = q.bare ? null : { [slot]: id };
    const big = Number(q.size) || 200;
    const poses = q.poses ? (q.poses.split(',') as BodyPose[]) : BOARD_POSES;
    return (
      <ScrollView style={{ backgroundColor: color.night }} contentContainerStyle={{ padding: 8, width: (big + 4) * poses.length + 16 }}>
        <Text size={15}>{`${id} · ${poses.join(' · ')}`}</Text>
        {SPECIES.map((sp) => (
          <View key={sp} style={{ flexDirection: 'row' }}>
            {poses.map((pose) => (
              <View key={pose} style={{ width: big, height: big / 0.9 + big * 0.08, margin: 2, borderRadius: 14, backgroundColor: color.panel, justifyContent: 'flex-end' }}>
                <DressedPet species={sp} outfit={outfit} pose={pose} size={big} />
              </View>
            ))}
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {SPECIES.flatMap((sp) =>
            poses.slice(0, 3).map((pose) => (
              <View key={sp + pose} style={{ width: SMALL + 8, height: SMALL / 0.9 + 12, margin: 2, borderRadius: 10, backgroundColor: color.panel, alignItems: 'center', justifyContent: 'flex-end' }}>
                <DressedPet species={sp} outfit={outfit} pose={pose} size={SMALL} />
              </View>
            )),
          )}
        </View>
      </ScrollView>
    );
  }
  if (q.winter) {
    const pose = (q.pose ?? 'neutre') as BodyPose;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * WINTER.length }}>
        {(['nino', 'suzie', 'gaston', 'pia'] as Species[]).flatMap((sp) =>
          WINTER.map((outfit, i) => (
            <View key={`${sp}${i}`} style={{ width: cell, height: cell / 0.9 + cell * 0.12, justifyContent: 'flex-end' }}>
              <DressedPet species={sp} outfit={outfit} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
  if (q.sheet) {
    const poses = q.sheet === 'var' ? SHEET_VAR : SHEET2;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * poses.length }}>
        {SHEET_OUTFITS.flatMap((outfit, i) =>
          poses.map((pose) => (
            <View key={`${i}${pose}`} style={{ width: cell, height: cell / 0.9 }}>
              <DressedPet species={species} outfit={outfit} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
  if (q.faces) {
    // Objets du visage (`?faces=1&pose=neutre`) : 4 espèces × 12, cadrés comme la planche de référence (zone 600×600
    // de la toile à partir de (150, 180)).
    const pose = (q.pose ?? 'neutre') as BodyPose;
    const k = cell / 600;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 12 }}>
        {(['nino', 'suzie', 'gaston', 'pia'] as Species[]).flatMap((sp) =>
          FACES.map((id) => (
            <View key={`${sp}${id}`} style={{ width: cell, height: cell, overflow: 'hidden' }}>
              <DressedPet species={sp} outfit={{ face: id }} pose={pose} size={900 * k} flat={q.flat === '1'} style={{ position: 'absolute', left: -150 * k, top: -180 * k }} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
  if (q.clothes || q.held) {
    // Vêtements (`?clothes=1&pose=boude`) : 4 espèces × 6 ; objets tenus (`?held=1&pose=coucou`) : 4 espèces × 12.
    const pose = (q.pose ?? 'neutre') as BodyPose;
    const ids = q.clothes ? CLOTHES : HELD;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * ids.length }}>
        {(['nino', 'suzie', 'gaston', 'pia'] as Species[]).flatMap((sp) =>
          ids.map((id) => (
            <View key={`${sp}${id}`} style={{ width: cell, height: cell / 0.9 }}>
              <DressedPet species={sp} outfit={q.clothes ? { body: id } : { toy: id }} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
  if (q.neck) {
    // Cou et dos (`?neck=1&pose=neutre`) : 4 espèces × 12, deux calques (avant, arrière) quand l'objet entoure.
    const pose = (q.pose ?? 'neutre') as BodyPose;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 6 }}>
        {(['nino', 'suzie', 'gaston', 'pia'] as Species[]).flatMap((sp) =>
          NECK.map((id) => (
            <View key={`${sp}${id}`} style={{ width: cell, height: cell / 0.9 + cell * 0.1, justifyContent: 'flex-end' }}>
              <DressedPet species={sp} outfit={id === 'casque_audio' || id === 'noeud' ? { head: id } : { body: id }} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
  if (q.hats) {
    // Couvre-chefs (`?hats=1&pose=neutre`) : les 4 espèces × 12, mise en page de la planche de référence (6 colonnes).
    const pose = (q.pose ?? 'neutre') as BodyPose;
    return (
      <ScrollView style={{ backgroundColor: HAT_BG }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 6 }}>
        {(['nino', 'suzie', 'gaston', 'pia'] as Species[]).flatMap((sp) =>
          HATS.map((id) => (
            <View key={`${sp}${id}`} style={{ width: cell, height: cell / 0.9 + cell * 0.15, justifyContent: 'flex-end' }}>
              <DressedPet species={sp} outfit={{ head: id }} pose={pose} size={cell} flat={q.flat === '1'} />
            </View>
          )),
        )}
      </ScrollView>
    );
  }
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
