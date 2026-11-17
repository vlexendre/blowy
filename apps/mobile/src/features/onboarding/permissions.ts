/**
 * Demandes d'autorisation de l'inscription (position, notifications), toujours après un écran qui explique pourquoi.
 * Sur le web : position par le navigateur, pas de notifications (`unavailable`). Rien ne bloque l'inscription :
 * un refus est noté, et l'app dit ce qui manque.
 */
import type { LatLng } from '@blowy/contract';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { currentPosition } from '@/features/map/location';

import type { PermissionAnswer } from './index';

/** Demande la position « app ouverte seulement » (jamais en arrière-plan). */
export async function askLocation(): Promise<PermissionAnswer> {
  try {
    const res = await Location.requestForegroundPermissionsAsync();
    return res.granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Point du moment (précision moyenne : l'API arrondit à ~300 m), jamais une position en cache vieille. Null si rien en 10 s. */
export async function readPosition(): Promise<LatLng | null> {
  return currentPosition();
}

/** Demande d'envoyer des notifications (alerte, son, pastille). */
export async function askNotifications(): Promise<PermissionAnswer> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const res = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: true } });
    return res.granted || res.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** Jeton Expo de l'appareil si les notifications sont permises (sinon null, sans rien demander). */
export async function pushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return null;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  } catch {
    return null;
  }
}
