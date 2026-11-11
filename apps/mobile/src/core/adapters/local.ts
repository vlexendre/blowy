/**
 * Adaptateurs locaux : développement sans Supabase, avec l'API lancée en mode mémoire
 * (jeton « test:<uuid>:<email> »). Jamais actifs dans un build de production (voir config.auth).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UploadTicket } from '@blowy/contract';

import { AuthError, type AuthPort, type MediaPort, type PickedImage, type RealtimePort, type Session } from '../ports';
import { pickImage } from './image-picker';

const KEY = 'blowy.local.session';
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
    getSession: load,
    async getToken() {
      const s = await load();
      return s ? `test:${s.userId}:${s.email ?? ''}` : null;
    },
    async sendCode(email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError('invalid_email', 'Cette adresse e-mail ne semble pas valide.');
    },
    async verifyCode(email, code) {
      if (code !== LOCAL_CODE) throw new AuthError('invalid_code', 'Ce code n’est pas le bon, ou il a expiré.');
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
