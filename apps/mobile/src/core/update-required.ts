/**
 * L'API ne sert plus ce build (`426 app_update_required`, docs/VERSIONING.md) : levé par le client de l'API, lu par
 * `features/app-update` qui montre l'écran « Mets à jour Minimoa ». Remis à faux si l'API sert de nouveau ce build.
 */
import { create } from 'zustand';

interface UpdateRequiredState {
  required: boolean;
  set: (required: boolean) => void;
}

export const useUpdateRequired = create<UpdateRequiredState>()((set) => ({
  required: false,
  set: (required) => set({ required }),
}));
