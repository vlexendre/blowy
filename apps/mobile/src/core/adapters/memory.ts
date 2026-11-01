/** Adaptateurs en mémoire, purs (tests Vitest, prévisualisations). */
import type { SecretStoragePort, StoragePort } from '../ports/storage';

export function createMemoryStorage(seed: Record<string, string> = {}): StoragePort & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(seed));
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => void m.set(k, v),
    removeItem: async (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

export function createMemorySecretStorage(): SecretStoragePort {
  const m = new Map<string, string>();
  return { get: async (k) => m.get(k) ?? null, set: async (k, v) => void m.set(k, v), remove: async (k) => void m.delete(k) };
}
