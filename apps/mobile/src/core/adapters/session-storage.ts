/**
 * Où la session Supabase (jeton d'accès et de rafraîchissement) est gardée sur le téléphone : le trousseau d'iOS
 * (Keystore sur Android) par expo-secure-store, plus l'AsyncStorage en clair. Lisible après le premier déverrouillage
 * (l'app rafraîchit le jeton au premier plan), jamais copiée sur un autre appareil par une sauvegarde.
 * Une session gardée par une version précédente (AsyncStorage) est déplacée au trousseau à la première lecture.
 * Si le trousseau refuse une valeur (taille, erreur native), on garde l'ancien comportement plutôt que de déconnecter.
 * Sur le web : le stockage du navigateur (pas de trousseau).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
/** Clés acceptées par le trousseau : lettres, chiffres, « . », « - », « _ ». */
const safeKey = (key: string): string => key.replace(/[^\w.-]/g, '_');

export function sessionStorage(): SessionStorage {
  if (Platform.OS === 'web') return AsyncStorage;
  return {
    async getItem(key) {
      try {
        const kept = await SecureStore.getItemAsync(safeKey(key), OPTIONS);
        if (kept !== null) return kept;
      } catch {
        // Trousseau illisible : on regarde l'ancien emplacement.
      }
      const legacy = await AsyncStorage.getItem(key);
      if (legacy === null) return null;
      try {
        await SecureStore.setItemAsync(safeKey(key), legacy, OPTIONS);
        await AsyncStorage.removeItem(key);
      } catch {
        // Le trousseau refuse : la session reste où elle était.
      }
      return legacy;
    },
    async setItem(key, value) {
      try {
        await SecureStore.setItemAsync(safeKey(key), value, OPTIONS);
        await AsyncStorage.removeItem(key);
      } catch {
        // Une ancienne valeur du trousseau ne doit pas passer devant celle-ci.
        await SecureStore.deleteItemAsync(safeKey(key), OPTIONS).catch(() => undefined);
        await AsyncStorage.setItem(key, value);
      }
    },
    async removeItem(key) {
      await Promise.allSettled([SecureStore.deleteItemAsync(safeKey(key), OPTIONS), AsyncStorage.removeItem(key)]);
    },
  };
}
