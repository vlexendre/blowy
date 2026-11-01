/**
 * Matrice de permissions staff (§18) : permission par ACTION, vérifiée côté serveur.
 * Règles de confidentialité encodées ici (une seule source) :
 *  - analyst : métriques agrégées uniquement, jamais messages/selfies/preuves ;
 *  - finance : économie, jamais le chat ;
 *  - support : lecture utile à un dossier ; aucune sanction ;
 *  - moderator : décisions de contenu (avertir/rejeter un contenu), pas de sanction de compte ;
 *  - sanctions de compte (avertir/restreindre/suspendre/bannir/rétablir) : trust_lead/admin,
 *    motif obligatoire ; step-up pour suspendre/bannir/rétablir (alignées sur le port de E) ;
 *  - aucune permission ne permet de lire les votes privés ni d'imposer une relation.
 */
import type { StaffRole } from '@blowy/domain';

export const PERMISSIONS = [
  'dashboard.read',
  'users.read',
  'users.warn',
  'users.restrict',
  'users.suspend',
  'users.ban',
  'users.restore',
  'pets.read',
  'relationships.read',
  'relationships.repair',
  'moderation.read',
  'moderation.context',
  'moderation.assign',
  'moderation.decide',
  'moderation.appeal',
  'moderation.sanction',
  'verification.read',
  'verification.review',
  'missions.read',
  'missions.write',
  'missions.publish',
  'content.read',
  'content.write',
  'content.publish',
  'tuning.read',
  'tuning.write',
  'tuning.publish',
  'matching.read',
  'economy.read',
  'economy.correct',
  'economy.redrive',
  'social.read',
  'social.anonymous.moderate',
  'ai.read',
  'ai.retry',
  'ops.read',
  'ops.redrive',
  'audit.read',
  'staff.read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL = PERMISSIONS;
const READ_BASE: Permission[] = ['dashboard.read'];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  support: [...READ_BASE, 'users.read', 'pets.read', 'relationships.read', 'moderation.read', 'verification.read', 'social.read', 'missions.read'],
  moderator: [...READ_BASE, 'users.read', 'moderation.read', 'moderation.context', 'moderation.assign', 'moderation.decide', 'moderation.appeal', 'social.read', 'social.anonymous.moderate', 'missions.read', 'verification.read'],
  trust_lead: [
    ...READ_BASE, 'users.read', 'users.warn', 'users.restrict', 'users.suspend', 'users.ban', 'users.restore',
    'pets.read', 'relationships.read', 'relationships.repair', 'moderation.read', 'moderation.context', 'moderation.assign', 'moderation.decide', 'moderation.appeal',
    'moderation.sanction', 'verification.read', 'verification.review', 'social.read', 'social.anonymous.moderate', 'matching.read', 'audit.read', 'ai.read',
  ],
  content_manager: [...READ_BASE, 'missions.read', 'missions.write', 'missions.publish', 'content.read', 'content.write', 'content.publish', 'tuning.read'],
  finance: [...READ_BASE, 'users.read', 'economy.read', 'economy.correct', 'economy.redrive'],
  analyst: [...READ_BASE, 'matching.read', 'tuning.read', 'ai.read', 'ops.read'],
  admin: ALL,
};

/** Actions exigeant une réauthentification TOTP récente (step-up). */
export const STEP_UP_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  'users.suspend',
  'users.ban',
  'users.restore',
  'moderation.sanction',
  'relationships.repair',
  'economy.correct',
  'tuning.publish',
  'content.publish',
  'missions.publish',
  'ops.redrive',
  'economy.redrive',
]);

/** Fenêtre de validité d'un step-up (secondes). */
export const STEP_UP_TTL_SECONDS = 5 * 60;

export function permissionsOf(roles: readonly StaffRole[]): Set<Permission> {
  return new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []));
}

export function can(roles: readonly StaffRole[], p: Permission): boolean {
  return permissionsOf(roles).has(p);
}

/** Action de modération sur un compte → permission requise. */
export const USER_ACTION_PERMISSION = {
  WARN: 'users.warn',
  RESTRICT: 'users.restrict',
  SUSPEND: 'users.suspend',
  BAN: 'users.ban',
  RESTORE: 'users.restore',
} as const satisfies Record<string, Permission>;
export type UserActionKind = keyof typeof USER_ACTION_PERMISSION;
