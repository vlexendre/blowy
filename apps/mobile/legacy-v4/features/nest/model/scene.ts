/**
 * Modèle de scène du Nid (pur) : décor selon le lieu réel virtuel, présence du partenaire
 * (HERE/OUT uniquement — jamais où ni avec qui), libellés d'accessibilité.
 */
import type { OwnPetView, RelationshipView } from '@blowy/api-contract';
import { SCENES, type SceneId } from '@blowy/sprites';

export interface NestSceneModel {
  scene: SceneId;
  placeKey: 'nest.home' | 'nest.dateSpot' | 'nest.sharedHome';
  /** Le pet du partenaire est-il physiquement dans la scène ? */
  partnerVisible: boolean;
  /** Mon pet est-il ici (sinon : en route / ailleurs) ? */
  meHere: boolean;
}

/** Lieu attitré : la clé serveur `dateSpotKey` (dérivée des dimanches) choisit un décor connu. */
const SPOT_SCENE: Record<string, SceneId> = { PARK: 'PARK', CAFE: 'CAFE', BRUNCH: 'CAFE', MUSEE: 'CAFE', RANDO: 'PARK', CANAPE: 'HOME' };

export function nestScene(pet: Pick<OwnPetView, 'location'> | undefined, rel: Pick<RelationshipView, 'id' | 'otherPresence' | 'myPetHere' | 'dateSpotKey' | 'status'> | null): NestSceneModel {
  if (!rel) return { scene: 'HOME', placeKey: 'nest.home', partnerVisible: false, meHere: true };
  if (rel.status === 'MOVED_IN') return { scene: 'HOME', placeKey: 'nest.sharedHome', partnerVisible: rel.otherPresence === 'HERE', meHere: rel.myPetHere };
  const scene = (rel.dateSpotKey && SPOT_SCENE[rel.dateSpotKey.toUpperCase()]) || 'PARK';
  const atSpot = pet?.location.kind === 'DATE_SPOT' && pet.location.relationshipId === rel.id;
  return { scene, placeKey: 'nest.dateSpot', partnerVisible: rel.otherPresence === 'HERE', meHere: atSpot || rel.myPetHere };
}

export const scenePath = (id: SceneId): string => SCENES[id];
