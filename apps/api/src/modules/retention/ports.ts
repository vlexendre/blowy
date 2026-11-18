/** Conservation des données (politique de confidentialité) : comptes inactifs, exclusions, purge de la modération. */
import type { Day } from '@blowy/domain';

export const RETENTION = Symbol('RETENTION');

export interface InactiveAccount {
  userId: string;
  lastActiveOn: Day;
  /** Jour où la prévenance est partie (null : pas encore prévenu depuis la dernière connexion). */
  noticedOn: Day | null;
}

export interface RetentionRepository {
  /** Dernier jour d'activité (au plus une écriture par personne et par jour) ; efface la prévenance. */
  touch(userId: string, day: Day): Promise<void>;
  /** Dernier jour d'activité d'une personne (null : profil inconnu). Lu par les notifications (décroissance). */
  lastActiveOn(userId: string): Promise<Day | null>;
  /** Comptes inactifs depuis `lastActiveOn <= cutoff` et pas encore prévenus, les plus anciens d'abord. */
  listToNotice(cutoff: Day, limit: number): Promise<InactiveAccount[]>;
  /** Comptes inactifs depuis `lastActiveOn <= cutoff` et prévenus au plus tard le `noticedBy`. */
  listToDelete(cutoff: Day, noticedBy: Day, limit: number): Promise<InactiveAccount[]>;
  markNoticed(userIds: readonly string[], day: Day): Promise<void>;

  /** Empreintes (SHA-256) des identifiants Apple ou Google d'un compte exclu, gardées jusqu'à `until`. */
  addBans(hashes: readonly string[], at: string, until: string): Promise<void>;
  /** Vrai si l'une de ces empreintes est exclue à `now`. */
  isBanned(hashes: readonly string[], now: string): Promise<boolean>;
  purgeBans(now: string): Promise<number>;

  /** Signalements clos (traités) avant `before` : effacés. */
  purgeClosedReports(before: string): Promise<number>;
  /** Décisions de modération (journal) antérieures à `before` : effacées. */
  purgeAuditLog(before: string): Promise<number>;
}
