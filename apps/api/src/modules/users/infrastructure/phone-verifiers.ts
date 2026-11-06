/**
 * V5.4 (A.6) : vérification du numéro de la personne (Strategy par environnement).
 * - `FirebasePhoneVerifier` : ID token Firebase d'une connexion par SMS (`phone_number` signé par Firebase) ;
 * - `LocalDemoPhoneVerifier` : `local-phone:+33…` (local/test uniquement — refusé en production).
 * Le numéro n'est jamais stocké ni journalisé : il sert, en mémoire, à calculer le jeton OPRF.
 */
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '../../../shared/domain/errors.js';
import { E164 } from '../domain/contact-avoidance.js';
import type { PhoneVerifier } from '../application/contact-avoidance.use-cases.js';

const invalid = () => new AppError('VALIDATION_FAILED', 'Numéro non vérifié', { detailsSafe: { reason: 'PHONE_NOT_VERIFIED' } });

export class LocalDemoPhoneVerifier implements PhoneVerifier {
  constructor(isProduction: boolean) {
    if (isProduction) throw new Error('LocalDemoPhoneVerifier interdit en production');
  }
  async verify(token: string) {
    const m = /^local-phone:(\+[1-9]\d{7,14})$/.exec(token);
    if (!m) throw invalid();
    return { e164: m[1]! };
  }
}

export class FirebasePhoneVerifier implements PhoneVerifier {
  private readonly app: App;
  constructor(projectId: string) {
    this.app = getApps().find((a) => a.name === 'blowy-auth') ?? initializeApp({ projectId }, 'blowy-auth');
  }
  async verify(token: string) {
    let phone: unknown;
    try {
      phone = (await getAuth(this.app).verifyIdToken(token, true)).phone_number;
    } catch (err) {
      if (((err as { code?: string }).code ?? '').startsWith('auth/')) throw invalid();
      throw new AppError('PROVIDER_UNAVAILABLE', 'Vérification du numéro indisponible');
    }
    if (typeof phone !== 'string' || !E164.test(phone)) throw invalid();
    return { e164: phone };
  }
}
