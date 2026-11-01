/**
 * Port de vérification d'identité (IdentityVerificationProvider). L'adapter réel (Veriff)
 * est livré par l'agent E ; ici l'adapter local de démonstration, identifié LOCAL_DEMO.
 */
export interface VerificationStart {
  providerRef: string;
  /** Statut immédiat (le local démo valide de suite ; un fournisseur réel répond PENDING + webhook). */
  status: 'PENDING' | 'VERIFIED';
  provenance: 'PROVIDER' | 'LOCAL_DEMO';
  expiresAt: Date | null;
}
export interface VerificationGateway {
  readonly mode: 'LIVE' | 'LOCAL_DEMO' | 'NOT_CONFIGURED';
  start(userId: string, kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE', now: Date): Promise<VerificationStart>;
}
export const VERIFICATION_GATEWAY = Symbol('VerificationGateway');
