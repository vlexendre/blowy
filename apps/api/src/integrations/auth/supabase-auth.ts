import { Logger } from '@nestjs/common';
import type { Db } from '../../persistence/database.types';
import type { Clock } from '../../shared/clock';
import type { AuthAdmin, AuthUser, AuthVerifier, UserEmails } from './ports';

const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 5_000;

/** Vérifie les jetons auprès de Supabase Auth, avec un petit cache mémoire de 60 s par jeton. */
export class SupabaseAuthVerifier implements AuthVerifier {
  private readonly cache = new Map<string, { user: AuthUser; until: number }>();

  constructor(
    private readonly client: Db,
    private readonly clock: Clock,
  ) {}

  async verify(token: string): Promise<AuthUser | null> {
    const now = this.clock.now().getTime();
    const hit = this.cache.get(token);
    if (hit && hit.until > now) return hit.user;
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      this.cache.delete(token);
      return null;
    }
    // Une adresse non confirmée ne vaut rien (accès administrateur, compte de revue) : seulement si elle est vérifiée.
    const user: AuthUser = { userId: data.user.id, email: data.user.email_confirmed_at ? (data.user.email ?? null) : null };
    if (this.cache.size >= CACHE_MAX) this.cache.clear();
    this.cache.set(token, { user, until: now + CACHE_TTL_MS });
    return user;
  }
}

export class SupabaseAuthAdmin implements AuthAdmin {
  constructor(private readonly client: Db) {}

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.client.auth.admin.deleteUser(userId);
    if (error) throw new Error(`suppression du compte impossible : ${error.message}`);
  }

  /** Identités du compte (`auth.identities`) : `sub` d'Apple ou de Google, e-mail pour le fournisseur « email ». */
  async subjectsOf(userId: string): Promise<{ provider: string; subject: string }[]> {
    const { data, error } = await this.client.auth.admin.getUserById(userId);
    if (error || !data.user) return [];
    const out: { provider: string; subject: string }[] = [];
    for (const identity of data.user.identities ?? []) {
      const info: Record<string, unknown> = identity.identity_data ?? {};
      const subject = identity.provider === 'email' ? String(info.email ?? data.user.email ?? '') : String(info.sub ?? identity.id ?? '');
      if (subject) out.push({ provider: identity.provider, subject });
    }
    if (out.length === 0 && data.user.email) out.push({ provider: 'email', subject: data.user.email });
    return out;
  }
}

export class SupabaseUserEmails implements UserEmails {
  private readonly logger = new Logger('UserEmails');

  constructor(private readonly client: Db) {}

  async emailOf(userId: string): Promise<string | null> {
    const { data, error } = await this.client.auth.admin.getUserById(userId);
    if (error) {
      this.logger.warn(`e-mail introuvable : ${error.message}`);
      return null;
    }
    return data.user.email ?? null;
  }
}
