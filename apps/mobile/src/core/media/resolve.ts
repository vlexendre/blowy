/**
 * URL média → source affichable. Les schémas `demo-portrait:` / `demo-asset:` ne sont servis que
 * par les fixtures du mode démo local ; en production, seules les URL https du serveur (jetons
 * courts, visages filigranés côté serveur) existent.
 */
import type { MediaSource, PortraitKey } from '@blowy/ui-mobile';

const PORTRAITS: readonly PortraitKey[] = ['lea', 'malo', 'sarah', 'tom', 'jade', 'alex'];

export function resolveMedia(url: string | undefined | null, isPrivate = true): MediaSource | null {
  if (!url) return null;
  if (url.startsWith('demo-portrait:')) {
    const who = url.slice('demo-portrait:'.length) as PortraitKey;
    return PORTRAITS.includes(who) ? { kind: 'portrait', who } : null;
  }
  if (url.startsWith('demo-asset:')) return { kind: 'sprite', path: url.slice('demo-asset:'.length) };
  return /^https:\/\//.test(url) || /^http:\/\/localhost/.test(url) ? { kind: 'uri', uri: url, private: isPrivate } : null;
}
