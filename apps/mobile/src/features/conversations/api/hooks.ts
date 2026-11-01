/**
 * Conversations : liste, messages paginés, envoi (clientMessageId = commandId, file hors ligne :
 * le message reste en attente, jamais distribué avant modération), « Afficher quand même »,
 * suggestion du pet (jamais envoyée automatiquement), temps réel via rooms.
 */
import type { MessageView } from '@blowy/api-contract';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isNetworkError } from '../../../core/api/errors';
import { registerSender } from '../../../core/offline/runner';
import { pendingForScope } from '../../../core/offline/queue';
import { useOfflineQueue } from '../../../core/offline/store';
import { useNetwork } from '../../../core/network/network';
import { useServices } from '../../../core/providers/services';
import { useSession } from '../../../core/session/session-store';
import { useRealtimeRoom } from '../../../core/realtime/provider';
import type { LocalOutgoing } from '../model/messages';
import { createConversationsRepository } from './conversations.repository';

export const convKeys = { list: ['conversations'] as const, messages: (id: string) => ['conversations', id, 'messages'] as const };

function useRepo() {
  const { api } = useServices();
  return useMemo(() => createConversationsRepository(api), [api]);
}

export function useConversations() {
  const repo = useRepo();
  const signedIn = useSession((s) => s.status === 'signedIn');
  return useQuery({ queryKey: convKeys.list, queryFn: repo.list, enabled: signedIn });
}

export function useMessageSender() {
  const repo = useRepo();
  const qc = useQueryClient();
  useEffect(
    () =>
      registerSender('SEND_MESSAGE', async (cmd) => {
        const p = cmd.payload as { conversationId: string; body: string };
        await repo.send(cmd.commandId, p.conversationId, cmd.commandId, p.body);
        await qc.invalidateQueries({ queryKey: convKeys.messages(p.conversationId) });
      }),
    [repo, qc],
  );
}

export function useConversation(conversationId: string) {
  const repo = useRepo();
  const qc = useQueryClient();
  const { newCommandId } = useServices();
  const online = useNetwork((s) => s.online);
  const queue = useOfflineQueue();
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [revealedBodies, setRevealedBodies] = useState<Record<string, MessageView>>({});

  useRealtimeRoom(`conversation:${conversationId}`, () => void qc.invalidateQueries({ queryKey: convKeys.messages(conversationId) }));

  const pages = useInfiniteQuery({
    queryKey: convKeys.messages(conversationId),
    queryFn: ({ pageParam }) => repo.messages(conversationId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
  });

  const server = useMemo(() => (pages.data?.pages.flatMap((p) => p.items) ?? []).map((m) => revealedBodies[m.id] ?? m), [pages.data, revealedBodies]);

  const local: LocalOutgoing[] = useMemo(
    () =>
      pendingForScope(queue, conversationId, 'SEND_MESSAGE').map((c) => ({
        clientMessageId: c.commandId,
        body: String((c.payload as { body: string }).body),
        createdAt: c.createdAt,
        state: c.status === 'sending' ? 'sending' : 'queued',
      })),
    [queue, conversationId],
  );

  const send = useCallback(
    async (body: string) => {
      const commandId = newCommandId();
      const enqueue = () => queue.dispatch({ type: 'enqueue', command: { commandId, kind: 'SEND_MESSAGE', payload: { conversationId, body }, scope: conversationId, createdAt: Date.now() } });
      if (!online) return enqueue();
      try {
        await repo.send(commandId, conversationId, commandId, body);
        await qc.invalidateQueries({ queryKey: convKeys.messages(conversationId) });
      } catch (e) {
        if (isNetworkError(e)) enqueue();
        else throw e;
      }
    },
    [newCommandId, queue, conversationId, online, repo, qc],
  );

  const reveal = useCallback(
    async (messageId: string) => {
      const m = await repo.reveal(newCommandId(), messageId);
      setRevealedBodies((r) => ({ ...r, [messageId]: m }));
      setRevealed((s) => new Set([...s, messageId]));
    },
    [repo, newCommandId],
  );

  return { pages, server, local, revealed, send, reveal, hidden: queue.hiddenScopes.includes(conversationId) };
}

export function useSuggestions(conversationId: string, enabled: boolean) {
  const repo = useRepo();
  return useQuery({ queryKey: ['conversations', conversationId, 'suggestions'], queryFn: () => repo.suggestions(conversationId), enabled, retry: false, staleTime: 10 * 60_000 });
}
