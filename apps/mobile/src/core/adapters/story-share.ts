/**
 * Partage d'une image en story Instagram (invitation), comme le décrit Meta (« Sharing to Stories ») : l'image est
 * posée dans le presse-papiers sous la clé d'Instagram, puis `instagram-stories://share?source_application=<id>` ouvre
 * l'éditeur de story avec l'image en fond. Un identifiant d'app Meta est obligatoire depuis janvier 2023
 * (`EXPO_PUBLIC_FACEBOOK_APP_ID`) ; sans lui, ou sans Instagram, on passe par la feuille de partage du système avec la
 * même image. Sur le web : `story-share.web.ts`.
 */
import type { ComponentRef, RefObject } from 'react';
import { Linking, Platform, type View } from 'react-native';
import Share, { Social } from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

import { config } from '../config';

type ViewRef = RefObject<ComponentRef<typeof View> | null>;

export type StoryShareResult = 'story' | 'sheet' | 'none';

/** Capture la vue en PNG 1080 × 1920 (fichier temporaire) ; null si la capture échoue. */
export async function captureStory(view: ViewRef): Promise<string | null> {
  if (!view.current) return null;
  try {
    return await captureRef(view, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
  } catch {
    return null;
  }
}

async function instagramReady(): Promise<boolean> {
  if (!config.facebookAppId) return false;
  try {
    if (Platform.OS === 'ios') return await Linking.canOpenURL('instagram-stories://share');
    const { isInstalled } = await Share.isPackageInstalled('com.instagram.android');
    return isInstalled;
  } catch {
    return false;
  }
}

/**
 * Ouvre l'éditeur de story d'Instagram avec l'image en fond (`story`) ; sinon la feuille de partage du système avec
 * l'image et le message (`sheet`) ; `none` si la personne ferme la feuille ou si rien n'a pu s'ouvrir.
 */
/** `target: 'sheet'` : directement la feuille de partage (« Autre app »), sans essayer Instagram. */
export async function shareStoryImage(imageUri: string, message: string, target: 'story' | 'sheet' = 'story'): Promise<StoryShareResult> {
  if (target === 'story' && (await instagramReady())) {
    try {
      await Share.shareSingle({ social: Social.InstagramStories, appId: config.facebookAppId, backgroundImage: imageUri });
      return 'story';
    } catch {
      // Instagram n'a pas voulu : la feuille du système prend le relais.
    }
  }
  try {
    await Share.open({ url: imageUri, type: 'image/png', message, failOnCancel: false });
    return 'sheet';
  } catch {
    return 'none';
  }
}
