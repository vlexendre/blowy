/** Configuration serveur du web public (jamais exposée au navigateur). */
export const API_URL = process.env.WEB_API_URL ?? 'http://localhost:3000';
export const BLOWY_ENV = process.env.BLOWY_ENV ?? 'local';
export const IS_LOCAL = BLOWY_ENV === 'local' || BLOWY_ENV === 'test';
export const STORES = {
  appStore: process.env.APP_STORE_URL ?? 'https://apps.apple.com/',
  playStore: process.env.PLAY_STORE_URL ?? 'https://play.google.com/store/apps/details?id=app.blowy',
};
export const VISITOR_COOKIE = 'blowy_v';
export const SENT_COOKIE = 'blowy_sent';
/** Clé publique VAPID (publique par nature) : active le bouton « Me prévenir » de la page ange gardien. */
export const WEB_PUSH_PUBLIC_KEY = process.env.WEB_PUSH_VAPID_PUBLIC_KEY && /^[A-Za-z0-9_-]{86,88}$/.test(process.env.WEB_PUSH_VAPID_PUBLIC_KEY) ? process.env.WEB_PUSH_VAPID_PUBLIC_KEY : null;
