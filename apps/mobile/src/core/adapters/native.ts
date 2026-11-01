/**
 * Adaptateurs natifs réels (Expo) + équivalents mémoire pour les tests et le web.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Camera from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import type { CameraPermissionPort } from '../ports/camera';
import type { HapticsPort } from '../ports/haptics';
import { blurLocation, type LocationPermission, type LocationPort } from '../ports/location';
import type { NotificationPermission, NotificationsPort } from '../ports/notifications';
import type { SecretStoragePort, StoragePort } from '../ports/storage';

export const asyncStorageAdapter: StoragePort = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

export const secureStoreAdapter: SecretStoragePort = {
  get: (k) => SecureStore.getItemAsync(k),
  set: (k, v) => SecureStore.setItemAsync(k, v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
  remove: (k) => SecureStore.deleteItemAsync(k),
};

const toPerm = (status: string): 'granted' | 'denied' | 'undetermined' => (status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');

export function createExpoNotificationsAdapter(projectId: string | undefined): NotificationsPort {
  return {
    getPermission: async (): Promise<NotificationPermission> => toPerm((await Notifications.getPermissionsAsync()).status),
    requestPermission: async (): Promise<NotificationPermission> => toPerm((await Notifications.requestPermissionsAsync()).status),
    getPushToken: async () => {
      if (!projectId) return null;
      try {
        return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch {
        return null;
      }
    },
    onOpen: (listener) => {
      const sub = Notifications.addNotificationResponseReceivedListener((r) => {
        const url = r.notification.request.content.data?.url;
        if (typeof url === 'string') listener(url);
      });
      return () => sub.remove();
    },
  };
}

export const expoLocationAdapter: LocationPort = {
  getForegroundPermission: async (): Promise<LocationPermission> => toPerm((await Location.getForegroundPermissionsAsync()).status),
  requestForegroundPermission: async (): Promise<LocationPermission> => toPerm((await Location.requestForegroundPermissionsAsync()).status),
  requestBackgroundPermission: async (): Promise<LocationPermission> => toPerm((await Location.requestBackgroundPermissionsAsync()).status),
  getApproximate: async () => {
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    // Floutage AVANT toute utilisation : la position exacte ne quitte jamais l'adaptateur.
    return blurLocation(p.coords.latitude, p.coords.longitude);
  },
};

export const expoHapticsAdapter: HapticsPort = {
  tap: () => void Haptics.selectionAsync().catch(() => undefined),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
};

export const expoCameraAdapter: CameraPermissionPort = {
  request: async () => ((await Camera.Camera.requestCameraPermissionsAsync()).status === 'granted' ? 'granted' : 'denied'),
  openSettings: () => Linking.openSettings(),
};
