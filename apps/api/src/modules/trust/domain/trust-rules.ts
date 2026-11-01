/** Règles de signalement / blocage / suppression (P-5.15, §19). Pures. */
export const REPORT_CASE_PRIORITY: Record<string, 1 | 2 | 3> = {
  MINOR: 1,
  SAFETY: 1,
  MONEY_REQUEST: 1,
  HARASSMENT: 2,
  INAPPROPRIATE: 2,
  FAKE_PROFILE: 3,
  OTHER: 3,
};

/** SLA cible (objectif opérationnel mesuré, pas une promesse) : 24 h, 4 h pour priorité 1. */
export function caseDueAt(now: Date, priority: 1 | 2 | 3): Date {
  return new Date(now.getTime() + (priority === 1 ? 4 : 24) * 3_600_000);
}

/** Purge en ligne différée après suppression et échéance de rotation des sauvegardes. */
export const DELETION_ONLINE_PURGE_DELAY_MS = 0;
export const BACKUP_ROTATION_DAYS = 35;
export const EXPORT_LINK_TTL_MS = 7 * 86_400_000;
