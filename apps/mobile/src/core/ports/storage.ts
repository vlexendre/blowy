/** Stockage persistant non secret (onboarding, file hors ligne, cache). */
export interface StoragePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Stockage chiffré (jetons de session) — Keychain/Keystore via SecureStore. */
export interface SecretStoragePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
