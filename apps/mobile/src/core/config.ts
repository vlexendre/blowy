/** Configuration publique de l'app (aucun secret). */
// Expo n'inscrit dans le bundle que les lectures littérales `process.env.EXPO_PUBLIC_*`.
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
/** L'auth locale n'est acceptée que face à une API locale : impossible de l'activer contre la production. */
const isLocalApi = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:|\/|$)/.test(apiUrl);

export const config = {
  apiUrl,
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? 'https://blowy.app',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  /** `local` : connexion factice (code 000000) pour le développement, avec l'API en mode mémoire. */
  auth: process.env.EXPO_PUBLIC_AUTH === 'local' && isLocalApi ? ('local' as const) : ('supabase' as const),
  /**
   * `1` : envoyer à l'API les jetons APNs des activités en direct (`kind: 'apns_live_activity'`). À n'activer que
   * lorsque l'API range ce type de jeton à part (sinon il serait pris pour un jeton Expo) : docs/WIDGETS.md.
   */
  /** Identifiant de l'app Meta (public), exigé par Instagram pour recevoir une image en story. Vide : feuille de partage du système. */
  facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
  liveActivityPush: process.env.EXPO_PUBLIC_LIVE_ACTIVITY_PUSH === '1',
} as const;

export const inviteUrl = (code: string): string => `${config.webUrl}/i/${code}`;
export const wordsUrl = (code: string): string => `${config.webUrl}/m/${code}`;
