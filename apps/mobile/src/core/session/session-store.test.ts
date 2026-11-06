import { beforeEach, describe, expect, it } from 'vitest';
import type { SecretStoragePort } from '../ports/storage';
import { currentToken, resetSessionForTests, shouldClearOn401, useSession } from './session-store';

const memory = (init: Record<string, string> = {}): SecretStoragePort => {
  const m = new Map(Object.entries(init));
  return { get: async (k) => m.get(k) ?? null, set: async (k, v) => void m.set(k, v), remove: async (k) => void m.delete(k) } as SecretStoragePort;
};

describe('session : restauration avant les requêtes (bug du banc)', () => {
  beforeEach(() => {
    resetSessionForTests();
    useSession.setState({ status: 'unknown', token: null, userId: null, expiresAt: null });
  });

  it('currentToken attend la restauration au lieu de répondre null', async () => {
    const pending = currentToken();
    await useSession.getState().restore(memory({ 'blowy.session.token': 'tok', 'blowy.session.meta': JSON.stringify({ userId: 'u', expiresAt: '2099-01-01T00:00:00Z' }) }));
    await expect(pending).resolves.toBe('tok');
  });

  it('un 401 sur une requête partie sans jeton ou avec un ancien jeton n’efface rien', () => {
    expect(shouldClearOn401(null, 'tok')).toBe(false);
    expect(shouldClearOn401('old', 'tok')).toBe(false);
    expect(shouldClearOn401('tok', null)).toBe(false);
    expect(shouldClearOn401('tok', 'tok')).toBe(true);
  });

  it('session expirée → déconnecté', async () => {
    await useSession.getState().restore(memory({ 'blowy.session.token': 'tok', 'blowy.session.meta': JSON.stringify({ userId: 'u', expiresAt: '2000-01-01T00:00:00Z' }) }));
    expect(useSession.getState().status).toBe('signedOut');
  });
});
