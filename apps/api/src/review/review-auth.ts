/**
 * Comptes du monde de revue d'Apple (ports, avec adaptateur réel et adaptateur mémoire) :
 * - `ReviewAuth` ouvre une vraie session pour l'adresse de revue, sans e-mail envoyé : Supabase Auth (admin) crée le
 *   compte s'il manque, émet un lien de connexion à usage unique (`generateLink`, rien n'est envoyé) que l'API échange
 *   aussitôt contre une session (`verifyOtp`) sur un client jetable (jamais le client de service partagé) ;
 * - `FixtureAccounts` crée les comptes d'authentification des personnes fictives (la base l'exige : `profiles.id`
 *   référence `auth.users`) : adresse réservée `…@review.blowy.invalid`, sans mot de passe, bannis (aucune connexion
 *   possible), marqués `blowy_review_fixture` ; jamais d'e-mail (le notifieur ignore les adresses `.invalid`).
 */
import { createHash } from 'node:crypto';
import { createClient, type EmailOtpType } from '@supabase/supabase-js';
import type { MemoryDb } from '../persistence/memory-db';
import type { Db } from '../persistence/database.types';

export const REVIEW_AUTH = Symbol('REVIEW_AUTH');
export const FIXTURE_ACCOUNTS = Symbol('FIXTURE_ACCOUNTS');

export interface ReviewSessionTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface ReviewAuth {
  /** Ouvre une session pour cette adresse (crée le compte d'authentification s'il n'existe pas). */
  sessionFor(email: string): Promise<ReviewSessionTokens>;
}

export interface FixtureAccounts {
  /** Le compte d'authentification de la personne fictive existe (créé banni s'il manquait). */
  ensure(id: string, email: string): Promise<void>;
  /** Supprime le compte d'authentification (et, par cascade, tout ce qui va avec). */
  remove(id: string): Promise<void>;
}

/** Adresse réservée d'une personne fictive (RFC 2606 : `.invalid` n'existe jamais). */
export const fixtureEmail = (world: string, slot: number): string => `fixture-${slot}-${world.slice(0, 8)}@review.blowy.invalid`;

const already = (message: string): boolean => /already|exists|registered|duplicate/i.test(message);

export class SupabaseReviewAuth implements ReviewAuth {
  constructor(
    private readonly admin: Db,
    private readonly url: string,
    private readonly serviceKey: string,
  ) {}

  async sessionFor(email: string): Promise<ReviewSessionTokens> {
    const created = await this.admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: { blowy_review: true } });
    if (created.error && !already(created.error.message)) throw new Error(`compte de revue non créé : ${created.error.message}`);
    const link = await this.admin.auth.admin.generateLink({ type: 'magiclink', email });
    const hash = link.data.properties?.hashed_token;
    if (link.error || !hash) throw new Error(`lien de connexion de revue non émis : ${link.error?.message ?? 'vide'}`);
    // Client jetable : la session ouverte ici ne doit jamais remplacer la clé de service du client partagé.
    const scratch = createClient(this.url, this.serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await scratch.auth.verifyOtp({ token_hash: hash, type: (link.data.properties.verification_type ?? 'magiclink') as EmailOtpType });
    if (error || !data.session || !data.user) throw new Error(`session de revue non ouverte : ${error?.message ?? 'vide'}`);
    return { userId: data.user.id, accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
  }
}

/** Identifiant stable de l'adresse de revue en mémoire (même adresse, même compte). */
export function memoryReviewUserId(email: string): string {
  const h = createHash('sha256').update(`blowy-review-account|${email}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** En mémoire (local, tests) : le jeton de test habituel `test:<uuid>:<e-mail>`. */
export class MemoryReviewAuth implements ReviewAuth {
  constructor(private readonly db: MemoryDb) {}

  async sessionFor(email: string): Promise<ReviewSessionTokens> {
    const userId = memoryReviewUserId(email);
    this.db.deletedUsers.delete(userId);
    this.db.authEmails.set(userId, email);
    return { userId, accessToken: `test:${userId}:${email}`, refreshToken: '' };
  }
}

export class SupabaseFixtureAccounts implements FixtureAccounts {
  constructor(private readonly admin: Db) {}

  async ensure(id: string, email: string): Promise<void> {
    const { error } = await this.admin.auth.admin.createUser({ id, email, email_confirm: true, ban_duration: '876000h', app_metadata: { blowy_review_fixture: true } });
    if (error && !already(error.message)) throw new Error(`personne fictive non créée : ${error.message}`);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.admin.auth.admin.deleteUser(id);
    if (error && !/not.?found/i.test(error.message)) throw new Error(`personne fictive non supprimée : ${error.message}`);
  }
}

export class MemoryFixtureAccounts implements FixtureAccounts {
  constructor(private readonly db: MemoryDb) {}

  async ensure(id: string, email: string): Promise<void> {
    this.db.deletedUsers.delete(id);
    this.db.authEmails.set(id, email);
  }

  async remove(id: string): Promise<void> {
    this.db.deleteUser(id);
  }
}
