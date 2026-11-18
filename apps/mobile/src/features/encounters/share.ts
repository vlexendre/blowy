import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';

import { inviteUrl } from '@/core';
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
    try {
      if (Platform.OS === 'web') throw new Error('web');
      await Share.share({ message: text });
    } catch {
      await Clipboard.setStringAsync(text).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [me.data, message, track]);
  return { share, copied, ready: !!me.data };
}
