/**
 * Connexion de l'équipe : code à usage unique envoyé par e-mail (Supabase Auth), comme dans l'app.
 * L'accès réel est décidé par l'API (liste `ADMIN_EMAILS`) ; cette appli n'est qu'un client.
 * Mode local : jeton `test:<uuid>:<email>` accepté par l'API en mémoire, code 000000.
 */
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { config } from './config';

export interface Session {
  email: string;
  token: string;
}

export interface Auth {
  current(): Promise<Session | null>;
  sendCode(email: string): Promise<void>;
  verify(email: string, code: string): Promise<Session>;
  signOut(): Promise<void>;
  onChange(listener: (s: Session | null) => void): () => void;
}

export class AuthFailure extends Error {}

const LOCAL_KEY = 'blowy.admin.session';
export const LOCAL_CODE = '000000';

/** UUID stable tiré de l'adresse (même identifiant d'une session à l'autre en local). */
async function uuidOf(email: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email)));
  const hex = [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function localAuth(): Auth {
  const listeners = new Set<(s: Session | null) => void>();
  const read = (): Session | null => {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  };
  return {
    current: async () => read(),
    async sendCode(email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthFailure('Cette adresse e-mail ne semble pas valide.');
    },
    async verify(email, code) {
      if (code.trim() !== LOCAL_CODE) throw new AuthFailure('Ce code n’est pas le bon (en local : 000000).');
      const clean = email.trim().toLowerCase();
      const session = { email: clean, token: `test:${await uuidOf(clean)}:${clean}` };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(session));
      listeners.forEach((l) => l(session));
      return session;
    },
    async signOut() {
      localStorage.removeItem(LOCAL_KEY);
      listeners.forEach((l) => l(null));
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function supabaseAuth(client: SupabaseClient): Auth {
  const toSession = (s: { access_token: string; user: { email?: string } } | null): Session | null =>
    s ? { email: (s.user.email ?? '').toLowerCase(), token: s.access_token } : null;
  return {
    async current() {
      const { data } = await client.auth.getSession();
      return toSession(data.session);
    },
    async sendCode(email) {
      // Pas de création de compte depuis l'administration : l'adresse doit déjà exister dans Supabase Auth.
      const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
      if (error) throw new AuthFailure('Impossible d’envoyer le code à cette adresse.');
    },
    async verify(email, code) {
      const { data, error } = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      const session = toSession(data.session);
      if (error || !session) throw new AuthFailure('Ce code n’est pas le bon, ou il a expiré.');
      return session;
    },
    async signOut() {
      await client.auth.signOut();
    },
    onChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, s) => listener(toSession(s)));
      return () => data.subscription.unsubscribe();
    },
  };
}

export const auth: Auth =
  config.auth === 'local' ? localAuth() : supabaseAuth(createClient(config.supabaseUrl || 'http://invalid.local', config.supabaseAnonKey || 'missing', { auth: { persistSession: true, autoRefreshToken: true } }));
