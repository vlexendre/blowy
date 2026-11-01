/** Brouillon d'onboarding persistant (repris à la relance de l'app). */
import { create } from 'zustand';
import type { StoragePort } from '../../../core/ports/storage';
import { initialDraft, type OnboardingDraft } from './flow';

const KEY = 'blowy.onboarding.draft.v1';
let storage: StoragePort | null = null;

interface OnboardingStore extends OnboardingDraft {
  hydrated: boolean;
  patch(p: Partial<OnboardingDraft>): void;
  hydrate(s: StoragePort): Promise<void>;
  reset(): void;
}

const pickDraft = (s: OnboardingStore): OnboardingDraft => {
  const { hydrated: _h, patch: _p, hydrate: _hy, reset: _r, ...d } = s;
  return d;
};

export const useOnboarding = create<OnboardingStore>((set, get) => ({
  ...initialDraft,
  hydrated: false,
  patch(p) {
    set(p);
    void storage?.setItem(KEY, JSON.stringify(pickDraft(get())));
  },
  async hydrate(s) {
    storage = s;
    const raw = await s.getItem(KEY);
    let saved: Partial<OnboardingDraft>;
    try {
      saved = raw ? (JSON.parse(raw) as Partial<OnboardingDraft>) : {};
    } catch {
      saved = {};
    }
    set({ ...initialDraft, ...saved, hydrated: true });
  },
  reset() {
    set({ ...initialDraft });
    void storage?.removeItem(KEY);
  },
}));
