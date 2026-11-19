/**
 * Groupes (spéc. §26) et « la tenir ensemble » : lectures et actions de `api.groups`. Le cache est rangé sous
 * `keys.groups` (liste, détail, messages) ; chaque action range le groupe à jour et ses nouveaux messages.
 */
import type { CreateGroupBody, GroupAction, GroupDetail, GroupMessage, GroupMessagesPage, GroupReportBody, Groups, Together } from '@blowy/contract';
import { type InfiniteData, type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageLook } from '@blowy/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { groupUrl, keys, useApi } from '@/core';
import { type ChatTransport, useOutbox, useThreadLooks } from '@/features/chat';
import { useTrackShare } from '@/features/growth';
import { useCopyShare } from '@/features/me';
import { croissance } from '@/locales/croissance';

/**
 * Groupes : retirés de l'interface V1 (Ton chemin, docs/CHEMIN.md). Rien n'est supprimé (écrans, liens profonds
 * `blowy://groupe/<id>`, serveur) ; passer à `true` les fait revenir dans les chats et la pastille de l'onglet.
 */
export const GROUPS_IN_V1 = false;

export function useGroups() {
  const api = useApi();
  return useQuery({ queryKey: keys.groups, queryFn: api.groups.list, staleTime: 15_000 });
}

export function useGroup(id: string) {
  const api = useApi();
  return useQuery({ queryKey: keys.group(id), queryFn: () => api.groups.get(id) });
}

/** Les messages des pages (la plus récente d'abord, chacune chronologique), du plus ancien au plus récent, sans doublon. */
export function flattenGroupMessages(pages: readonly GroupMessagesPage[] | undefined): GroupMessage[] {
  const seen = new Set<string>();
  const messages: GroupMessage[] = [];
  const list = pages ?? [];
  for (let p = list.length - 1; p >= 0; p--) {
    for (const m of list[p]?.messages ?? []) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        messages.push(m);
      }
    }
  }
  return messages;
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
  const pages = query.data?.pages;
  // Même tableau tant que rien ne change : le fil ne se redessine pas pour rien.
  const messages = useMemo(() => flattenGroupMessages(pages), [pages]);
  return { ...query, messages };
}

/** Range une action : groupe à jour (détail et liste) et nouveaux messages en fin de la page la plus récente. */
function applyAction(qc: QueryClient, id: string, action: GroupAction): void {
  setDetail(qc, action.group);
  qc.setQueryData<Pages>(keys.groupMessages(id), (data) => {
    if (!data) return data;
    const [first, ...rest] = data.pages;
    if (!first) return data;
    // Le temps réel a pu relire le fil avant la réponse : un message déjà là (dans n'importe quelle page) n'est pas remis.
    const known = new Set(data.pages.flatMap((p) => p.messages.map((m) => m.id)));
    const fresh = action.messages.filter((m) => !known.has(m.id));
    if (fresh.length === 0) return data;
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

/** Un message de groupe tel que `ChatThread` le lit (les minimoas ne parlent que d'événements : lignes centrées). */
export const groupMessageLook = (m: GroupMessage): MessageLook => ({
  id: m.id,
  author: m.author === 'me' ? 'me' : m.author === 'member' ? 'other' : 'system',
  kind: m.kind === 'event' || m.author === 'minimoa' || m.author === 'system' ? 'event' : 'text',
  body: m.body,
  mediaUrl: null,
  at: m.at,
});

const mineInGroup = (m: MessageLook): boolean => m.author === 'me';

/** Le chat d'un groupe, optimiste (même file que les liens : `@/features/chat`). */
export function useGroupChat(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  const thread = useGroupMessages(id);
  const transport = useMemo<ChatTransport<GroupAction>>(
    () => ({
      send: (p) => api.groups.send(id, p.body, p.clientId),
      apply: (action) => applyAction(qc, id, action),
      sentId: (action) => action.messages.find((m) => m.author === 'me')?.id,
    }),
    [api, qc, id],
  );
  const outbox = useOutbox(`group:${id}`, transport);
  const server = useMemo(() => thread.messages.map(groupMessageLook), [thread.messages]);
  const looks = useThreadLooks(`group:${id}`, server, outbox.pending, mineInGroup);
  const { send: enqueue } = outbox;
  const send = useCallback((body: string) => enqueue(body, server), [enqueue, server]);
  return { thread, looks, send, retry: outbox.retry };
}

/** Marque le groupe comme lu à l'ouverture et à chaque nouveau message : la pastille s'éteint tout de suite. */
export function useMarkGroupRead(id: string, newestMessageId: string | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  useEffect(() => {
    if (!newestMessageId) return;
    const unread = qc.getQueryData<Groups>(keys.groups)?.groups.find((g) => g.id === id)?.unread ?? 0;
    if (unread > 0) qc.setQueryData<Groups>(keys.groups, (list) => list && { ...list, groups: list.groups.map((g) => (g.id === id ? { ...g, unread: 0 } : g)) });
    void api.groups.read(id).catch(() => {
      if (unread > 0) void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
    });
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
    // L'invitation part tout de suite ; elle revient si l'API refuse.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.groups, exact: true });
      const before = qc.getQueryData<Groups>(keys.groups);
      qc.setQueryData<Groups>(keys.groups, (list) => list && { ...list, invitations: list.invitations.filter((i) => i.groupId !== id) });
      return { before };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.groups, ctx.before);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.groups, exact: true }),
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
  return useMutation({
    mutationFn: (name: string) => api.groups.rename(id, name),
    // Le nouveau nom s'affiche tout de suite (en-tête et liste) ; l'ancien revient si l'API refuse (filtre, doublon).
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: keys.group(id), exact: true });
      const detail = qc.getQueryData<GroupDetail>(keys.group(id));
      const list = qc.getQueryData<Groups>(keys.groups);
      if (detail) qc.setQueryData<GroupDetail>(keys.group(id), { ...detail, name });
      if (list) qc.setQueryData<Groups>(keys.groups, { ...list, groups: list.groups.map((g) => (g.id === id ? { ...g, name } : g)) });
      return { detail, list };
    },
    onError: (_e, _name, ctx) => {
      if (ctx?.detail) qc.setQueryData(keys.group(id), ctx.detail);
      if (ctx?.list) qc.setQueryData(keys.groups, ctx.list);
    },
    onSuccess: (a) => applyAction(qc, id, a),
  });
}

