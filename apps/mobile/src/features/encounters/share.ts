import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';

import { inviteUrl, presentShare } from '@/core';
import { useTrackShare } from '@/features/growth';
import { useMe } from '@/features/me';

/** Partage le lien d'invitation (feuille native ; sur le web, copie dans le presse-papiers). */
export function useShareInvite(message: (pet: string, url: string) => string) {
  const me = useMe();
  const [copied, setCopied] = useState(false);
  const track = useTrackShare();
  const share = useCallback(async () => {
    if (!me.data) return;
    const url = inviteUrl(me.data.inviteCode);
    const text = message(me.data.pet.name, url);
    track('invite');
    const copyInstead = async () => {
      await Clipboard.setStringAsync(text).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };
    // Feuille qui n'a pas pu s'ouvrir (ou web) : le texte est copié, jamais rien.
    if (Platform.OS === 'web' || !(await presentShare(() => Share.share({ message: text }), () => void copyInstead()))) await copyInstead();
  }, [me.data, message, track]);
  return { share, copied, ready: !!me.data };
}
