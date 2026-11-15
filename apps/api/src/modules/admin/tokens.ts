/** Jetons d'injection de l'administration et de la modération (chantier « facturation-admin »). */
export const SUSPENSIONS = Symbol('SUSPENSIONS');
export const AUDIT_LOG = Symbol('AUDIT_LOG');
export const MODERATION = Symbol('MODERATION');
export const ACTIVITY = Symbol('ACTIVITY');
export const DAILY_STATS = Symbol('DAILY_STATS');
export const METRICS_SOURCE = Symbol('METRICS_SOURCE');

/**
 * Garde de compte appelée par la garde d'authentification globale après chaque jeton vérifié :
 * refuse un compte suspendu (code `suspended`, message clair) et note le jour d'activité.
 */
export const ACCOUNT_GATE = Symbol('ACCOUNT_GATE');

/**
 * Apports des autres chantiers aux statistiques quotidiennes (série, propositions, compatibilité, formes,
 * visions). Valeur par défaut : rien (null), l'administration affiche « pas encore branché ».
 * Les chantiers « rituels » et « vision » peuvent fournir leur implémentation (voir `admin.module.ts`).
 */
export const ADMIN_INSIGHTS = Symbol('ADMIN_INSIGHTS');
