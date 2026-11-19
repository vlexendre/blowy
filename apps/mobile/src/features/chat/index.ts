/**
 * Envoi optimiste du chat (liens et groupes) : file de brouillons par fil, gardée sur l'appareil (un message pas parti
 * survit à la fermeture de l'app), envoyée dans l'ordre, un message à la fois, avec une clé d'idempotence ; brouillon
 * du champ par fil (changer d'onglet ou d'écran ne perd pas ce qu'on tapait). Logique pure : `./outbox`.
 */
import { hapticFor, type MessageLook } from '@blowy/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { afterRestart, draftKey, isFinalSendError, newClientId, newestAt, type Pending, restoreDraft, type SentLike, threadView } from './outbox';

export { draftKey, isFinalSendError, matchSent, newClientId, restoreDraft, threadView, type Pending } from './outbox';

/** Fil : `link:<id>` ou `group:<id>`. */
export type ThreadKey = `link:${string}` | `group:${string}`;

const EMPTY: Pending[] = [];

interface OutboxState {
  threads: Record<string, Pending[]>;
  add: (thread: string, p: Pending) => void;
  patch: (thread: string, clientIds: readonly string[], change: Partial<Pending>) => void;
  remove: (thread: string, clientIds: readonly string[]) => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      threads: {},
      add: (thread, p) => set((s) => ({ threads: { ...s.threads, [thread]: [...(s.threads[thread] ?? []), p] } })),
      patch: (thread, clientIds, change) =>
        set((s) => {
          const list = s.threads[thread];
          if (!list) return s;
          return { threads: { ...s.threads, [thread]: list.map((p) => (clientIds.includes(p.clientId) ? { ...p, ...change } : p)) } };
        }),
      remove: (thread, clientIds) =>
        set((s) => {
          const list = s.threads[thread];
          if (!list) return s;
          const next = list.filter((p) => !clientIds.includes(p.clientId));
          const threads = { ...s.threads };
          if (next.length > 0) threads[thread] = next;
          else delete threads[thread];
          return { threads };
        }),
    }),
    {
      name: 'blowy.chat.outbox',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ threads: s.threads }),
      // Relance de l'app : ce qui était en route n'a pas eu de réponse ici, la bulle propose de réessayer (sans doublon :
      // la clé d'idempotence est la même, et un message bien arrivé est reconnu dans le fil).
      merge: (saved, current) => {
        const threads = (saved as { threads?: Record<string, Pending[]> } | undefined)?.threads ?? {};
        const out: Record<string, Pending[]> = {};
        for (const [k, list] of Object.entries(threads)) {
          const kept = afterRestart(list.filter((p) => p.status !== 'sent'));
          if (kept.length > 0) out[k] = kept;
        }
        return { ...current, threads: out };
      },
    },
  ),
);

/** Champ de saisie et dernier refus, par fil (mémoire seulement). */
export const useChatDrafts = create<{
  drafts: Record<string, string>;
  refusals: Record<string, { message: string; code: string } | undefined>;
  setDraft: (thread: string, text: string) => void;
  refuse: (thread: string, refusal: { message: string; code: string } | undefined) => void;
}>((set) => ({
  drafts: {},
  refusals: {},
  setDraft: (thread, text) => set((s) => ({ drafts: { ...s.drafts, [thread]: text } })),
  refuse: (thread, refusal) => set((s) => ({ refusals: { ...s.refusals, [thread]: refusal } })),
}));

/** Ce qu'il faut à la file pour envoyer un brouillon et ranger la réponse. */
export interface ChatTransport<A> {
  send: (p: Pending) => Promise<A>;
  /** Range la réponse dans le cache (messages et lien / groupe à jour). */
  apply: (action: A) => void;
  /** Id du message à soi dans la réponse. */
  sentId: (action: A) => string | undefined;
}

/** Lignes remplacées : id du serveur → clé du brouillon (gardée même après que le brouillon a quitté la file). */
const replacedKeys = new Map<string, string>();
const running = new Set<string>();

