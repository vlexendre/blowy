import type { ReportBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { keys, useApi } from '@/core';

export function useBlocks() {
  const api = useApi();
  return useQuery({ queryKey: keys.blocks, queryFn: api.safety.blocks });
}

export function useBlock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.block(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.blocks });
      void qc.invalidateQueries({ queryKey: keys.links });
      void qc.invalidateQueries({ queryKey: keys.encounters });
    },
  });
}

export function useUnblock() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.safety.unblock(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.blocks }),
  });
}

export function useReport() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ReportBody) => api.safety.report(body) });
}
