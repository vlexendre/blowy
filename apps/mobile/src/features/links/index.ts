import type { Link, LinkAction, Message, MessagesPage } from '@blowy/contract';
import type { MessageLook } from '@blowy/ui';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { keys, useApi } from '@/core';
import { type ChatTransport, useOutbox, useThreadLooks } from '@/features/chat';

export function useLinks() {
  const api = useApi();
  return useQuery({ queryKey: keys.links, queryFn: api.links.list });
}

/**
 * Un lien. Ouvert depuis la liste, il s'affiche tout de suite avec la ligne déjà en cache (relue derrière : le détail
 * ajoute les habitudes communes) ; jamais d'écran blanc.
 */
export function useLink(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.link(id),
    queryFn: () => api.links.get(id),
    initialData: () => qc.getQueryData<Link[]>(keys.links)?.find((l) => l.id === id),
    // Donnée de la liste : affichée, mais relue tout de suite.
    initialDataUpdatedAt: 0,
  });
}

/** Précharge un lien et ses messages (appui sur une ligne de la liste, notification) : le chat s'ouvre déjà rempli. */
export function usePrefetchLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      void qc.prefetchInfiniteQuery({
        queryKey: keys.messages(id),
        queryFn: ({ pageParam }: { pageParam: string | undefined }) => api.links.messages(id, pageParam),
        initialPageParam: undefined as string | undefined,
        staleTime: 15_000,
      });
    },
    [api, qc],
  );
}

type Pages = InfiniteData<MessagesPage, string | undefined>;

/** Les messages des pages, du plus récent au plus ancien, sans doublon. */
export function flattenMessages(pages: readonly MessagesPage[] | undefined): Message[] {
  const seen = new Set<string>();
  const messages: Message[] = [];
  for (const page of pages ?? []) {
    for (let i = page.messages.length - 1; i >= 0; i--) {
      const m = page.messages[i];
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        messages.push(m);
      }
    }
  }
  return messages;
}

/** Messages d'un lien, du plus récent au plus ancien (prêt pour une liste inversée). Même tableau tant que rien ne change. */
export function useMessages(id: string) {
  const api = useApi();
  const query = useInfiniteQuery({
    queryKey: keys.messages(id),
    queryFn: ({ pageParam }) => api.links.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });
  const pages = query.data?.pages;
  const messages = useMemo(() => flattenMessages(pages), [pages]);
  return { ...query, messages };
}

/** Range le résultat d'une action dans le cache : lien à jour + nouveaux messages en tête. */
function applyAction(qc: QueryClient, id: string, action: LinkAction): void {
  qc.setQueryData<Link>(keys.link(id), (before) => (before?.sharedHabits && !action.link.sharedHabits ? { ...action.link, sharedHabits: before.sharedHabits } : action.link));
  qc.setQueryData<Link[]>(keys.links, (list) => list?.map((l) => (l.id === id ? action.link : l)));
  qc.setQueryData<Pages>(keys.messages(id), (data) => {
    if (!data) return data;
    const [first, ...rest] = data.pages;
    if (!first) return data;
    // Le temps réel a pu relire le fil avant la réponse : un message déjà là (dans n'importe quelle page) n'est pas remis.
    const known = new Set(data.pages.flatMap((p) => p.messages.map((m) => m.id)));
    const fresh = action.messages.filter((m) => !known.has(m.id));
    if (fresh.length === 0) return data;
    return { ...data, pages: [{ ...first, messages: [...first.messages, ...fresh] }, ...rest] };
  });
  void qc.invalidateQueries({ queryKey: keys.pet });
  // Étapes du lien (niveau passé, palier de série) : relues au prochain affichage de « Le lien ».
  void qc.invalidateQueries({ queryKey: keys.memories(id) });
}

const mineInLink = (m: MessageLook): boolean => m.author === 'me';

/**
 * Le chat d'un lien, optimiste : `send` montre le message tout de suite (« Envoi… » discret s'il tarde) et l'envoie
 * avec sa clé d'idempotence ; une panne laisse « Pas envoyé · Réessayer » sur la bulle ; un refus net (filtre, lien
 * endormi) rend le texte au champ. `looks` : le fil complet pour `ChatThread` (chronologique, brouillons en bas).
 */
export function useLinkChat(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  const thread = useMessages(id);
  const transport = useMemo<ChatTransport<LinkAction>>(
    () => ({
      send: (p) => api.links.send(id, { body: p.body, clientId: p.clientId }),
      apply: (action) => applyAction(qc, id, action),
      sentId: (action) => action.messages.find((m) => m.author === 'me')?.id,
    }),
    [api, qc, id],
  );
  const outbox = useOutbox(`link:${id}`, transport);
  const chrono = useMemo(() => chronological(thread.messages), [thread.messages]);
  const looks = useThreadLooks(`link:${id}`, chrono, outbox.pending, mineInLink);
  const { send: enqueue } = outbox;
  const send = useCallback((body: string) => enqueue(body, chrono), [enqueue, chrono]);
  return { thread, looks, send, retry: outbox.retry, pending: outbox.pending };
}

export function useRevive(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.links.revive(id), onSuccess: (action) => applyAction(qc, id, action) });
}

export function useMemories(id: string) {
  const api = useApi();
  return useQuery({ queryKey: keys.memories(id), queryFn: () => api.links.memories(id) });
}

/** Marque le lien comme lu à l'ouverture et à chaque nouveau message : la pastille s'éteint tout de suite. */
export function useMarkRead(id: string, newestMessageId: string | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  useEffect(() => {
    if (!newestMessageId) return;
    const before = qc.getQueryData<Link[]>(keys.links)?.find((l) => l.id === id)?.unread ?? 0;
    const setUnread = (unread: number) => qc.setQueryData<Link[]>(keys.links, (list) => list?.map((l) => (l.id === id ? { ...l, unread } : l)));
    if (before > 0) setUnread(0);
    void api.links.read(id).catch(() => {
      // Pas passé : la pastille revient (relue à la prochaine lecture de la liste).
      if (before > 0) void qc.invalidateQueries({ queryKey: keys.links, exact: true });
    });
  }, [api, id, newestMessageId, qc]);
}

/** Quitter un lien : il quitte la liste tout de suite, et y revient si l'API refuse. */
export function useArchiveLink() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.links.archive(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.links, exact: true });
      const before = qc.getQueryData<Link[]>(keys.links);
      qc.setQueryData<Link[]>(keys.links, (list) => list?.filter((l) => l.id !== id));
      return { before };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.links, ctx.before);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.links, exact: true }),
  });
}

/** Nombre total de messages non lus (pastille de l'onglet Chats). */
export const totalUnread = (links: Link[] | undefined): number => (links ?? []).reduce((n, l) => n + l.unread, 0);

export { chatDayLabel, isMyTurn, isNewLink, linkDayState, type LinkDayState, shortDay, sortLinks, streaksWaitingOnMe, timeLabel, weekStrip } from './format';
export { ConfirmSheet, ReportSheet } from './sheets';
export { useBackToLink } from './navigation';
export { useLevelUps } from './levels';

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
export { minimoasKey, myMinimoasKey, useLinkMinimoas, useMinimoaGuide, useMyMinimoas, useSetReadingDefault, useSetReadingEverywhere, useUpdateLinkMinimoas } from './minimoas';
