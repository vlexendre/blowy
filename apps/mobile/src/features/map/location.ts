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

/** Une position en cache du téléphone ne sert que si elle est récente et assez précise (sinon : un vrai relevé). */
const CACHE_MAX_AGE_MS = 2 * 60_000;
const CACHE_MAX_ACCURACY_M = 300;
const FIX_TIMEOUT_MS = 10_000;

/**
 * Position actuelle, précision moyenne (le serveur l'arrondit à ~300 m de toute façon). Null en cas d'échec ou si rien
 * en 10 s. Une position en cache vieille ou imprécise (relevé d'antenne, endroit d'avant) n'est jamais prise : c'est
 * elle qui posait la zone à des kilomètres de la personne. Le point ne part que vers notre API.
 */
export async function currentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const cached =
      Platform.OS === 'web' ? null : await Location.getLastKnownPositionAsync({ maxAge: CACHE_MAX_AGE_MS, requiredAccuracy: CACHE_MAX_ACCURACY_M });
    const fresh =
      cached && Date.now() - cached.timestamp <= CACHE_MAX_AGE_MS && (cached.coords.accuracy ?? Infinity) <= CACHE_MAX_ACCURACY_M ? cached : null;
    const pos =
      fresh ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((r) => setTimeout(() => r(null), FIX_TIMEOUT_MS)),
      ]));
    return pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}

/** Ouvre les réglages de l'app (iPhone, Android). Sur le web : rien (c'est le navigateur qui décide). */
export function openAppSettings(): void {
  if (Platform.OS === 'web') return;
  void Linking.openSettings();
}