export function useReportGroup(id: string) {
  const api = useApi();
  return useMutation({ mutationFn: (body: GroupReportBody) => api.groups.report(id, body) });
}

// ── Lien d'invitation (`minimoa.app/g/<code>`, docs/VIRALITE.md) ────────────────

/** Le lien du groupe (créé à la première demande) ; `enabled` : seulement quand on va le partager ou l'afficher. */
export function useGroupLink(id: string, enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: [...keys.group(id), 'link'], queryFn: () => api.groups.link(id), enabled, staleTime: Infinity });
}

export function useResetGroupLink(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.groups.resetLink(id), onSuccess: (link) => qc.setQueryData([...keys.group(id), 'link'], link) });
}

/**
 * « Inviter » : le lien du groupe dans la feuille de partage du téléphone, avec un texte prêt (le nom, l'habitude).
 * Chaque partage est compté (sans contenu).
 */
export function useShareGroupInvite(group: GroupDetail) {
  const api = useApi();
  const qc = useQueryClient();
  const copy = useCopyShare();
  const track = useTrackShare();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const share = useCallback(async () => {
    setFailed(false);
    setBusy(true);
    try {
      const link = await qc.fetchQuery({ queryKey: [...keys.group(group.id), 'link'], queryFn: () => api.groups.link(group.id), staleTime: Infinity });
      const url = groupUrl(link.code);
      track('group');
      await copy.share(croissance.groupInvite.message(group.name, group.habit?.label ?? null, url), url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [api, qc, copy, track, group.id, group.name, group.habit?.label]);
  return { share, busy, failed, copied: copy.copied, reset: () => setFailed(false) };
}

/** La page « rejoindre » d'un lien de groupe (publique : nom, habitude, jours tenus, nombre de membres). */
export function useGroupPreview(code: string | null) {
  const api = useApi();
  return useQuery({ queryKey: ['groups', 'code', code], queryFn: () => api.groups.preview(code ?? ''), enabled: !!code, retry: false });
}

export function useJoinGroup() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.groups.join(code),
    onSuccess: (g) => {
      setDetail(qc, g);
      void qc.invalidateQueries({ queryKey: keys.groups, exact: true });
      // Rejoindre un groupe d'habitude peut ajouter l'habitude.
      void qc.invalidateQueries({ queryKey: ['rituals', 'habits'] });
    },
  });
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
