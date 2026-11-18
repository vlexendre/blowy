/**
 * Partage d'une image en story Instagram (invitation), comme le décrit Meta (« Sharing to Stories ») : l'image est
 * posée dans le presse-papiers sous la clé d'Instagram, puis `instagram-stories://share?source_application=<id>` ouvre
 * l'éditeur de story avec l'image en fond. Un identifiant d'app Meta est obligatoire depuis janvier 2023
 * (`EXPO_PUBLIC_FACEBOOK_APP_ID`) ; sans lui, ou sans Instagram, on passe par la feuille de partage du système avec la
 * même image. Sur le web : `story-share.web.ts`.
 */
import type { ComponentRef, RefObject } from 'react';
import { Linking, Platform, Share as SystemShare, type View } from 'react-native';
import Share, { Social } from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

import { config } from '../config';
import { presentShare } from '../share-sheet';

type ViewRef = RefObject<ComponentRef<typeof View> | null>;

/** `story` : éditeur d'Instagram ouvert ; `sheet` : feuille du système ouverte ; `failed` : rien n'a pu s'ouvrir. */
export type StoryShareResult = 'story' | 'sheet' | 'failed';

/**
 * Petite capture d'essai : une image vide (transparente) pèse quelques centaines d'octets, la vraie carte (dégradé,
 * texte, minimoa) bien plus. Évite de partager une image vide quand iOS n'a rien dessiné.
 */
const PROBE = { width: 54, height: 96 } as const;
const PROBE_MIN_CHARS = 1200;

async function snap(view: ViewRef, options: Parameters<typeof captureRef>[1]): Promise<string | null> {
  try {
    return await captureRef(view, options);
  } catch {
    return null;
  }
}

/**
 * Capture la vue en PNG 1080 × 1920 (fichier temporaire, `file://…`) ; null si elle échoue ou sort vide. Sur iOS, deux
 * façons de dessiner : `drawViewHierarchyInRect` (par défaut), puis `renderInContext`, qui ne dépend ni de la fenêtre
 * ni de la transparence de la vue (la carte est montée transparente, `captureOnly`).
 */
export async function captureStory(view: ViewRef): Promise<string | null> {
  if (!view.current) return null;
  const ways = Platform.OS === 'ios' ? [false, true] : [false];
  for (const useRenderInContext of ways) {
    const probe = await snap(view, { format: 'png', result: 'base64', ...PROBE, useRenderInContext });
    if (!probe || probe.length < PROBE_MIN_CHARS) continue;
    const file = await snap(view, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920, useRenderInContext });
    if (file) return file.startsWith('/') ? `file://${file}` : file;
  }
  return null;
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
 * l'image et le message, qui contient le lien (`sheet`) ; `failed` si rien n'a pu s'ouvrir : l'appelant partage alors
 * le lien seul. `target: 'sheet'` : directement la feuille (« Autre app »), sans essayer Instagram.
 * Sur iOS, la feuille est celle de React Native (`Share.share` avec le fichier en `url`) : image + texte, sans dépendre
 * du module natif de `react-native-share`.
 */
export async function shareStoryImage(imageUri: string, message: string, target: 'story' | 'sheet' = 'story'): Promise<StoryShareResult> {
  if (target === 'story' && (await instagramReady())) {
    try {
      await Share.shareSingle({ social: Social.InstagramStories, appId: config.facebookAppId, backgroundImage: imageUri });
      return 'story';
    } catch {
      // Instagram n'a pas voulu : la feuille du système prend le relais.
    }
  }
  const opened = await presentShare(() =>
    Platform.OS === 'ios'
      ? SystemShare.share({ url: imageUri, message })
      : Share.open({ url: imageUri, type: 'image/png', message, failOnCancel: false }),
  );
  return opened ? 'sheet' : 'failed';
}
