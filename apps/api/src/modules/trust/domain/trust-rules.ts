/** Règles de signalement / blocage / suppression (P-5.15, §19). Pures. */
export const REPORT_CASE_PRIORITY: Record<string, 1 | 2 | 3> = {
  MINOR: 1,
  SAFETY: 1,
  MONEY_REQUEST: 1,
  HARASSMENT: 2,
  INAPPROPRIATE: 2,
  FAKE_PROFILE: 3,
  OTHER: 3,
  // V5.1 G.19 / V5.2 H.23 : réponse humaine < 1 h pendant les créneaux de sortie.
  OUTING_THREAT: 1,
  IRL_BEHAVIOR: 1,
  ON_SITE_INCIDENT: 1,
  REPEATED_NO_SHOW: 3,
};

/** Motifs « sortie » à réponse humaine < 1 h (affichée dans l'app pendant les créneaux). */
export const ONE_HOUR_CATEGORIES: ReadonlySet<string> = new Set(['OUTING_THREAT', 'IRL_BEHAVIOR', 'ON_SITE_INCIDENT', 'SAFETY']);
export const HUMAN_RESPONSE_MINUTES = 60;

/** SLA cible (objectif opérationnel mesuré, pas une promesse) : 24 h, 4 h pour priorité 1. */
export function caseDueAt(now: Date, priority: 1 | 2 | 3): Date {
  return new Date(now.getTime() + (priority === 1 ? 4 : 24) * 3_600_000);
}

/** Échéance d'un dossier de signalement : 1 h pour les motifs « sortie » et sécurité, sinon SLA général. */
export function reportDueAt(now: Date, category: string, priority: 1 | 2 | 3): Date {
  return ONE_HOUR_CATEGORIES.has(category) ? new Date(now.getTime() + HUMAN_RESPONSE_MINUTES * 60_000) : caseDueAt(now, priority);
}

/** Purge en ligne différée après suppression et échéance de rotation des sauvegardes. */
export const DELETION_ONLINE_PURGE_DELAY_MS = 0;
export const BACKUP_ROTATION_DAYS = 35;
export const EXPORT_LINK_TTL_MS = 7 * 86_400_000;
