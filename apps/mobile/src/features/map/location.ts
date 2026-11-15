/**
 * Position du téléphone (expo-location), app ouverte seulement : jamais en arrière-plan.
 * Sur le web, expo-location passe par la géolocalisation du navigateur.
 */
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

/** granted · undetermined (jamais demandé) · denied (refusé ; `canAskAgain` faux : il faut passer par les Réglages). */
export interface LocationPermission {
  status: 'granted' | 'undetermined' | 'denied';
  canAskAgain: boolean;
}

const toPermission = (r: Location.LocationPermissionResponse): LocationPermission => ({
  status: r.status === Location.PermissionStatus.GRANTED ? 'granted' : r.status === Location.PermissionStatus.UNDETERMINED ? 'undetermined' : 'denied',
  canAskAgain: r.canAskAgain,
});

export async function readLocationPermission(): Promise<LocationPermission> {
  try {
    return toPermission(await Location.getForegroundPermissionsAsync());
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

export async function askLocationPermission(): Promise<LocationPermission> {
  try {
    return toPermission(await Location.requestForegroundPermissionsAsync());
  } catch {
    return { status: 'denied', canAskAgain: false };
  }
}

/** Position actuelle, précision moyenne (le serveur l'arrondit à ~300 m de toute façon). Null en cas d'échec. */
export async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 });
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Ouvre les réglages de l'app (iPhone, Android). Sur le web : rien (c'est le navigateur qui décide). */
export function openAppSettings(): void {
  if (Platform.OS === 'web') return;
  void Linking.openSettings();
}
