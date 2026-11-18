import 'react-native-url-polyfill/auto';

import type { UploadTicket } from '@blowy/contract';
import { createClient, type Session as SbSession, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppState, Platform } from 'react-native';

import { config } from '../config';
import { AuthError, type AuthPort, type AuthProvider, type MediaPort, type PickedImage, type RealtimePort, type Session } from '../ports';
import { appleSignIn } from './apple-sign-in';
import { pickImage } from './image-picker';
import { reviewSession } from './review-session';
import { sessionStorage } from './session-storage';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const BUCKET = 'media';

export function createSupabase(): SupabaseClient {
  const client = createClient(config.supabaseUrl, config.supabaseKey, {
    // PKCE : la connexion Google revient avec un `code` échangé par l'app (exchangeCodeForSession), jamais un jeton dans l'URL.
    auth: { storage: sessionStorage(), autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
  });
  // Le rafraîchissement du jeton ne tourne que quand l'app est au premier plan.
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    });
  }
  return client;
}

const toSession = (s: SbSession | null): Session | null => (s ? { userId: s.user.id, email: s.user.email ?? null } : null);

function authError(message: string, status?: number): AuthError {
  if (status === 429) return new AuthError('rate_limited', common.errors.rateLimited);
  if (/invalid|expired|otp/i.test(message)) return new AuthError('invalid_code', common.errors.invalidCode);
  if (/network|fetch/i.test(message)) return new AuthError('network', common.errors.network);
  return new AuthError('unknown', common.errors.unknown);
}

/**
 * Fournisseurs proposés : Apple sur iPhone (règle d'Apple : obligatoire dès qu'on propose une connexion tierce, et
 * c'est la seule ici), Google sur Android et le web. Plus de code par e-mail pour les vrais comptes.
 */
export const platformProviders = (): readonly AuthProvider[] => (Platform.OS === 'ios' ? ['apple'] : ['google']);

/**
 * Adresse de retour de la connexion Google (`minimoa://auth-callback`, ou la même origine sur le web). L'app accepte
 * aussi `blowy://auth-callback` (second schéma) ; les deux sont à lister dans Supabase (docs/CONNEXION.md).
 * App « Minimoa Dev » : son seul schéma, `minimoa-dev://auth-callback` (app.config.ts, docs/ENVIRONNEMENTS.md).
 */
export function oauthRedirect(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/auth-callback`;
  const configured = Constants.expoConfig?.scheme;
  const scheme = (Array.isArray(configured) ? configured[0] : configured) ?? 'minimoa';
  return Linking.createURL('auth-callback', { scheme });
}

/** La session ouverte par le fournisseur (absente : échec, jamais une annulation). */
function opened(s: SbSession | null): Session {
  const session = toSession(s);
  if (!session) throw new AuthError('unknown', onboarding.connexion.errors.failed);
  return session;
}

function providerError(e: unknown): AuthError {
  if (e instanceof AuthError) return e;
  const message = e instanceof Error ? e.message : '';
  if (/network|fetch/i.test(message)) return new AuthError('network', common.errors.network);
  return new AuthError('unknown', onboarding.connexion.errors.failed);
}

/** Apple : jeton d'identité de la feuille système → `signInWithIdToken` (procédé documenté par Supabase pour Expo). */
async function withApple(sb: SupabaseClient): Promise<Session | null> {
  const credential = await appleSignIn();
  if (!credential) return null;
  const { data, error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
  if (error) throw authError(error.message, error.status);
  const session = opened(data.session);
  // Le code d'autorisation part ensuite à l'API (révocation à la suppression du compte, exigence d'Apple).
  return credential.authorizationCode ? { ...session, appleAuthorizationCode: credential.authorizationCode } : session;
}

/**
 * Google : page de connexion de Google dans le navigateur du système (onglet personnalisé sur Android, fenêtre sur le
 * web), flux PKCE de Supabase, puis échange du `code` contre la session. Aucun module natif ni identifiant Google dans
 * l'app : tout se règle dans Supabase (docs/CONNEXION.md).
 */
async function withGoogle(sb: SupabaseClient): Promise<Session | null> {
  const redirectTo = oauthRedirect();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data.url) throw authError(error?.message ?? 'oauth', error?.status);
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;
  const url = new URL(result.url);
  const params = new URLSearchParams(url.search || url.hash.replace(/^#/, ''));
  const code = params.get('code');
  if (!code) {
    // Refus sur la page de Google (« access_denied ») : c'est une annulation.
    if (params.get('error') === 'access_denied') return null;
    throw new AuthError('unknown', onboarding.connexion.errors.failed);
  }
  const exchanged = await sb.auth.exchangeCodeForSession(code);
  if (exchanged.error) throw authError(exchanged.error.message, exchanged.error.status);
  return opened(exchanged.data.session);
}

export function supabaseAuth(sb: SupabaseClient): AuthPort {
  return {
    providers: platformProviders(),
    async signInWith(provider) {
      try {
        return provider === 'apple' ? await withApple(sb) : await withGoogle(sb);
      } catch (e) {
        throw providerError(e);
      }
    },
    async getSession() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },
    async getToken() {
      const { data } = await sb.auth.getSession();
      return data.session?.access_token ?? null;
    },
    async signInWithEmailCode(email, code) {
      const r = await reviewSession(email, code);
      const { data, error } = await sb.auth.setSession({ access_token: r.accessToken, refresh_token: r.refreshToken });
      if (error) throw authError(error.message, error.status);
      return opened(data.session);
    },
    async sendCode(email) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw authError(error.message, error.status);
    },
    async verifyCode(email, code) {
      const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw authError(error.message, error.status);
      const session = toSession(data.session);
      if (!session) throw new AuthError('unknown', common.errors.unknown);
      return session;
    },
    async signOut() {
      await sb.auth.signOut();
    },
    onChange(listener) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => listener(toSession(session)));
      return () => data.subscription.unsubscribe();
    },
  };
}

/** Temps réel : les politiques RLS ne laissent passer que les lignes des liens de la personne connectée. */
export function supabaseRealtime(sb: SupabaseClient): RealtimePort {
  return {
    subscribe(onChange) {
      const channel = sb
        .channel('blowy-links')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const row = payload.new as { link_id?: string };
          onChange({ linkId: row.link_id ?? null });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'links' }, (payload) => {
          const row = payload.new as { id?: string };
          onChange({ linkId: row.id ?? null });
        })
        // Groupes (spéc. §26) : RLS « membres : lire les messages de leurs groupes » (membres actifs seulement).
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
          const row = payload.new as { group_id?: string };
          onChange({ linkId: null, groupId: row.group_id ?? null });
        })
        .subscribe();
      return () => {
        void sb.removeChannel(channel);
      };
    },
  };
}

export function supabaseMedia(sb: SupabaseClient): MediaPort {
  return {
    pick: pickImage,
    async upload(ticket: UploadTicket, image: PickedImage) {
      const body = await (await fetch(image.uri)).arrayBuffer();
      const { error } = await sb.storage.from(BUCKET).uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: image.contentType });
      if (error) throw new Error('upload_failed');
    },
  };
}
