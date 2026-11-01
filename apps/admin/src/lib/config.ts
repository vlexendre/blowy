/** Configuration serveur de l'admin (jamais exposée au navigateur). */
export const API_URL = process.env.ADMIN_API_URL ?? 'http://localhost:3000';
export const BLOWY_ENV = process.env.BLOWY_ENV ?? 'local';
/** Cookies Secure partout sauf en local/test (http://localhost). */
export const SECURE_COOKIES = BLOWY_ENV !== 'local' && BLOWY_ENV !== 'test';
export const COOKIE = { session: 'blowy_staff', csrf: 'blowy_staff_csrf', pending: 'blowy_staff_pending' } as const;
