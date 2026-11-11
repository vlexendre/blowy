import type { UpdateMeBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

import { keys, useApi, usePorts } from '@/core';

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: keys.me, queryFn: api.me.get });
}

export function useUpdateMe() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => api.me.update(body),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

/** Choisit une photo, l'envoie, puis l'enregistre comme photo de profil. Rend false si la personne annule. */
export function useSetAvatar() {
  const api = useApi();
  const { media } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: 'camera' | 'library') => {
      const image = await media.pick(source);
      if (!image) return false;
      const ticket = await api.me.avatarTicket(image.contentType);
      await media.upload(ticket, image);
      qc.setQueryData(keys.me, await api.me.setAvatar(ticket.path));
      return true;
    },
  });
}

/** Supprime le compte et toutes ses données, puis ferme la session. */
export function useDeleteAccount() {
  const api = useApi();
  const { auth } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.me.remove();
      await auth.signOut();
    },
    onSuccess: () => qc.clear(),
  });
}

/**
 * Copier et partager un lien. `copied` reste vrai 2 s après une copie.
 * Sur le web sans partage natif, partager revient à copier.
 */
export function useCopyShare() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, []);
  const share = useCallback(
    async (message: string, url: string) => {
      const canShareOnWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      if (Platform.OS === 'web' && !canShareOnWeb) return copy(url);
      try {
        await Share.share(Platform.OS === 'ios' ? { message, url } : { message });
      } catch {
        await copy(url);
      }
    },
    [copy],
  );
  return { copied, copy, share };
}

/** Adresse affichée sans protocole (« blowy.app/i/ABCD1234 »). */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '');
