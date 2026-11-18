/**
 * Ce que le semis demande à la base en plus des dépôts de l'API (port, avec un adaptateur Supabase et un adaptateur
 * mémoire) : compter les comptes qui ne sont pas du semis (garde-fou), créer et supprimer les comptes d'authentification
 * du semis, et retrouver tout ce qu'il a créé pour la purge.
 */
export const SEED_STORE = Symbol('SEED_STORE');

export interface SeedStore {
  /**
   * Comptes (auth.users, et profils sans compte en mémoire) dont l'adresse n'est pas « attendue » dans une base de test
   * (`isExpected`). S'arrête dès que `stopAfter` est dépassé.
   */
  countForeignAccounts(isExpected: (email: string | null) => boolean, stopAfter: number): Promise<number>;
  /** Compte d'authentification du semis : adresse `.invalid`, sans mot de passe, banni (aucune connexion), marqué. */
  ensureAccount(id: string, email: string): Promise<void>;
  /** Comptes du semis (adresse du domaine du semis), monde compris. */
  seedAccountIds(): Promise<string[]>;
  /** Identifiant du compte de cette adresse (pour rattacher un compte de test au monde du semis). */
  accountIdByEmail(email: string): Promise<string | null>;
  /** Supprime un compte d'authentification (cascade : profil, minimoa, liens, messages…). */
  removeAccount(id: string): Promise<void>;
  /** Comptes hors semis rattachés au monde `world` : rendus à tout le monde (avant de supprimer ce monde). */
  detachFromWorld(world: string, keep: (id: string) => boolean): Promise<number>;
  /** Supprime les groupes créés par ces comptes (membres, messages, jours : cascade). */
  removeGroupsCreatedBy(ids: readonly string[]): Promise<number>;
  /** Supprime les inscriptions de quartier du semis (identifiant du semis ou adresse du domaine du semis). */
  removeSeedSignups(): Promise<number>;
  /** Supprime les quartiers créés par le semis (`createdAt`) qui n'ont plus aucune inscription. */
  removeEmptySeedZones(createdAt: string): Promise<number>;
}
