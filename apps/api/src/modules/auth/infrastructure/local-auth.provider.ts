/**
 * LocalAuthProvider : identité déterministe pour le développement local et les tests.
 * Credential = clé `[a-z0-9._-]{1,64}` (ex. `alex`, `seed.alex`). Même clé → même compte.
 * INTERDIT en production (refusé par loadConfig + garde ici).
 */
import { AppError } from '../../../shared/domain/errors.js';
import type { VerifiedIdentity } from '../domain/identity.js';
import type { IdentityProvider } from '../application/ports/identity-provider.port.js';

const KEY_RE = /^[a-z0-9._-]{1,64}$/;

export class LocalAuthProvider implements IdentityProvider {
  readonly kind = 'local' as const;

  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('LocalAuthProvider interdit en production');
  }

  async verify(credential: string): Promise<VerifiedIdentity> {
    const key = credential.trim().toLowerCase().replace(/^local:/, '');
    if (!KEY_RE.test(key)) throw new AppError('UNAUTHENTICATED', 'Clé locale invalide');
    return {
      provider: 'LOCAL',
      subject: key,
      signInProvider: 'local',
      // Email local non vérifié : n'autorise aucune fusion.
      email: `${key}@local.blowy.invalid`,
      emailVerified: false,
    };
  }
}
