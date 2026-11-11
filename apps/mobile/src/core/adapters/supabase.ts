import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UploadTicket } from '@blowy/contract';
import { createClient, type Session as SbSession, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { config } from '../config';
import { AuthError, type AuthPort, type MediaPort, type PickedImage, type RealtimePort, type Session } from '../ports';
import { pickImage } from './image-picker';

const BUCKET = 'media';

export function createSupabase(): SupabaseClient {
  const client = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
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
  if (status === 429) return new AuthError('rate_limited', 'Trop de tentatives. Réessaie dans une minute.');
  if (/invalid|expired|otp/i.test(message)) return new AuthError('invalid_code', 'Ce code n’est pas le bon, ou il a expiré.');
  if (/network|fetch/i.test(message)) return new AuthError('network', 'Connexion impossible. Vérifie ton réseau.');
  return new AuthError('unknown', 'Une erreur est survenue. Réessaie.');
}

export function supabaseAuth(sb: SupabaseClient): AuthPort {
  return {
    async getSession() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },
    async getToken() {
      const { data } = await sb.auth.getSession();
      return data.session?.access_token ?? null;
    },
    async sendCode(email) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw authError(error.message, error.status);
    },
    async verifyCode(email, code) {
      const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw authError(error.message, error.status);
      const session = toSession(data.session);
      if (!session) throw new AuthError('unknown', 'Une erreur est survenue. Réessaie.');
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
