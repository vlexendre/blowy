/** Permissions staff par action (revérifiées côté serveur ; le module admin vérifie aussi). */
import type { StaffRole } from '@blowy/domain';

export type StaffAction =
  | 'cases.list'
  | 'cases.read'
  | 'cases.assign'
  | 'cases.decide'
  | 'cases.restricted'
  | 'users.sanction'
  | 'appeals.resolve'
  | 'verifications.list'
  | 'verifications.review'
  | 'reports.list'
  | 'privacy.list'
  | 'ai.list'
  | 'ai.operate';

const MATRIX: Record<StaffAction, readonly StaffRole[]> = {
  'cases.list': ['support', 'moderator', 'trust_lead', 'admin'],
  'cases.read': ['moderator', 'trust_lead', 'admin'],
  'cases.assign': ['moderator', 'trust_lead', 'admin'],
  'cases.decide': ['moderator', 'trust_lead', 'admin'],
  // Protection des mineurs : procédure spécialisée, rôle habilité uniquement.
  'cases.restricted': ['trust_lead'],
  'users.sanction': ['trust_lead', 'admin'],
  'appeals.resolve': ['moderator', 'trust_lead', 'admin'],
  'verifications.list': ['support', 'trust_lead', 'admin'],
  'verifications.review': ['trust_lead', 'admin'],
  'reports.list': ['support', 'moderator', 'trust_lead', 'admin'],
  'privacy.list': ['support', 'trust_lead', 'admin'],
  'ai.list': ['analyst', 'trust_lead', 'admin'],
  'ai.operate': ['trust_lead', 'admin'],
};

export function staffCan(roles: readonly StaffRole[], action: StaffAction): boolean {
  return roles.some((r) => MATRIX[action].includes(r));
}

/** Motif obligatoire pour toute action sensible. */
export function validReason(reason: string | undefined): boolean {
  return typeof reason === 'string' && reason.trim().length >= 5;
}
