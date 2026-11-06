import type { CreateReportRequest, SafetySubject } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createSafetyRepository } from './safety.repository';

export const safetyKeys = {
  status: (s: SafetySubject) => ['safety', s.kind, s.id] as const,
  links: (s: SafetySubject) => ['safety', s.kind, s.id, 'links'] as const,
};

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createSafetyRepository(api), [api]);
}

export function useSafetyStatus(s: SafetySubject | null) {
  const repo = useRepo();
  const on = useSession((x) => x.status === 'signedIn');
  return useQuery({
    queryKey: s ? safetyKeys.status(s) : ['safety', 'none'],
    queryFn: () => repo.status(s!),
    enabled: on && !!s,
  });
}
export function useGuardianLinks(s: SafetySubject | null) {
  const repo = useRepo();
  const on = useSession((x) => x.status === 'signedIn');
  return useQuery({
    queryKey: s ? safetyKeys.links(s) : ['safety', 'none', 'links'],
    queryFn: () => repo.links(s!),
    enabled: on && !!s,
  });
}
export function useCreateGuardianLink(s: SafetySubject | null) {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label?: string) => repo.createLink(s!, label, newCommandId()),
    onSuccess: () => s && void qc.invalidateQueries({ queryKey: safetyKeys.status(s) }),
  });
}
export function useSafetyOk(s: SafetySubject | null) {
  const repo = useRepo();
  const { newCommandId } = useServices();
  return useMutation({ mutationFn: () => repo.ok(s!, newCommandId()) });
}
export function useRaiseAlert(s: SafetySubject | null) {
  const repo = useRepo();
  const { newCommandId } = useServices();
  return useMutation({ mutationFn: () => repo.alert(s!, newCommandId()) });
}
export function useUneasyLeave(s: SafetySubject | null) {
  const repo = useRepo();
  const { newCommandId } = useServices();
  return useMutation({
    mutationFn: (notifyGuardian: boolean) => repo.leave(s!, notifyGuardian, newCommandId()),
  });
}
export function useReport() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  return useMutation({
    mutationFn: (body: CreateReportRequest) => repo.report(body, newCommandId()),
  });
}
