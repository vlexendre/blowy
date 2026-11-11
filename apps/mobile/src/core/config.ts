/** Configuration publique de l'app (aucun secret). */
const env = process.env;

export const config = {
  apiUrl: env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  webUrl: env.EXPO_PUBLIC_WEB_URL ?? 'https://blowy.app',
  supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  /** `local` : connexion factice pour le développement, avec l'API en mode mémoire. Refusé en build de production. */
  auth: env.EXPO_PUBLIC_AUTH === 'local' && __DEV__ ? ('local' as const) : ('supabase' as const),
} as const;

export const inviteUrl = (code: string): string => `${config.webUrl}/i/${code}`;
export const wordsUrl = (code: string): string => `${config.webUrl}/m/${code}`;
