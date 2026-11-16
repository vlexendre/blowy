/**
 * Ports de l'app : tout ce qui sort du téléphone passe par une de ces interfaces.
 * Chaque port a un adaptateur réel et un adaptateur local (développement sans service externe).
 */
import type { UploadTicket } from '@blowy/contract';

export interface Session {
  userId: string;
  email: string | null;
  /**
   * Sign in with Apple seulement, juste après la connexion : le code d'autorisation d'Apple (valable 5 minutes, une
   * fois), à transmettre à l'API pour qu'elle puisse révoquer l'accès à la suppression du compte. Jamais gardé.
   */
  appleAuthorizationCode?: string;
}

/** Fournisseurs de connexion : Apple sur iPhone, Google sur Android (et le web) ; l'e-mail en mode local seulement. */
export type AuthProvider = 'apple' | 'google' | 'email';

export interface AuthPort {
  /** Fournisseurs proposés sur cet appareil, dans l'ordre d'affichage. */
  readonly providers: readonly AuthProvider[];
  /**
   * Connexion par Apple ou Google (jeton d'identité du fournisseur → Supabase). Rend la session ouverte, ou null si la
   * personne a annulé (aucune erreur à montrer). Lève `AuthError` en cas d'échec.
   */
  signInWith(provider: Exclude<AuthProvider, 'email'>): Promise<Session | null>;
  /** Session courante, ou null. */
  getSession(): Promise<Session | null>;
  /** Jeton d'accès à joindre aux appels de l'API. */
  getToken(): Promise<string | null>;
  /**
   * Connexion par e-mail et code fixe, réservée aux comptes qui ont reçu un code (le compte de revue d'Apple, dont
   * l'adresse et le code sont configurés sur le serveur ; `POST /v1/review/session`). Toute autre adresse reçoit
   * « Adresse ou code incorrect. ». En mode local, le code de développement (000000) marche aussi pour toute adresse.
   */
  signInWithEmailCode(email: string, code: string): Promise<Session>;
  /** Mode local seulement : envoie un code à 6 chiffres par e-mail (crée le compte si besoin). */
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

/** Prix localisé d'un produit, tel que le magasin le donne (StoreKit). */
export interface StoreProduct {
  productId: string;
  /** Prix facturé mis en forme par le magasin (« 59,88 € »). */
  displayPrice: string;
  /** Montant en unités (59.88) et devise, pour calculer l'équivalent mensuel. Null si inconnu. */
  price: number | null;
  currency: string | null;
  /** Essai gratuit possible pour ce compte Apple (null : inconnu, on se fie à l'API). */
  introEligible: boolean | null;
}

/** Une transaction signée à faire vérifier par l'API (`api.plus.submitPurchase`), puis à terminer. */
export interface SignedPurchase {
  productId: string;
  signedTransaction: string;
  signedRenewalInfo?: string;
  /** À appeler une fois l'API d'accord (StoreKit `transaction.finish()`). */
  finish(): Promise<void>;
}

export type PurchaseOutcome =
  | { status: 'purchased'; purchase: SignedPurchase }
  /** En attente (contrôle parental, paiement à valider) : la transaction arrivera plus tard par `onUpdates`. */
  | { status: 'pending' }
  | { status: 'cancelled' };

export interface PurchasesPort {
  /** Vrai quand on peut acheter ici (StoreKit sur iPhone, ou achat simulé du mode local). */
  readonly available: boolean;
  /** Achat simulé du mode local (API en mémoire) : rien n'est facturé. */
  readonly simulated: boolean;
  /** Produits et prix localisés ; liste vide si le magasin ne répond pas (l'API sert alors de repli). */
  products(productIds: readonly string[]): Promise<StoreProduct[]>;
  /** Achat d'un abonnement, lié au compte Minimoa (`appAccountToken` = identifiant de la personne). */
  purchase(productId: string, accountToken: string): Promise<PurchaseOutcome>;
  /** « Restaurer mes achats » : resynchronise avec le magasin et rend les abonnements en cours. */
  restore(): Promise<SignedPurchase[]>;
  /** Transactions arrivées hors d'un achat (renouvellement, achat en attente validé, autre appareil). */
  onUpdates(listener: (purchase: SignedPurchase) => void): () => void;
  /** Ouvre la gestion des abonnements du système ; faux si impossible ici. */
  manageSubscriptions(): Promise<boolean>;
}

export interface Ports {
  auth: AuthPort;
  realtime: RealtimePort;
  media: MediaPort;
  purchases: PurchasesPort;
}

export class AuthError extends Error {
  constructor(
    readonly code: 'invalid_email' | 'invalid_code' | 'rate_limited' | 'network' | 'unavailable' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
