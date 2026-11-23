import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Dernière ouverture de l'accueil (mémoire de l'appareil) : décide du petit moment joué à l'ouverture. */
export const useHomeVisit = create<{ last: number | null; mark: (at: number) => void }>()(
  persist((set) => ({ last: null, mark: (at) => set({ last: at }) }), { name: 'blowy.home-visit', storage: createJSONStorage(() => AsyncStorage) }),
);
