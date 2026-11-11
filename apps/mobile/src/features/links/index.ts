import type { Link, LinkAction, Message, MessagesPage, SendMessageBody } from '@blowy/contract';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { keys, useApi, usePorts } from '@/core';

export function useLinks() {
  const api = useApi();
  return useQuery({ queryKey: keys.links, queryFn: api.links.list });
}

export function useLink(id: string) {
  const api = useApi();
  return useQuery({ queryKey: keys.link(id), queryFn: () => api.links.get(id) });
}

type Pages = InfiniteData<MessagesPage, string | undefined>;

/** Messages d'un lien, du plus récent au plus ancien (prêt pour une liste inversée). */
export function useMessages(id: string) {
  const api = useApi();
  const query = useInfiniteQuery({
    queryKey: keys.messages(id),
    queryFn: ({ pageParam }) => api.links.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });
  const seen = new Set<string>();
  const messages: Message[] = [];
  for (const page of query.data?.pages ?? []) {
    for (let i = page.messages.length - 1; i >= 0; i--) {
      const m = page.messages[i];
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        messages.push(m);
      }
    }
  }
  return { ...query, messages };
}

/** Range le résultat d'une action dans le cache : lien à jour + nouveaux messages en tête. */
function applyAction(qc: QueryClient, id: string, action: LinkAction): void {
  qc.setQueryData(keys.link(id), action.link);
  qc.setQueryData<Link[]>(keys.links, (list) => list?.map((l) => (l.id === id ? action.link : l)));
  qc.setQueryData<Pages>(keys.messages(id), (data) => {
    if (!data) return data;
    const [first, ...rest] = data.pages;
    if (!first) return data;
    const known = new Set(first.messages.map((m) => m.id));
    const fresh = action.messages.filter((m) => !known.has(m.id));
    return { ...data, pages: [{ ...first, messages: [...first.messages, ...fresh] }, ...rest] };
  });
  void qc.invalidateQueries({ queryKey: keys.pet });
}

export function useSendMessage(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SendMessageBody) => api.links.send(id, body),
    onSuccess: (action) => applyAction(qc, id, action),
  });
}

export function useRevive(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.links.revive(id), onSuccess: (action) => applyAction(qc, id, action) });
}

/** Photo du jour : choisir, envoyer, confirmer. Rend false si la personne annule. */
export function useSendPhoto(id: string) {
  const api = useApi();
  const { media } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: 'camera' | 'library') => {
      const image = await media.pick(source);
      if (!image) return false;
      const ticket = await api.links.photoTicket(id, image.contentType);
      await media.upload(ticket, image);
      applyAction(qc, id, await api.links.sendPhoto(id, ticket.path));
      void qc.invalidateQueries({ queryKey: keys.memories(id) });
      return true;
    },
  });
}

export function useMemories(id: string) {
  const api = useApi();
  return useQuery({ queryKey: keys.memories(id), queryFn: () => api.links.memories(id) });
}

/** Marque le lien comme lu à l'ouverture et à chaque nouveau message. */
export function useMarkRead(id: string, newestMessageId: string | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  useEffect(() => {
    if (!newestMessageId) return;
    void api.links
      .read(id)
      .then(() => qc.setQueryData<Link[]>(keys.links, (list) => list?.map((l) => (l.id === id ? { ...l, unread: 0 } : l))))
      .catch(() => undefined);
  }, [api, id, newestMessageId, qc]);
}

export function useArchiveLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.links.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.links }),
  });
}

/** Nombre total de messages non lus (pastille de l'onglet Chats). */
export const totalUnread = (links: Link[] | undefined): number => (links ?? []).reduce((n, l) => n + l.unread, 0);

export { chatDayLabel, isNewLink, shortDay, sortLinks, timeLabel, waitingForMyPhoto, weekStrip } from './format';
export { ConfirmSheet, PhotoSourceSheet, ReportSheet } from './sheets';

/** Message lisible d'une erreur d'API (codes du contrat), avec un repli. */
export function errorText(error: unknown, fallback: string, byCode: Partial<Record<string, string>> = {}): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    const mapped = byCode[code];
    if (mapped) return mapped;
    if (code !== 'internal' && error instanceof Error && error.message) return error.message;
  }
  return fallback;
}

/** Messages du plus ancien au plus récent (ordre attendu par `ChatThread`). */
export const chronological = (messages: readonly Message[]): Message[] => [...messages].reverse();
