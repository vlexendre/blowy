/**
 * Règles de vérification d'identité (§10). Pures.
 *  - type exact (kind) + provenance conservés ; « selfie contrôlé » (SELFIE_HUMAN_REVIEW/STAFF)
 *    ≠ « majorité vérifiée » (IDENTITY_AGE/PROVIDER) ;
 *  - un fournisseur absent en production ⇒ parcours en attente, jamais VERIFIED ;
 *  - un âge estimé n'est jamais une autorisation : seul le contrôle serveur 18+ et le
 *    fournisseur spécialisé font foi.
 */
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'NEEDS_RETRY' | 'HUMAN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
export type VerificationKind = 'SELFIE_QUALITY' | 'SELFIE_HUMAN_REVIEW' | 'LIVENESS' | 'IDENTITY_AGE';

/** Badge affichable : jamais « majorité vérifiée » sans IDENTITY_AGE fournisseur. */
export function badgeOf(v: { status: VerificationStatus; kind: VerificationKind | null; provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO' | null }): 'NONE' | 'DEMO' | 'SELFIE_CHECKED' | 'LIVENESS_CHECKED' | 'AGE_VERIFIED' {
  if (v.status !== 'VERIFIED' || !v.kind || !v.provenance) return 'NONE';
  if (v.provenance === 'LOCAL_DEMO') return 'DEMO';
  if (v.kind === 'IDENTITY_AGE' && v.provenance === 'PROVIDER') return 'AGE_VERIFIED';
  if (v.kind === 'LIVENESS' && v.provenance === 'PROVIDER') return 'LIVENESS_CHECKED';
  return 'SELFIE_CHECKED';
}

/** Décision Veriff (doc décision webhook vérifiée le 2026-11-01) → état interne. */
export function mapVeriffDecision(status: string): VerificationStatus | null {
  switch (status) {
    case 'approved':
      return 'VERIFIED';
    case 'declined':
      return 'REJECTED';
    case 'resubmission_requested':
      return 'NEEDS_RETRY';
    case 'review':
      return 'HUMAN_REVIEW';
    case 'expired':
    case 'abandoned':
      return 'EXPIRED';
    default:
      return null;
  }
}

/** Transitions autorisées (webhooks hors ordre / rejoués : jamais de retour arrière depuis un état final). */
const FINAL: ReadonlySet<VerificationStatus> = new Set(['VERIFIED', 'REJECTED', 'EXPIRED']);
export function canApplyVerification(from: VerificationStatus, to: VerificationStatus): boolean {
  if (from === to) return false;
  if (FINAL.has(from)) return false;
  return true;
}

/** Âge révolu à une date civile (YYYY-MM-DD) — pour refuser un document mineur sans stocker la date. */
export function isAdultOn(dateOfBirth: string, today: string): boolean {
  const [y, m, d] = dateOfBirth.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  const age = ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
  return age >= 18;
}
