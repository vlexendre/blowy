/**
 * Vérification d'identité staff : réutilise les fournisseurs d'identité configurés du module auth
 * (Firebase en production ; clé locale hors production uniquement). Le module auth sélectionne
 * déjà les fournisseurs selon l'environnement : en production, « local » est absent.
 */
import type { IdentityProvider } from '../../auth/application/ports/identity-provider.port.js';
import type { StaffIdentityVerifier } from '../application/use-cases/staff-auth.use-cases.js';

export class AuthProvidersStaffVerifier implements StaffIdentityVerifier {
  constructor(private readonly providers: ReadonlyMap<string, IdentityProvider>) {}
  async verify(provider: 'firebase' | 'local', credential: string) {
    const p = this.providers.get(provider);
    if (!p) throw new Error('provider not configured');
    const id = await p.verify(credential);
    return { provider: id.provider, subject: id.subject };
  }
}
