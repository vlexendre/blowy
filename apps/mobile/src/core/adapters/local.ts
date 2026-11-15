/**
 * Adaptateurs locaux : développement sans Supabase, avec l'API lancée en mode mémoire
 * (jeton « test:<uuid>:<email> »). Jamais actifs dans un build de production (voir config.auth).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UploadTicket } from '@blowy/contract';

import { AuthError, type AuthPort, type MediaPort, type PickedImage, type RealtimePort, type Session } from '../ports';
import { pickImage } from './image-picker';
import { reviewSession } from './review-session';
import { common } from '@/locales/common';
import { onboarding } from '@/locales/onboarding';

const KEY = 'blowy.local.session';
/** Comptes « Apple » / « Google » simulés : le même fournisseur rouvre le même compte (tester « j'ai déjà un compte »). */
const IDS_KEY = 'blowy.local.identities';
export const LOCAL_CODE = '000000';

const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));

export function localAuth(): AuthPort {
  const listeners = new Set<(s: Session | null) => void>();
  let current: Session | null | undefined;
  const load = async (): Promise<Session | null> => {
    if (current === undefined) {
      const raw = await AsyncStorage.getItem(KEY);
      current = raw ? (JSON.parse(raw) as Session) : null;
    }
    return current;
  };
  const set = async (s: Session | null): Promise<void> => {
    current = s;
    if (s) await AsyncStorage.setItem(KEY, JSON.stringify(s));
    else await AsyncStorage.removeItem(KEY);
    listeners.forEach((l) => l(s));
  };
  return {
    // Mode local : les deux boutons des fournisseurs (simulés) et le code par e-mail, pour tout tester sur le web.
    providers: ['apple', 'google', 'email'],
    async signInWith(provider) {
      // Banc d'essai : `globalThis.__BLOWY_AUTH_SIM__ = 'cancel' | 'fail'` simule une annulation ou un échec.
      const sim = (globalThis as { __BLOWY_AUTH_SIM__?: string }).__BLOWY_AUTH_SIM__;
      await new Promise((r) => setTimeout(r, 450));
      if (sim === 'cancel') return null;
      if (sim === 'fail') throw new AuthError('unknown', onboarding.connexion.errors.failed);
      const ids = JSON.parse((await AsyncStorage.getItem(IDS_KEY)) ?? '{}') as Record<string, string>;
      const userId = ids[provider] ?? uuid();
      if (!ids[provider]) await AsyncStorage.setItem(IDS_KEY, JSON.stringify({ ...ids, [provider]: userId }));
      const session = { userId, email: `${provider}-${userId.slice(0, 8)}@local.test` };
      await set(session);
      // « Apple » simulé : un faux code d'autorisation, pour exercer l'envoi à l'API (gardé en mémoire côté API).
      return provider === 'apple' ? { ...session, appleAuthorizationCode: `local-apple-${uuid()}` } : session;
    },
    getSession: load,
    async getToken() {
      const s = await load();
      return s ? `test:${s.userId}:${s.email ?? ''}` : null;
    },
    async signInWithEmailCode(email, code) {
      // Le compte de revue (adresse et code de l'API locale) d'abord ; sinon le code de développement.
      try {
        const r = await reviewSession(email, code);
        const session = { userId: r.userId, email: r.email };
        await set(session);
        return session;
      } catch (e) {
        if (!(e instanceof AuthError) || e.code !== 'invalid_code' || code !== LOCAL_CODE) throw e;
      }
      return this.verifyCode(email, code);
    },
    async sendCode(email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError('invalid_email', common.errors.invalidEmail);
    },
    async verifyCode(email, code) {
      if (code !== LOCAL_CODE) throw new AuthError('invalid_code', common.errors.invalidCode);
      const session = { userId: uuid(), email };
      await set(session);
      return session;
    },
    signOut: () => set(null),
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Sans temps réel : on relit régulièrement. */
export function pollingRealtime(everyMs = 4000): RealtimePort {
  return {
    subscribe(onChange) {
      const id = setInterval(() => onChange({ linkId: null }), everyMs);
      return () => clearInterval(id);
    },
  };
}

export function localMedia(): MediaPort {
  return {
    pick: pickImage,
    async upload(ticket: UploadTicket, image: PickedImage) {
      const body = await (await fetch(image.uri)).arrayBuffer();
      const res = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'content-type': image.contentType }, body });
      if (!res.ok) throw new Error('upload_failed');
    },
  };
}
