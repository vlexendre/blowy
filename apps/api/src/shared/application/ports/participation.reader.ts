/**
 * Lecture d'appartenance à une relation (contrôle d'accès objet, anti-IDOR).
 * Lecture seule, partagée par pets, conversations, WS. Écritures : module relationships.
 */
export interface Participation {
  contextId: string;
  type: 'DATE' | 'NEIGHBORHOOD' | 'GROUP' | 'COPARENT';
  status: 'ACTIVE' | 'MOVED_IN' | 'PAUSED' | 'LEGACY' | 'ENDED';
  myUserId: string;
  myPetId: string;
  otherUserId: string;
  otherPetId: string;
  conversationId: string | null;
}

export interface ParticipationReader {
  /** null si l'utilisateur n'est pas (ou plus) participant actif. */
  get(userId: string, contextId: string): Promise<Participation | null>;
  /** Utilisateurs partageant une relation active avec le pet (lecture de profil public). */
  sharesRelationshipWithPet(userId: string, petId: string): Promise<boolean>;
}
export const PARTICIPATION_READER = Symbol('ParticipationReader');
