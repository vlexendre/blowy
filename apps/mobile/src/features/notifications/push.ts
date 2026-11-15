/**
 * Notifications push (iPhone, Android) avec expo-notifications. Le web a sa version vide (`push.web.ts`).
 * Rien ici ne lève : une notification qui ne marche pas ne doit jamais casser l'app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

const TOKEN_KEY = 'blowy.push.token';

/** Une notification arrivée app ouverte s'affiche quand même (bandeau et centre de notifications). */
export function setForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

const fromStatus = (p: Notifications.NotificationPermissionsStatus): PushPermission => {
  const ios = p.ios?.status;
  if (ios !== undefined) {
    if (ios === Notifications.IosAuthorizationStatus.AUTHORIZED || ios === Notifications.IosAuthorizationStatus.PROVISIONAL || ios === Notifications.IosAuthorizationStatus.EPHEMERAL) return 'granted';
    if (ios === Notifications.IosAuthorizationStatus.NOT_DETERMINED) return 'undetermined';
    return 'denied';
  }
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
};

export async function getPermission(): Promise<PushPermission> {
  try {
    return fromStatus(await Notifications.getPermissionsAsync());
  } catch {
    return 'unsupported';
  }
}

export async function requestPermission(): Promise<PushPermission> {
  try {
    return fromStatus(await Notifications.requestPermissionsAsync());
  } catch {
    return 'unsupported';
  }
}

const projectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
};

/** Jeton Expo de l'appareil (null : pas d'accord, simulateur, Expo Go Android, réseau). Gardé pour la déconnexion. */
export async function getPushToken(): Promise<string | null> {
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    await AsyncStorage.setItem(TOKEN_KEY, data);
    return data;
  } catch {
    return null;
  }
}

/** Dernier jeton envoyé à l'API (pour le retirer à la déconnexion). */
export async function storedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function forgetPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // rien
  }
}

export const pushPlatform = (): 'ios' | 'android' | null => (Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null);

/** Données d'une notification touchée (le `data` du push), ou null. */
type Tap = { data: unknown; id: string };

/** Notification touchée qui a ouvert l'app (démarrage à froid), une seule fois. */
export async function takeLaunchTap(): Promise<Tap | null> {
  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (!last) return null;
    await Notifications.clearLastNotificationResponseAsync();
    return { data: last.notification.request.content.data, id: last.notification.request.identifier };
  } catch {
    return null;
  }
}

/** Notifications touchées pendant que l'app tourne. */
export function onTap(listener: (tap: Tap) => void): () => void {
  try {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => listener({ data: r.notification.request.content.data, id: r.notification.request.identifier }));
    return () => sub.remove();
  } catch {
    return () => undefined;
  }
}
