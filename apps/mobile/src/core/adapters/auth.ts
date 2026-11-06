/**
 * Adaptateurs AuthPort.
 *  - LocalAuthAdapter : identité de développement → credential `local:<clé>` consommé par le
 *    LocalAuthProvider de l'API (refusé par l'API en production). Clé stable par appareil.
 *  - FirebaseAuthAdapter : Apple/Google via Firebase Authentication → ID token Firebase.
 *    Le SDK Firebase n'est pas encore installé dans l'app (demande documentée) : l'adaptateur
 *    signale honnêtement NOT_CONFIGURED au lieu de simuler une connexion.
 */
import type { IntegrationMode } from '@blowy/api-contract';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { AuthCredential, AuthPort, AuthProviderKind } from '../ports/auth';
import type { StoragePort } from '../ports/storage';

export class AuthNotConfiguredError extends Error {
  constructor(readonly provider: AuthProviderKind) {
    super(`AUTH_NOT_CONFIGURED:${provider}`);
  }
}

const LOCAL_KEY = 'blowy.auth.localKey';

export class LocalAuthAdapter implements AuthPort {
  readonly mode: IntegrationMode = 'LOCAL_DEMO';
  constructor(private readonly storage: StoragePort) {}

  async available(): Promise<readonly AuthProviderKind[]> {
    return ['local'];
  }

  /** `localKey` = compte de démo du seed (alex, l, m…) ; sinon clé stable propre à l'appareil (nouveau compte). */
  async signIn(_kind: AuthProviderKind, localKey?: string): Promise<AuthCredential> {
    if (localKey) return { provider: 'local', credential: localKey };
    let key = await this.storage.getItem(LOCAL_KEY);
    if (!key) {
      key = `dev-${Crypto.randomUUID().slice(0, 18)}`;
      await this.storage.setItem(LOCAL_KEY, key);
    }
    return { provider: 'local', credential: key };
  }

  async signOut(): Promise<void> {
    // La clé locale est conservée : se reconnecter retrouve le même compte de dev.
  }
}

export interface FirebaseBridge {
  /** Échange un id token Apple (nonce brut) contre un ID token Firebase. */
  signInWithApple(identityToken: string, rawNonce: string): Promise<string>;
  signInWithGoogle(): Promise<string>;
  signOut(): Promise<void>;
}

export class FirebaseAuthAdapter implements AuthPort {
  readonly mode: IntegrationMode;
  constructor(
    private readonly bridge: FirebaseBridge | null,
    live: boolean,
  ) {
    this.mode = bridge ? (live ? 'LIVE' : 'SANDBOX') : 'NOT_CONFIGURED';
  }

  async available(): Promise<readonly AuthProviderKind[]> {
    const out: AuthProviderKind[] = [];
    if (Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync())) out.push('apple');
    out.push('google');
    return out;
  }

  async signIn(kind: AuthProviderKind): Promise<AuthCredential> {
    if (!this.bridge) throw new AuthNotConfiguredError(kind);
    if (kind === 'apple') {
      const rawNonce = Crypto.randomUUID();
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const apple = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashed,
      });
      if (!apple.identityToken) throw new AuthNotConfiguredError('apple');
      const idToken = await this.bridge.signInWithApple(apple.identityToken, rawNonce);
      return {
        provider: 'firebase',
        credential: idToken,
        givenName: apple.fullName?.givenName ?? null,
      };
    }
    if (kind === 'google')
      return { provider: 'firebase', credential: await this.bridge.signInWithGoogle() };
    throw new AuthNotConfiguredError(kind);
  }

  async signOut(): Promise<void> {
    await this.bridge?.signOut();
  }
}
