/**
 * Les minimoas dans un chat (spéc §9) : accord de lecture par une IA (demandé à chacun à la première ouverture du
 * chat), coupure par lien, et la liste de tous tes liens pour « Moi ». La phrase de confidentialité vient de l'API
 * (`consent.text`) et s'affiche telle quelle.
 */
import type { ChatReadingDefaultDto, LinkMinimoas, LinkMinimoasBody, MyMinimoas } from '@blowy/contract';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { keys, optimistic, patch, rollback, useApi } from '@/core';

export const minimoasKey = (linkId: string) => [...keys.link(linkId), 'minimoas'] as const;
export const myMinimoasKey = ['me', 'minimoas'] as const;

export function useLinkMinimoas(linkId: string) {
  const api = useApi();
  return useQuery({ queryKey: minimoasKey(linkId), queryFn: () => api.minimoas.get(linkId) });
}

/** Changer son accord ou couper les minimoas d'un lien : l'écran change tout de suite, et revient si l'API refuse. */
export function useUpdateLinkMinimoas(linkId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LinkMinimoasBody) => api.minimoas.update(linkId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: minimoasKey(linkId) });
      const before = qc.getQueryData<LinkMinimoas>(minimoasKey(linkId));
      if (before) {
        qc.setQueryData<LinkMinimoas>(minimoasKey(linkId), {
          ...before,
          muted: body.muted ?? before.muted,
          consent: { ...before.consent, mine: body.consent ?? before.consent.mine },
        });
      }
      return { before };
    },
    onError: (_e, _b, ctx) => {
      if (ctx?.before) qc.setQueryData(minimoasKey(linkId), ctx.before);
    },
    onSuccess: (next) => {
      qc.setQueryData(minimoasKey(linkId), next);
      qc.setQueryData<InfiniteData<MyMinimoas>>(myMinimoasKey, (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((i) => (i.linkId === linkId ? next : i)) })) } : data,
      );
    },
  });
}

/** Tous tes liens et leurs réglages (« Moi › Minimoas dans tes chats »), par pages. */
export function useMyMinimoas() {
  const api = useApi();
  const query = useInfiniteQuery({
    queryKey: myMinimoasKey,
    queryFn: ({ pageParam }) => api.minimoas.mine(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = (query.data?.pages ?? []).flatMap((p) => p.items);
  const text = query.data?.pages[0]?.text ?? null;
  /** Réglage par défaut des nouveaux chats (« ask » si l'API ne le dit pas encore). */
  const readingDefault: ChatReadingDefaultDto = query.data?.pages[0]?.readingDefault ?? 'ask';
  return { ...query, items, text, readingDefault };
}

/** Le réglage par défaut des nouveaux chats : demander à chaque fois, toujours oui, toujours non. */
export function useSetReadingDefault() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: ChatReadingDefaultDto) => api.minimoas.setDefault(value),
    // Le choix s'affiche à l'appui ; refusé : il revient.
    onMutate: (value) =>
      optimistic(qc, [
        patch<InfiniteData<MyMinimoas>>(myMinimoasKey, (data) => ({ ...data, pages: data.pages.map((p, i) => (i === 0 ? { ...p, readingDefault: value } : p)) })),
      ]),
    onError: (_e, _v, snap) => rollback(qc, snap),
    onSuccess: ({ readingDefault }) =>
      qc.setQueryData<InfiniteData<MyMinimoas>>(myMinimoasKey, (data) =>
        data ? { ...data, pages: data.pages.map((p, i) => (i === 0 ? { ...p, readingDefault } : p)) } : data,
      ),
  });
}

/** Appliquer un même accord à tous les liens (réglage global de « Moi ») : un seul appel. Rend le nombre de liens modifiés. */
export function useSetReadingEverywhere() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consent: boolean) => (await api.minimoas.setAll(consent)).updated,
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: myMinimoasKey });
      // Les réglages de chaque chat déjà lus (options du lien, feuille d'accord).
      void qc.invalidateQueries({ predicate: (q) => q.queryKey.at(-1) === 'minimoas' });
    },
  });
}

const GUIDE_KEY = 'blowy.minimoas.guide.seen';

/**
 * Explication des rôles des minimoas, montrée une fois (sur l'appareil), puis rangée : `seen` null tant qu'on lit
 * la mémoire, ensuite vrai ou faux.
 */
export function useMinimoaGuide() {
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(GUIDE_KEY)
      .then((v) => alive && setSeen(v === '1'))
      .catch(() => alive && setSeen(false));
    return () => {
      alive = false;
    };
  }, []);
  const dismiss = useCallback(() => {
    setSeen(true);
    void AsyncStorage.setItem(GUIDE_KEY, '1').catch(() => undefined);
  }, []);
  return { seen, dismiss };
}
