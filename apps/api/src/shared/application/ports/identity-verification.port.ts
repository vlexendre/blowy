/**
 * IdentityVerificationProvider (§10) : fournisseur SPÉCIALISÉ (Veriff), jamais un modèle de
 * vision généraliste. Session créée côté serveur ; décision par webhook authentifié.
 */
export interface VerificationSessionCreated {
  providerRef: string;
  sessionUrl: string;
}

export interface VerificationDecision {
  providerRef: string;
  /** Identifiant d'événement stable (déduplication). */
  eventId: string;
  status: string;
  code: number | null;
  vendorData: string | null;
  decisionTime: string | null;
  /** Utilisée UNIQUEMENT pour le contrôle 18+ puis oubliée (jamais stockée). */
  dateOfBirth: string | null;
  reasonCode: string | null;
}

export interface IdentityVerificationProvider {
  readonly name: 'veriff';
  readonly environment: 'PRODUCTION' | 'SANDBOX';
  createSession(input: { localSessionId: string }, signal?: AbortSignal): Promise<VerificationSessionCreated>;
  /** Authentification du webhook selon le mécanisme réel du fournisseur. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean;
  parseDecision(body: unknown): VerificationDecision | null;
}
export const IDENTITY_VERIFICATION_PROVIDER = Symbol.for('blowy.trust.identityVerificationProvider');
