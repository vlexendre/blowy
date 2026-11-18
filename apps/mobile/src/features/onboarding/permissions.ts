/**
 * Position lue à la création du compte, seulement si l'accord est déjà donné (rien n'est demandé ici).
 * Les demandes d'autorisation se font au moment où elles servent, après un écran ou une carte qui explique :
 * position sur la carte d'accueil (`features/map`), notifications sur l'écran `/pet/notifications`
 * (`features/notifications`), appareil photo et photothèque au moment de la photo.
 */
import type { LatLng } from '@blowy/contract';

import { currentPosition } from '@/features/map/location';

/** Point du moment (précision moyenne : l'API arrondit à ~300 m), jamais une position en cache vieille. Null si rien en 10 s. */
export async function readPosition(): Promise<LatLng | null> {
  return currentPosition();
}
