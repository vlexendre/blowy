/**
 * Les minimoas dans un chat (spéc §9) : accord de lecture par une IA (demandé à chacun à la première ouverture du
 * chat), coupure par lien, et la liste de tous tes liens pour « Moi ». La phrase de confidentialité vient de l'API
 * (`consent.text`) et s'affiche telle quelle.
 */
import type { LinkMinimoas, LinkMinimoasBody, MyMinimoas } from '@blowy/contract';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { keys, useApi } from '@/core';

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
  return { ...query, items, text };
}

/**
 * Appliquer un même accord à tous les liens (réglage global de « Moi ») : un appel par lien, à la suite.
 * Rend le nombre de liens modifiés.
 */
export function useSetReadingEverywhere() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ consent, linkIds }: { consent: boolean; linkIds: readonly string[] }) => {
      let done = 0;
      for (const id of linkIds) {
        const next = await api.minimoas.update(id, { consent });
        qc.setQueryData(minimoasKey(id), next);
        done++;
      }
      return done;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: myMinimoasKey }),
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
