/**
 * Groupes (spéc. §26) et « la tenir ensemble » : lectures et actions de `api.groups`. Le cache est rangé sous
 * `keys.groups` (liste, détail, messages) ; chaque action range le groupe à jour et ses nouveaux messages.
 */
import type { CreateGroupBody, GroupAction, GroupDetail, GroupMessage, GroupMessagesPage, GroupReportBody, Groups, Together } from '@blowy/contract';
import { type InfiniteData, type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { keys, useApi } from '@/core';

export function useGroups() {
  const api = useApi();
  return useQuery({ queryKey: keys.groups, queryFn: api.groups.list, staleTime: 15_000 });
}

export function useGroup(id: string) {
  const api = useApi();
  return useQuery({ queryKey: keys.group(id), queryFn: () => api.groups.get(id) });
}

type Pages = InfiniteData<GroupMessagesPage, string | undefined>;

/** Messages d'un groupe, du plus ancien au plus récent (ordre attendu par `ChatThread`). */
export function useGroupMessages(id: string, enabled = true) {
  const api = useApi();
  const query = useInfiniteQuery({
    queryKey: keys.groupMessages(id),
    queryFn: ({ pageParam }) => api.groups.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
    enabled,
  });
  const seen = new Set<string>();
  const messages: GroupMessage[] = [];
  // Pages : la plus récente d'abord ; chaque page est dans l'ordre chronologique.
  const pages = query.data?.pages ?? [];
  for (let p = pages.length - 1; p >= 0; p--) {
    for (const m of pages[p]?.messages ?? []) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        messages.push(m);
      }
    }
  }
  return { ...query, messages };
}

/** Range une action : groupe à jour (détail et liste) et nouveaux messages en fin de la page la plus récente. */
function applyAction(qc: QueryClient, id: string, action: GroupAction): void {
  setDetail(qc, action.group);
  qc.setQueryData<Pages>(keys.groupMessages(id), (data) => {
    if (!data) return data;
    const [first, ...rest] = data.pages;
    if (!first) return data;
    const known = new Set(first.messages.map((m) => m.id));
    const fresh = action.messages.filter((m) => !known.has(m.id));
    return { ...data, pages: [{ ...first, messages: [...first.messages, ...fresh] }, ...rest] };
  });
}

function setDetail(qc: QueryClient, group: GroupDetail): void {
  qc.setQueryData(keys.group(group.id), group);
  qc.setQueryData<Groups>(keys.groups, (list) => {
    if (!list) return list;
    const { members: _m, invited: _i, seatsLeft: _s, week: _w, jokers: _j, canWake: _c, transparency: _t, privacy: _p, ...summary } = group;
    const known = list.groups.some((g) => g.id === group.id);
    return { ...list, groups: known ? list.groups.map((g) => (g.id === group.id ? summary : g)) : [summary, ...list.groups] };
  });
}

/** Envoi d'un message ; jamais relancé tout seul (refus du filtre : le texte reste dans le champ). */
export function useSendGroupMessage(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ retry: false, mutationFn: (body: string) => api.groups.send(id, body), onSuccess: (a) => applyAction(qc, id, a) });
}

/** Marque le groupe comme lu à l'ouverture et à chaque nouveau message. */
export function useMarkGroupRead(id: string, newestMessageId: string | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  useEffect(() => {
    if (!newestMessageId) return;
    void api.groups
      .read(id)
      .then(() => qc.setQueryData<Groups>(keys.groups, (list) => list && { ...list, groups: list.groups.map((g) => (g.id === id ? { ...g, unread: 0 } : g)) }))
      .catch(() => undefined);
  }, [api, id, newestMessageId, qc]);
}

export function useCreateGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => api.groups.create(body),
    onSuccess: (g) => {
      setDetail(qc, g);
      void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
    },
  });
}

export function useAcceptGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.groups.accept(id),
    onSuccess: (g) => {
      setDetail(qc, g);
      void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
      // Accepter un groupe d'habitude peut ajouter l'habitude.
      void qc.invalidateQueries({ queryKey: ['rituals', 'habits'] });
    },
  });
}

export function useDeclineGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.groups.decline(id),
    onSuccess: (_ok, id) => qc.setQueryData<Groups>(keys.groups, (list) => list && { ...list, invitations: list.invitations.filter((i) => i.groupId !== id) }),
  });
}

export function useLeaveGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.groups.leave(id),
    onSuccess: (_ok, id) => {
      qc.setQueryData<Groups>(keys.groups, (list) => list && { ...list, groups: list.groups.filter((g) => g.id !== id) });
      qc.removeQueries({ queryKey: keys.group(id) });
      void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
    },
  });
}

export function useWakeGroup(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.groups.wake(id), onSuccess: (a) => applyAction(qc, id, a) });
}

export function useGroupJoker(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => api.groups.joker(id, day),
    onSuccess: (a) => {
      applyAction(qc, id, a);
      // Le joker vient de la même réserve que la série du défi : un autre groupe du même jour est couvert aussi.
      void qc.invalidateQueries({ queryKey: keys.groups });
      void qc.invalidateQueries({ queryKey: keys.ritualsStreak });
    },
  });
}

export function useRenameGroup(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (name: string) => api.groups.rename(id, name), onSuccess: (a) => applyAction(qc, id, a) });
}

export function useReportGroup(id: string) {
  const api = useApi();
  return useMutation({ mutationFn: (body: GroupReportBody) => api.groups.report(id, body) });
}

// ── « La tenir ensemble » ─────────────────────────────────────────────────────

export function useTogether(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: keys.together, queryFn: api.groups.together, staleTime: 5 * 60_000, enabled });
}

export function useProposeTogether() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => api.groups.proposeTogether(habitId),
    onSuccess: (r, habitId) => {
      qc.setQueryData<Together>(keys.together, (t) => t && { suggestions: t.suggestions.map((s) => (s.habitId === habitId ? { ...s, proposed: true } : s)) });
      if (r.status === 'started') void qc.invalidateQueries({ queryKey: keys.groups });
    },
  });
}

export function useWithdrawTogether() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => api.groups.withdrawTogether(habitId),
    onSuccess: (_ok, habitId) =>
      qc.setQueryData<Together>(keys.together, (t) => t && { suggestions: t.suggestions.map((s) => (s.habitId === habitId ? { ...s, proposed: false } : s)) }),
  });
}

/** Les groupes et invitations, du plus actif au moins actif (dernier message, sinon création). */
export const sortGroups = <T extends { lastMessage: { at: string } | null; createdAt: string }>(groups: readonly T[]): T[] =>
  [...groups].sort((a, b) => (b.lastMessage?.at ?? b.createdAt).localeCompare(a.lastMessage?.at ?? a.createdAt));
export { GroupReportSheet, type GroupReportTarget } from './sheets';
export { rigourView, sharedHabitsView } from './rigour';
