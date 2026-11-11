/**
 * Ports de l'app : tout ce qui sort du téléphone passe par une de ces interfaces.
 * Chaque port a un adaptateur réel et un adaptateur local (développement sans service externe).
 */
import type { UploadTicket } from '@blowy/contract';

export interface Session {
  userId: string;
  email: string | null;
}

export interface AuthPort {
  /** Session courante, ou null. */
  getSession(): Promise<Session | null>;
  /** Jeton d'accès à joindre aux appels de l'API. */
  getToken(): Promise<string | null>;
  /** Envoie un code à 6 chiffres par e-mail (crée le compte si besoin). */
  sendCode(email: string): Promise<void>;
  /** Vérifie le code reçu ; rend la session ouverte. */
  verifyCode(email: string, code: string): Promise<Session>;
  signOut(): Promise<void>;
  /** S'abonne aux changements de session ; rend la fonction de désabonnement. */
  onChange(listener: (session: Session | null) => void): () => void;
}

export interface RealtimePort {
  /** Appelle `onChange` à chaque nouveau message ou changement d'un lien de la personne connectée. */
  subscribe(onChange: (event: { linkId: string | null }) => void): () => void;
}

export interface PickedImage {
  uri: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
}

export interface MediaPort {
  /** Ouvre l'appareil photo ou la photothèque ; null si la personne annule ou refuse l'accès. */
  pick(source: 'camera' | 'library'): Promise<PickedImage | null>;
  /** Envoie le fichier vers l'emplacement réservé par l'API. */
  upload(ticket: UploadTicket, image: PickedImage): Promise<void>;
}

export interface PurchasesPort {
  /** Vrai quand les achats sont réellement branchés (sinon l'écran Blowy+ reste informatif). */
  readonly available: boolean;
  purchase(plan: 'yearly' | 'monthly'): Promise<boolean>;
  restore(): Promise<boolean>;
}

export interface Ports {
  auth: AuthPort;
  realtime: RealtimePort;
  media: MediaPort;
  purchases: PurchasesPort;
}

export class AuthError extends Error {
  constructor(
    readonly code: 'invalid_email' | 'invalid_code' | 'rate_limited' | 'network' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
