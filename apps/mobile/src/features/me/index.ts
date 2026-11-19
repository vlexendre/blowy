import type { Me, UpdateMeBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share, type View } from 'react-native';

import { withUpdate } from './update';
import { captureStory, keys, optimistic, patch, presentShare, rollback, shareStoryImage, useApi, usePorts } from '@/core';
import { forgetChats } from '@/features/chat';

/** Ton lien « 3 mots » et ton résultat (les 3 mots les plus choisis, à partir de 3 votes). */
export function useMyWords(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: ['me', 'words'], queryFn: api.words.mine, enabled, staleTime: 30_000 });
}

export function useMe(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled });
}

export function useUpdateMe() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => api.me.update(body),
    // Interrupteurs et champs de « Moi » : l'écran change à l'appui ; refusé (filtre du prénom, réseau) : il revient.
    onMutate: (body) => optimistic(qc, [patch<Me>(keys.me, (me) => withUpdate(me, body))]),
    onError: (_e, _body, snap) => rollback(qc, snap),
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
    onSuccess: () => {
      qc.clear();
      forgetChats();
    },
  });
}

/**
 * Copier et partager un lien. `copied` reste vrai 2 s après une copie.
 * Partager ouvre la feuille du système ; si elle n'a pas pu s'ouvrir (ou sur le web sans partage natif), le lien est
 * copié à la place (`copied` le montre) : jamais rien.
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
    async (message: string, url: string): Promise<'sheet' | 'copied'> => {
      const canShareOnWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      if (Platform.OS === 'web' && !canShareOnWeb) {
        await copy(url);
        return 'copied';
      }
      const fallback = () => void copy(url);
      const opened = await presentShare(() => Share.share(Platform.OS === 'ios' ? { message, url } : { message }), fallback);
      if (opened) return 'sheet';
      await copy(url);
      return 'copied';
    },
    [copy],
  );
  return { copied, copy, share };
}

/**
 * Partage en story : capture l'image (`StoryCard`, `ShareCard`), puis l'éditeur de story d'Instagram, sinon la feuille
 * de partage du système avec l'image et le lien. À chaque échec (capture vide ou impossible, Instagram ou feuille qui
 * refusent), repli sur le lien seul, puis sur la copie du lien : quelque chose s'ouvre toujours. `busy` : en cours.
 */
export function useStoryShare() {
  const card = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const { copied, copy, share: shareText } = useCopyShare();
  const share = useCallback(
    async (message: string, url: string, target: 'story' | 'sheet' = 'story') => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      try {
        const image = await captureStory(card).catch(() => null);
        if (image) {
          const result = await shareStoryImage(image, message, target).catch(() => 'failed' as const);
          if (result !== 'failed') return;
        }
        await shareText(message, url);
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [shareText],
  );
  return { card, busy, share, copied, copy };
}

/** Adresse affichée sans protocole (« minimoa.app/i/ABCD1234 »). */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '');

/** E-mail affiché à moitié caché : « a•••@avectroise.fr ». */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return email;
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

export { legalUrl, openLegal, type LegalPage } from './links';
