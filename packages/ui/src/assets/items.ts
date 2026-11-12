/**
 * Registre typé des objets de la garde-robe (packages/ui/assets/items/*.webp, détourés, tailles variées).
 * Metro exige des chemins littéraux : chaque `require` est écrit en dur, dans l'ordre de `ITEMS` (@blowy/domain).
 * Un objet ajouté au domaine doit aussi l'être ici et dans `fit.json` (sinon il n'est simplement pas dessiné).
 */
import type { Src } from './pets';

const ITEM_IMAGES = {
  bob: require('../../assets/items/bob.webp'),
  casquette: require('../../assets/items/casquette.webp'),
  bonnet: require('../../assets/items/bonnet.webp'),
  chapeau_fete: require('../../assets/items/chapeau_fete.webp'),
  casquette_envers: require('../../assets/items/casquette_envers.webp'),
  noeud: require('../../assets/items/noeud.webp'),
  antennes: require('../../assets/items/antennes.webp'),
  toque: require('../../assets/items/toque.webp'),
  fleurs: require('../../assets/items/fleurs.webp'),
  chat: require('../../assets/items/chat.webp'),
  lapin: require('../../assets/items/lapin.webp'),
  casque_audio: require('../../assets/items/casque_audio.webp'),
  sorcier: require('../../assets/items/sorcier.webp'),
  couronne: require('../../assets/items/couronne.webp'),
  aureole: require('../../assets/items/aureole.webp'),
  cornes: require('../../assets/items/cornes.webp'),
  pirate: require('../../assets/items/pirate.webp'),
  lunettes_rondes: require('../../assets/items/lunettes_rondes.webp'),
  joues_roses: require('../../assets/items/joues_roses.webp'),
  taches_rousseur: require('../../assets/items/taches_rousseur.webp'),
  pansement: require('../../assets/items/pansement.webp'),
  nez_rouge: require('../../assets/items/nez_rouge.webp'),
  moustache: require('../../assets/items/moustache.webp'),
  masque_nuit: require('../../assets/items/masque_nuit.webp'),
  lunettes_coeur: require('../../assets/items/lunettes_coeur.webp'),
  lunettes_etoile: require('../../assets/items/lunettes_etoile.webp'),
  tetine: require('../../assets/items/tetine.webp'),
  monocle: require('../../assets/items/monocle.webp'),
  etincelles: require('../../assets/items/etincelles.webp'),
  lunettes_pixel: require('../../assets/items/lunettes_pixel.webp'),
  cache_oeil: require('../../assets/items/cache_oeil.webp'),
  echarpe: require('../../assets/items/echarpe.webp'),
  bandana: require('../../assets/items/bandana.webp'),
  noeud_violet: require('../../assets/items/noeud_violet.webp'),
  noeud_pap: require('../../assets/items/noeud_pap.webp'),
  sac_a_dos: require('../../assets/items/sac_a_dos.webp'),
  salopette: require('../../assets/items/salopette.webp'),
  sweat: require('../../assets/items/sweat.webp'),
  bretelles: require('../../assets/items/bretelles.webp'),
  tablier: require('../../assets/items/tablier.webp'),
  collier_perles: require('../../assets/items/collier_perles.webp'),
  collier_coquillage: require('../../assets/items/collier_coquillage.webp'),
  sac_main: require('../../assets/items/sac_main.webp'),
  cape: require('../../assets/items/cape.webp'),
  teddy: require('../../assets/items/teddy.webp'),
  tutu: require('../../assets/items/tutu.webp'),
  chaine_or: require('../../assets/items/chaine_or.webp'),
  ailes: require('../../assets/items/ailes.webp'),
  ballon: require('../../assets/items/ballon.webp'),
  doudou: require('../../assets/items/doudou.webp'),
  coeur: require('../../assets/items/coeur.webp'),
  tasse: require('../../assets/items/tasse.webp'),
  livre: require('../../assets/items/livre.webp'),
  bulle: require('../../assets/items/bulle.webp'),
  fleur: require('../../assets/items/fleur.webp'),
  ballons: require('../../assets/items/ballons.webp'),
  gateau: require('../../assets/items/gateau.webp'),
  cadeau: require('../../assets/items/cadeau.webp'),
  pinceau: require('../../assets/items/pinceau.webp'),
  micro: require('../../assets/items/micro.webp'),
  manette: require('../../assets/items/manette.webp'),
  skate: require('../../assets/items/skate.webp'),
  baguette: require('../../assets/items/baguette.webp'),
  potion: require('../../assets/items/potion.webp'),
} as const satisfies Record<string, Src>;

/** Identifiant d'objet connu du registre (les 64 de `ITEM_IDS`). */
export type ItemId = keyof typeof ITEM_IMAGES;

export const hasItemImage = (id: string): id is ItemId => Object.prototype.hasOwnProperty.call(ITEM_IMAGES, id);

/** Image détourée d'un objet ; `undefined` pour un identifiant inconnu. */
export function itemImage(id: string): Src | undefined {
  return hasItemImage(id) ? ITEM_IMAGES[id] : undefined;
}
