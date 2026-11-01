/** État réseau (NetInfo) exposé en Zustand ; le runner hors ligne se réveille au retour du réseau. */
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkStore {
  online: boolean;
  start(onOnline: () => void): () => void;
}

export const useNetwork = create<NetworkStore>((set, get) => ({
  online: true,
  start(onOnline) {
    return NetInfo.addEventListener((s) => {
      const online = s.isConnected !== false && s.isInternetReachable !== false;
      const was = get().online;
      set({ online });
      if (online && !was) onOnline();
    });
  },
}));

export const isOnlineNow = (): boolean => useNetwork.getState().online;