/** Envoie la file d'un fil, dans l'ordre, un message à la fois (un seul envoi en route par fil). */
async function pump<A>(thread: string, transport: () => ChatTransport<A>): Promise<void> {
  if (running.has(thread)) return;
  running.add(thread);
  const store = useOutboxStore.getState;
  try {
    for (;;) {
      const next = store().threads[thread]?.find((p) => p.status === 'queued');
      if (!next) break;
      store().patch(thread, [next.clientId], { status: 'sending' });
      const t = transport();
      try {
        const action = await t.send(next);
        const id = t.sentId(action);
        if (id) replacedKeys.set(id, draftKey(next.clientId));
        // Confirmé : la bulle reste en place jusqu'à ce que le message du serveur soit dans le fil, puis s'efface.
        store().patch(thread, [next.clientId], { status: 'sent', serverId: id });
        t.apply(action);
        if (!id) store().remove(thread, [next.clientId]);
      } catch (error) {
        if (isFinalSendError(error)) {
          // Refus net (filtre, lien endormi…) : la bulle part, le texte revient dans le champ, la raison s'affiche.
          store().remove(thread, [next.clientId]);
          const drafts = useChatDrafts.getState();
          drafts.setDraft(thread, restoreDraft(drafts.drafts[thread] ?? '', next.body));
          const e = error as { code?: unknown; message?: unknown };
          drafts.refuse(thread, { code: String(e.code ?? 'internal'), message: typeof e.message === 'string' ? e.message : '' });
          hapticFor('error');
          continue;
        }
        // Panne (réseau, serveur) : ce message et ceux qui attendent derrière restent, « Pas envoyé · Réessayer ».
        const stuck = (store().threads[thread] ?? []).filter((p) => p.status === 'queued' || p.clientId === next.clientId).map((p) => p.clientId);
        store().patch(thread, stuck, { status: 'failed' });
        hapticFor('error');
        break;
      }
    }
  } finally {
    running.delete(thread);
  }
}

/**
 * La file d'un fil : `send` affiche le message tout de suite et l'envoie ; `retry` renvoie tout ce qui n'est pas
 * parti (dans l'ordre) ; `merge` mêle les brouillons aux messages du serveur pour `ChatThread`.
 */
export function useOutbox<A>(thread: ThreadKey, transport: ChatTransport<A>) {
  const pending = useOutboxStore((s) => s.threads[thread] ?? EMPTY);
  const latest = useRef(transport);
  latest.current = transport;
  const getTransport = useCallback(() => latest.current, []);

  const send = useCallback(
    (body: string, server: readonly { at: string }[]) => {
      useChatDrafts.getState().refuse(thread, undefined);
      useOutboxStore.getState().add(thread, { clientId: newClientId(), body, at: new Date().toISOString(), status: 'queued', since: newestAt(server) });
      void pump(thread, getTransport);
    },
    [thread, getTransport],
  );
  const retry = useCallback(() => {
    const failed = (useOutboxStore.getState().threads[thread] ?? []).filter((p) => p.status === 'failed').map((p) => p.clientId);
    if (failed.length === 0) return;
    useOutboxStore.getState().patch(thread, failed, { status: 'queued' });
    void pump(thread, getTransport);
  }, [thread, getTransport]);

  return { pending, send, retry };
}

/**
 * Messages du serveur (chronologiques) + brouillons, en `MessageLook` : un message qui a remplacé un brouillon garde
 * sa clé de ligne ; les brouillons arrivés dans le fil quittent la file.
 */
export function useThreadLooks<M extends MessageLook>(thread: ThreadKey, server: readonly M[], pending: readonly Pending[], isMine: (m: M) => boolean): MessageLook[] {
  const view = useMemo(
    () =>
      threadView(
        pending,
        server.map((m): SentLike => ({ id: m.id, mine: isMine(m), body: m.body, at: m.at })),
      ),
    // `isMine` est une fonction pure, définie hors du rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pending, server],
  );
  useEffect(() => {
    if (view.done.length > 0) useOutboxStore.getState().remove(thread, view.done);
  }, [thread, view]);
  return useMemo(() => {
    for (const [id, clientId] of view.replaced) replacedKeys.set(id, draftKey(clientId));
    const out: MessageLook[] = server.map((m) => {
      const key = replacedKeys.get(m.id);
      return key ? { ...m, key } : m;
    });
    for (const p of view.visible) {
      out.push({
        id: draftKey(p.clientId),
        key: draftKey(p.clientId),
        author: 'me',
        kind: 'text',
        body: p.body,
        mediaUrl: null,
        at: p.at,
        status: p.status === 'failed' ? 'failed' : p.status === 'sent' ? undefined : 'sending',
      });
    }
    return out;
  }, [server, view]);
}

/** Brouillon du champ d'un fil. */
export function useDraft(thread: ThreadKey): [string, (text: string) => void] {
  const draft = useChatDrafts((s) => s.drafts[thread] ?? '');
  const setDraft = useCallback((text: string) => useChatDrafts.getState().setDraft(thread, text), [thread]);
  return [draft, setDraft];
}

/** Dernier refus net d'un envoi dans ce fil (raison de l'API), à afficher au-dessus du champ. */
export function useRefusal(thread: ThreadKey) {
  const refusal = useChatDrafts((s) => s.refusals[thread]);
  const clear = useCallback(() => useChatDrafts.getState().refuse(thread, undefined), [thread]);
  return { refusal, clear };
}
