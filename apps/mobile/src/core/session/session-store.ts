/**
 * Session : jeton opaque en SecureStore (jamais AsyncStorage), état en mémoire Zustand.
 */
import type { Session } from '@blowy/api-contract';
import { create } from 'zustand';
import type { SecretStoragePort } from '../ports/storage';

const TOKEN_KEY = 'blowy.session.token';
const META_KEY = 'blowy.session.meta';

export interface SessionState {
  status: 'unknown' | 'signedOut' | 'signedIn';
  token: string | null;
  userId: string | null;
  expiresAt: string | null;
}

interface SessionStore extends SessionState {
  restore(secret: SecretStoragePort): Promise<void>;
  save(secret: SecretStoragePort, s: Session): Promise<void>;
  clear(secret: SecretStoragePort): Promise<void>;
}

export const useSession = create<SessionStore>((set) => ({
  status: 'unknown',
  token: null,
  userId: null,
  expiresAt: null,
  async restore(secret) {
    const [token, meta] = await Promise.all([secret.get(TOKEN_KEY), secret.get(META_KEY)]);
    const m = meta ? (JSON.parse(meta) as { userId: string; expiresAt: string }) : null;
    if (token && m && new Date(m.expiresAt).getTime() > Date.now()) set({ status: 'signedIn', token, userId: m.userId, expiresAt: m.expiresAt });
    else set({ status: 'signedOut', token: null, userId: null, expiresAt: null });
  },
  async save(secret, s) {
    await secret.set(TOKEN_KEY, s.accessToken);
    await secret.set(META_KEY, JSON.stringify({ userId: s.userId, expiresAt: s.expiresAt }));
    set({ status: 'signedIn', token: s.accessToken, userId: s.userId, expiresAt: s.expiresAt });
  },
  async clear(secret) {
    await Promise.all([secret.remove(TOKEN_KEY), secret.remove(META_KEY)]);
    set({ status: 'signedOut', token: null, userId: null, expiresAt: null });
  },
}));

export const currentToken = (): Promise<string | null> => Promise.resolve(useSession.getState().token);
