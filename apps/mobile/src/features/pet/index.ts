import type { OutfitDto, Wardrobe } from '@blowy/contract';
import type { CareAction, ItemSlot } from '@blowy/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi } from '@/core';

export function usePet() {
  const api = useApi();
  return useQuery({ queryKey: keys.pet, queryFn: api.pet.get });
}

export function useRenamePet() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.pet.rename(name),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

export function useAnswerChallenge() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (choice: 0 | 1) => api.pet.answerChallenge(choice),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
    },
  });
}

/** S'occuper du pet : nourrir, jouer, sieste, câlin. Le résultat porte les objets tout juste débloqués. */
export function useCare() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: CareAction) => api.pet.care(action),
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
      void qc.invalidateQueries({ queryKey: keys.encounters });
      if (view.newItems.length > 0) void qc.invalidateQueries({ queryKey: keys.wardrobe });
    },
  });
}

export function useWardrobe() {
  const api = useApi();
  return useQuery({ queryKey: keys.wardrobe, queryFn: api.pet.wardrobe });
}

/** Change la tenue : la garde-robe est mise à jour tout de suite, puis confirmée par l'API. */
export function useSetOutfit() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (outfit: OutfitDto) => api.pet.setOutfit(outfit),
    onMutate: async (outfit) => {
      await qc.cancelQueries({ queryKey: keys.wardrobe });
      const before = qc.getQueryData<Wardrobe>(keys.wardrobe);
      if (before) qc.setQueryData<Wardrobe>(keys.wardrobe, { ...before, outfit });
      return { before };
    },
    onError: (_error, _outfit, context) => {
      if (context?.before) qc.setQueryData(keys.wardrobe, context.before);
    },
    onSuccess: (view) => {
      qc.setQueryData(keys.pet, view);
      void qc.invalidateQueries({ queryKey: keys.me });
      void qc.invalidateQueries({ queryKey: keys.links });
    },
  });
}

/** Tenue avec un objet posé ou retiré dans un emplacement. */
export function withItem(outfit: OutfitDto, slot: ItemSlot, id: string | null): OutfitDto {
  const next: OutfitDto = { ...outfit };
  if (id === null || next[slot] === id) delete next[slot];
  else next[slot] = id;
  return next;
}
