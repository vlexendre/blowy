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
