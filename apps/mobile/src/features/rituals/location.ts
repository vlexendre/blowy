/**
 * La sortie confirmée par la position (V7 §5) : seulement si l'accès à la position est déjà accordé (on ne le
 * demande jamais ici), une position grossière, comparée à la zone du domicile que l'API a rangée. Rien n'est envoyé :
 * l'app dit seulement « hors de chez moi » avec la réponse.
 */
import type { LocationStatus } from '@blowy/contract';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

type Zone = NonNullable<LocationStatus['zone']>;

const R = 6371;
const rad = (d: number): number => (d * Math.PI) / 180;
/** Distance à vol d'oiseau, en km. */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Vrai / faux si on le sait, `undefined` sinon (pas d'accord, pas de zone, pas de position) : le serveur décide alors seul. */
export async function awayFromHome(zone: Zone | null | undefined): Promise<boolean | undefined> {
  if (!zone) return undefined;
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return undefined;
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 20 * 60_000, requiredAccuracy: 2000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!pos) return undefined;
    return distanceKm(pos.coords, zone.center) > zone.radiusKm;
  } catch {
    return undefined;
  }
}

/**
 * Relevé fait à l'arrivée sur l'écran (sans jamais demander l'accord), gardé pour la réponse : la réponse à
 * « tu as mis le nez dehors ? » part tout de suite, sans attendre la position.
 */
export function useAwayFromHome(zone: Zone | null | undefined): () => boolean | undefined {
  const known = useRef<boolean | undefined>(undefined);
  const lat = zone?.center.latitude;
  const lng = zone?.center.longitude;
  const radius = zone?.radiusKm;
  useFocusEffect(
    useCallback(() => {
      let live = true;
      if (lat === undefined || lng === undefined || radius === undefined) return;
      void awayFromHome({ center: { latitude: lat, longitude: lng }, radiusKm: radius }).then((v) => {
        if (live) known.current = v;
      });
      return () => {
        live = false;
      };
    }, [lat, lng, radius]),
  );
  return () => known.current;
}
