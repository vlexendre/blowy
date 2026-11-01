/**
 * Store Zustand de la file hors ligne, persistée (StoragePort) à chaque changement.
 * Le runner (runner.ts) consomme la file quand le réseau revient.
 */
import { create } from 'zustand';
import type { StoragePort } from '../ports/storage';
import { emptyQueue, parseQueue, reduceQueue, type QueueEvent, type QueueState } from './queue';

const KEY = 'blowy.offline.queue.v1';

interface OfflineQueueStore extends QueueState {
  hydrated: boolean;
  dispatch(ev: QueueEvent): void;
  hydrate(storage: StoragePort): Promise<void>;
}

let persist: StoragePort | null = null;

export const useOfflineQueue = create<OfflineQueueStore>((set, get) => ({
  ...emptyQueue,
  hydrated: false,
  dispatch(ev) {
    const next = reduceQueue({ items: get().items, hiddenScopes: get().hiddenScopes }, ev);
    set(next);
    void persist?.setItem(KEY, JSON.stringify(next));
  },
  async hydrate(storage) {
    persist = storage;
    const restored = parseQueue(await storage.getItem(KEY));
    set({ ...restored, hydrated: true });
  },
}));

export const queueSnapshot = (): QueueState => {
  const s = useOfflineQueue.getState();
  return { items: s.items, hiddenScopes: s.hiddenScopes };
};
