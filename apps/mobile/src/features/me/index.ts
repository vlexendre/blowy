import type { UpdateMeBody } from '@blowy/contract';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share, type View } from 'react-native';

import { captureStory, keys, shareStoryImage, useApi, usePorts } from '@/core';

export function useMe(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: keys.me, queryFn: api.me.get, enabled });
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

/**
 * Partage de l'invitation en story : capture l'image (`StoryCard`), puis l'éditeur de story d'Instagram, sinon la
 * feuille de partage du système avec l'image ; si l'image n'a pas pu être faite (web), le lien en texte.
 */
export function useStoryShare() {
  const card = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const { copied, copy, share: shareText } = useCopyShare();
  const share = useCallback(
    async (message: string, url: string) => {
      if (busy) return;
      setBusy(true);
      try {
        const image = await captureStory(card);
        if (!image) return await shareText(message, url);
        const result = await shareStoryImage(image, message);
        // Rien ne s'est ouvert (ni Instagram ni la feuille) : au moins le lien.
        if (result === 'none' && Platform.OS !== 'ios') await shareText(message, url);
      } finally {
        setBusy(false);
      }
    },
    [busy, shareText],
  );
  return { card, busy, share, copied, copy };
}

/** Adresse affichée sans protocole (« blowy.app/i/ABCD1234 »). */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '');

/** E-mail affiché à moitié caché : « a•••@avectroise.fr ». */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return email;
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

export { legalUrl, openLegal, type LegalPage } from './links';
