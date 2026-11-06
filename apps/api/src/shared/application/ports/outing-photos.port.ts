/**
 * Ports interdomaines des photos révélées en sortie (spec-v5 §3.1, §7.5 ; V5.1 E.16).
 *  - `OutingRevealReader` (fourni par `outings`) : le lecteur a-t-il, MAINTENANT, le droit de voir la
 *    photo de profil de cette personne au titre d'une sortie (révélation au verrouillage) ou d'un lien
 *    (bande / duo) ? Consommé par `media` à CHAQUE lecture (ACL revérifiée, jamais mise en cache).
 *  - `PhotoTokenIssuer` (fourni par `media`) : jeton média court pour un lecteur autorisé.
 */
export interface OutingRevealReader {
  canSeeProfilePhoto(viewerId: string, ownerId: string, at: Date): Promise<boolean>;
}
export const OUTING_REVEAL_READER = Symbol('OutingRevealReader');

export interface PhotoTokenIssuer {
  /** Photo de profil courante (READY) d'une personne, ou null. */
  currentProfilePhotoId(userId: string): Promise<string | null>;
  /** URL courte pour ce lecteur, ou null si l'ACL refuse. */
  issue(viewerId: string, mediaId: string): Promise<string | null>;
}
export const PHOTO_TOKEN_ISSUER = Symbol('PhotoTokenIssuer');
