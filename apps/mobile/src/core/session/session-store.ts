/**
 * Session : jeton opaque en SecureStore (jamais AsyncStorage), état en mémoire Zustand.
 *
 * Correctif T7 (banc QA : ouverture à froid d'une route profonde → requêtes parties avant la
 * restauration du jeton → 401 → jeton effacé) :
 *  1. `currentToken()` ATTEND la restauration (`whenRestored`) avant de répondre ;
 *  2. un 401 n'efface la session que s'il répond à une requête envoyée AVEC le jeton courant
 *     (`shouldClearOn401`) — une requête partie sans jeton ou avec un ancien jeton n'efface rien ;
 *  3. la racine ne rend les écrans qu'une fois la session restaurée (`SessionGate`).
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
  restore(secret: SecretStoragePort, now?: number): Promise<void>;
  save(secret: SecretStoragePort, s: Session): Promise<void>;
  clear(secret: SecretStoragePort): Promise<void>;
  /** Session imposée (mode démo local uniquement, voir core/demo). */
  adopt(s: { token: string; userId: string; expiresAt: string }): void;
}

let resolveRestored: () => void = () => undefined;
let restored = new Promise<void>((r) => {
  resolveRestored = r;
});

/** Résolue dès que la session a été lue en SecureStore (ou imposée). */
export const whenRestored = (): Promise<void> => restored;

export const useSession = create<SessionStore>((set) => ({
  status: 'unknown',
  token: null,
  userId: null,
  expiresAt: null,
  async restore(secret, now = Date.now()) {
    try {
      const [token, meta] = await Promise.all([secret.get(TOKEN_KEY), secret.get(META_KEY)]);
      const m = meta ? (JSON.parse(meta) as { userId: string; expiresAt: string }) : null;
      if (token && m && new Date(m.expiresAt).getTime() > now) set({ status: 'signedIn', token, userId: m.userId, expiresAt: m.expiresAt });
      else if (useSession.getState().status === 'unknown') set({ status: 'signedOut', token: null, userId: null, expiresAt: null });
    } catch {
      if (useSession.getState().status === 'unknown') set({ status: 'signedOut', token: null, userId: null, expiresAt: null });
    } finally {
      resolveRestored();
    }
  },
  async save(secret, s) {
    await secret.set(TOKEN_KEY, s.accessToken);
    await secret.set(META_KEY, JSON.stringify({ userId: s.userId, expiresAt: s.expiresAt }));
    set({ status: 'signedIn', token: s.accessToken, userId: s.userId, expiresAt: s.expiresAt });
    resolveRestored();
  },
  async clear(secret) {
    await Promise.all([secret.remove(TOKEN_KEY), secret.remove(META_KEY)]);
    set({ status: 'signedOut', token: null, userId: null, expiresAt: null });
  },
  adopt(s) {
    set({ status: 'signedIn', token: s.token, userId: s.userId, expiresAt: s.expiresAt });
    resolveRestored();
  },
}));

/** Jeton à joindre à une requête : attend la restauration (jamais `null` par simple course). */
export const currentToken = async (): Promise<string | null> => {
  await restored;
  return useSession.getState().token;
};

/** Décision pure : un 401 ne vaut révocation que pour le jeton courant effectivement envoyé. */
export function shouldClearOn401(sentToken: string | null, current: string | null): boolean {
  return sentToken !== null && current !== null && sentToken === current;
}

/** Tests uniquement : remet la promesse de restauration à zéro. */
export function resetSessionForTests(): void {
  restored = new Promise<void>((r) => {
    resolveRestored = r;
  });
  useSession.setState({ status: 'unknown', token: null, userId: null, expiresAt: null });
}
