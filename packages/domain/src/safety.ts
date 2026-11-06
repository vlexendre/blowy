/** Sécurité V5 : ange gardien par lien web, alertes (spec-v5 §2.9, D-024). */

export const GUARDIAN_SUBJECT_KINDS = ['OUTING', 'DUO_DATE'] as const;
export type GuardianSubjectKind = (typeof GUARDIAN_SUBJECT_KINDS)[number];

export const GUARDIAN_TIMELINE_TYPES = ['CHECKED_IN', 'OK', 'ALERT', 'ENDED'] as const;
export type GuardianTimelineType = (typeof GUARDIAN_TIMELINE_TYPES)[number];

export const SAFETY_ALERT_STATUSES = ['OPEN', 'SAFE', 'HANDLED'] as const;
export type SafetyAlertStatus = (typeof SAFETY_ALERT_STATUSES)[number];

/** Numéros d'urgence affichés (France). */
export const EMERGENCY_NUMBERS = ['112', '17'] as const;

/** Longueur maximale du libellé privé d'un lien gardien (« Maman », « Coloc »). */
export const GUARDIAN_LABEL_MAX = 30;
/** Octets d'entropie du jeton de lien gardien (base64url, haché SHA-256 en base). */
export const GUARDIAN_TOKEN_BYTES = 32;
