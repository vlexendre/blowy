/**
 * FirebaseAuthProvider : vérifie l'ID token Firebase (signature, issuer, audience, expiration,
 * révocation via checkRevoked) avec firebase-admin. Supporte l'émulateur si
 * FIREBASE_AUTH_EMULATOR_HOST est défini (jamais en production — refusé par la config).
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '../../../shared/domain/errors.js';
import type { VerifiedIdentity } from '../domain/identity.js';
import type { IdentityProvider } from '../application/ports/identity-provider.port.js';

export interface FirebaseAuthConfig {
  projectId: string;
  serviceAccountJson?: string | undefined;
  emulatorHost?: string | undefined;
}

export class FirebaseAuthProvider implements IdentityProvider {
  readonly kind = 'firebase' as const;
  private readonly app: App;
  private readonly checkRevoked: boolean;

  constructor(cfg: FirebaseAuthConfig) {
    if (cfg.emulatorHost) process.env.FIREBASE_AUTH_EMULATOR_HOST = cfg.emulatorHost;
    const existing = getApps().find((a) => a.name === 'blowy-auth');
    this.app =
      existing ??
      initializeApp(
        {
          projectId: cfg.projectId,
          ...(cfg.serviceAccountJson ? { credential: cert(JSON.parse(cfg.serviceAccountJson) as Record<string, string>) } : {}),
        },
        'blowy-auth',
      );
    // L'émulateur ne gère pas la révocation de la même façon ; en réel on la vérifie toujours.
    this.checkRevoked = !cfg.emulatorHost;
  }

  async verify(credential: string): Promise<VerifiedIdentity> {
    try {
      const t = await getAuth(this.app).verifyIdToken(credential, this.checkRevoked);
      return {
        provider: 'FIREBASE',
        subject: t.uid,
        signInProvider: t.firebase?.sign_in_provider ?? 'unknown',
        email: t.email ?? null,
        emailVerified: t.email_verified === true,
      };
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code.startsWith('auth/')) throw new AppError('UNAUTHENTICATED', 'Jeton Firebase invalide ou révoqué', { detailsSafe: { code } });
      throw new AppError('PROVIDER_UNAVAILABLE', 'Vérification Firebase indisponible');
    }
  }
}
