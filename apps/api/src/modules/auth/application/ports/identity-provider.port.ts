import type { VerifiedIdentity } from '../../domain/identity.js';

/** Port : vérifie une preuve d'identité (ID token Firebase, clé locale). Strategy par environnement. */
export interface IdentityProvider {
  readonly kind: 'firebase' | 'local';
  verify(credential: string): Promise<VerifiedIdentity>;
}
export const IDENTITY_PROVIDERS = Symbol('IdentityProviders');
