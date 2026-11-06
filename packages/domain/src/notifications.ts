/** Catégories de notifications V5 (spec-v5 §9, D-028). */

export const NOTIFICATION_CATEGORIES_V5 = ['SAFETY', 'OUTING', 'HUMAN_MESSAGE', 'CONNECTION', 'VOTE', 'DUO', 'RELIABILITY', 'SYSTEM'] as const;
export type NotificationCategoryV5 = (typeof NOTIFICATION_CATEGORIES_V5)[number];

/** Catégories V4 plus émises en V5. */
export const RETIRED_NOTIFICATION_CATEGORIES = ['STREAK', 'REAL_WAIT', 'NEIGHBORHOOD', 'MISSION', 'MATCH'] as const;
