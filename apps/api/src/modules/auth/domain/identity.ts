/**
 * Domaine auth : identité vérifiée par un fournisseur, politique de liaison de comptes.
 * Aucune dépendance Nest/Prisma.
 */
export type ProviderKind = 'FIREBASE' | 'LOCAL';

export interface VerifiedIdentity {
  provider: ProviderKind;
  /** Identifiant stable du fournisseur (uid Firebase, clé locale). */
  subject: string;
  /** Fournisseur de connexion d'origine (apple.com, google.com, local…). */
  signInProvider: string;
  email: string | null;
  emailVerified: boolean;
}

/**
 * Politique de liaison : jamais de fusion automatique sur un email non vérifié.
 * Une identité inconnue crée toujours un nouveau compte ; la liaison explicite d'une seconde
 * identité exige une session authentifiée (preuve de possession) — hors périmètre V1.
 */
export function mayLinkByEmail(identity: VerifiedIdentity): boolean {
  void identity;
  return false;
}
