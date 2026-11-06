/**
 * Auteurs affichables d'un chat de groupe de sortie (spec-v5 §2.8, V5.3 B.7) : avant la confirmation
 * (`lockAt`), chaque message est signé par le PET de son auteur ; à partir de la confirmation, le prénom
 * s'ajoute. Implémenté par `outings` ; consommé par `conversations` (lecture HTTP et diffusion WS).
 * Jamais d'identifiant d'autrui au-delà du `userId` déjà connu du groupe, jamais d'âge ni d'intention.
 */
export interface MessageAuthorView {
  pet: { name: string; species: string };
  firstName?: string;
}
export interface MessageAuthorResolver {
  /** `null` si la conversation n'est pas un chat de sortie (DUO, BAND, V4 : aucun auteur ajouté). */
  authorsFor(conversationId: string, viewerId: string, at: Date): Promise<ReadonlyMap<string, MessageAuthorView> | null>;
}
export const MESSAGE_AUTHOR_RESOLVER = Symbol('MessageAuthorResolver');
