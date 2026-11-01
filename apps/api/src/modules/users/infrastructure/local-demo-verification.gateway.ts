/**
 * Vérification de démonstration (LOCAL_DEMO) : badge distinct, jamais « majorité vérifiée »
 * en production (interdit par la config). L'adapter Veriff réel est livré par l'agent E.
 */
import type { VerificationGateway, VerificationStart } from '../application/ports/verification.gateway.js';

export class LocalDemoVerificationGateway implements VerificationGateway {
  readonly mode = 'LOCAL_DEMO' as const;
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('Vérification LOCAL_DEMO interdite en production');
  }
  async start(userId: string, kind: string, now: Date): Promise<VerificationStart> {
    return { providerRef: `local-demo:${userId}:${kind}:${now.getTime()}`, status: 'VERIFIED', provenance: 'LOCAL_DEMO', expiresAt: new Date(now.getTime() + 365 * 86_400_000) };
  }
}

/** Fournisseur absent : parcours en attente, jamais verified:true. */
export class NotConfiguredVerificationGateway implements VerificationGateway {
  readonly mode = 'NOT_CONFIGURED' as const;
  async start(): Promise<VerificationStart> {
    throw new Error('not configured');
  }
}
