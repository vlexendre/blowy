/**
 * Liens profonds reçus avant que le compte soit prêt (démarrage à froid, inscription en cours) : gardés ici, puis
 * ouverts par les onglets dès qu'ils sont montés (`useNotificationsBridge`). L'invitation a son propre chemin
 * (`usePendingInvite`, recopiée dans le brouillon d'inscription).
 */
import { create } from 'zustand';

interface DeepLinkState {
  /** Les onglets sont montés, compte prêt : un lien s'ouvre tout de suite. */
  ready: boolean;
  pending: string | null;
  setReady: (ready: boolean) => void;
  park: (path: string) => void;
  take: () => string | null;
}

export const useDeepLink = create<DeepLinkState>((set, get) => ({
  ready: false,
  pending: null,
  setReady: (ready) => set({ ready }),
  park: (pending) => set({ pending }),
  take: () => {
    const p = get().pending;
    if (p) set({ pending: null });
    return p;
  },
}));
