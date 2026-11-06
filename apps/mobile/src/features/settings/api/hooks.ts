import type { UpdateNotificationSettingsRequest } from '@blowy/api-contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { createSettingsRepository } from './settings.repository';

export const settingsKeys = { notifications: ['settings', 'notifications'] as const, avoidance: ['settings', 'contact-avoidance'] as const };

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createSettingsRepository(api), [api]);
}

export function useNotificationSettings() {
  const repo = useRepo();
  return useQuery({ queryKey: settingsKeys.notifications, queryFn: repo.notifications, enabled: useSession((s) => s.status === 'signedIn') });
}

export function useUpdateNotificationSettings() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateNotificationSettingsRequest) => repo.putNotifications(newCommandId(), body),
    onSuccess: (v) => qc.setQueryData(settingsKeys.notifications, v),
  });
}

/** Statut « éviter les personnes que je connais » (`askBeforeFirstOuting` pilote l'onboarding). */
export function useContactAvoidance() {
  const repo = useRepo();
  return useQuery({ queryKey: settingsKeys.avoidance, queryFn: repo.avoidance, enabled: useSession((s) => s.status === 'signedIn'), retry: false });
}

export function useDeclineContactAvoidance() {
  const repo = useRepo();
  const { newCommandId } = useServices();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => repo.declineAvoidance(newCommandId()), onSuccess: (v) => qc.setQueryData(settingsKeys.avoidance, v) });
}
