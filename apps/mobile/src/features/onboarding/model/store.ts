/** Brouillon d'onboarding V5 persistant (repris à la relance ; jamais envoyé avant le compte). */
import { create } from 'zustand';
import type { StoragePort } from '../../../core/ports/storage';
import { initialDraft, type OnboardingDraft } from './flow';

export const ONBOARDING_DRAFT_KEY = 'blowy.onboarding.v5';
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
    void storage?.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(pickDraft(get())));
  },
  async hydrate(s) {
    storage = s;
    let saved: Partial<OnboardingDraft>;
    try {
      const raw = await s.getItem(ONBOARDING_DRAFT_KEY);
      saved = raw ? (JSON.parse(raw) as Partial<OnboardingDraft>) : {};
    } catch {
      saved = {};
    }
    set({ ...initialDraft, ...saved, hydrated: true });
  },
  reset() {
    set({ ...initialDraft });
    void storage?.removeItem(ONBOARDING_DRAFT_KEY);
  },
}));
