/**
 * Partage natif : texte (feuille système), image de la carte (capture de la vue → feuille système,
 * qui propose Story / Enregistrer), copie du lien. Aucun contenu n'est envoyé à Blowy.
 */
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import type { ComponentRef, RefObject } from 'react';
import { Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export const shareText = async (message: string): Promise<void> => void (await Share.share({ message }).catch(() => undefined));

export async function shareCardImage(ref: RefObject<ComponentRef<typeof View> | null>): Promise<boolean> {
  try {
    if (!ref.current || !(await Sharing.isAvailableAsync())) return false;
    const uri = await captureRef(ref as never, { format: 'png', quality: 1, result: 'tmpfile' });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    return true;
  } catch {
    return false;
  }
}

export const copyText = (text: string): Promise<boolean> => Clipboard.setStringAsync(text);
