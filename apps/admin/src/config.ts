/**
 * Configuration lue au build (variables Vite, publiques : aucune n'est un secret).
 * - VITE_API_URL : URL de l'API (ex. https://api.minimoa.app)
 * - VITE_AUTH : `supabase` (défaut) ou `local` (API en mémoire, code 000000)
 * - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY : projet Supabase (clé publique « anon »)
 * - VITE_APP_ENV : `dev` pour l'admin de test (https://admin-dev.minimoa.app) : bandeau « DEV » ; absent : production
 */
const env = import.meta.env;

export const config = {
  apiUrl: (env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000',
  auth: ((env.VITE_AUTH as string | undefined) ?? 'supabase') === 'local' ? ('local' as const) : ('supabase' as const),
  supabaseUrl: (env.VITE_SUPABASE_URL as string | undefined) ?? '',
  supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '',
  appEnv: ((env.VITE_APP_ENV as string | undefined) ?? '').trim().toLowerCase() === 'dev' ? ('dev' as const) : ('production' as const),
};
