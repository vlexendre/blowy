/** Fidélisation (docs/FIDELISATION.md) : journal des messages déjà partis, personnes à qui écrire. */
import type { Day, Locale } from '@blowy/domain';

export const LIFECYCLE_LOG = Symbol('LIFECYCLE_LOG');
export const FIDELITE_PEOPLE = Symbol('FIDELITE_PEOPLE');

/**
 * Journal `lifecycle_messages` : une clé par message parti (une personne, une clé). Réserver la clé AVANT d'envoyer
 * garantit qu'un message ne part qu'une fois, même si deux minuteurs se croisent ou si Apple renvoie une notification.
 */
export interface LifecycleLog {
  /** Réserve la clé ; faux si elle l'était déjà (le message est déjà parti). */
  claim(userId: string, key: string, at: string): Promise<boolean>;
  /** Clés déjà réservées de ces personnes. */
  keys(userIds: readonly string[]): Promise<Map<string, Set<string>>>;
  /** Efface les clés réservées avant `before` (rendant possible, après 400 jours, une nouvelle relance). */
  purge(before: string): Promise<number>;
}

/** Ce qu'il faut savoir d'une personne pour lui donner des nouvelles. */
export interface FidelitePerson {
  userId: string;
  locale: Locale;
  displayName: string;
  createdAt: string;
  /** Dernier jour d'activité (jour de Paris, `profiles.last_active_on`). */
  lastActiveOn: Day;
  /** Compte de revue d'Apple ou personne fictive de son monde : jamais de message. */
  reviewWorld: string | null;
}

export type FideliteFilter =
  /** Inscrites entre ces deux instants (premiers pas, anniversaires). */
  | { by: 'created'; from: string; to: string }
  /** Dernière activité entre ces deux jours inclus (absences). */
  | { by: 'active'; from: Day; to: Day };

export interface FidelitePeople {
  /** Personnes qui répondent au filtre, par identifiant croissant après `afterId`. */
  page(filter: FideliteFilter, afterId: string | null, limit: number): Promise<FidelitePerson[]>;
}
