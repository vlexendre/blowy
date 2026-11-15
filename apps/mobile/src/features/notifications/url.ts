import type { Href } from 'expo-router';

/**
 * Chemin de l'app pour le lien profond d'une notification (`PushData.url`, « blowy://link/<id> » ou
 * « https://blowy.app/… »). Null si le lien est illisible.
 */
export function pathFromPushUrl(url: string): Href | null {
  const m = /^(?:blowy:\/\/|https?:\/\/[^/]+\/)(.*)$/.exec(url.trim());
  if (!m) return null;
  const path = (m[1] ?? '').replace(/^\/+/, '');
  if (!/^[\w\-/.?=&%]*$/.test(path)) return null;
  return `/${path}` as Href;
}

