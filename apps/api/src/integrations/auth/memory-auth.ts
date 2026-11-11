import type { MemoryDb } from '../../persistence/memory-db';
import type { AuthAdmin, AuthUser, AuthVerifier, UserEmails } from './ports';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Jetons locaux : `test:<uuid>` ou `test:<uuid>:<email>` (l'e-mail est retenu pour les envois). */
export class MemoryAuthVerifier implements AuthVerifier {
  constructor(private readonly db: MemoryDb) {}

  async verify(token: string): Promise<AuthUser | null> {
    const [scheme, userId, ...rest] = token.split(':');
    if (scheme !== 'test' || !userId || !UUID.test(userId)) return null;
    const id = userId.toLowerCase();
    if (this.db.deletedUsers.has(id)) return null;
    const email = rest.length > 0 ? rest.join(':') : null;
    if (email) this.db.authEmails.set(id, email);
    return { userId: id, email: email ?? this.db.authEmails.get(id) ?? null };
  }
}

export class MemoryAuthAdmin implements AuthAdmin {
  constructor(private readonly db: MemoryDb) {}

  async deleteUser(userId: string): Promise<void> {
    this.db.deleteUser(userId);
  }
}

export class MemoryUserEmails implements UserEmails {
  constructor(private readonly db: MemoryDb) {}

  async emailOf(userId: string): Promise<string | null> {
    return this.db.authEmails.get(userId) ?? null;
  }
}
