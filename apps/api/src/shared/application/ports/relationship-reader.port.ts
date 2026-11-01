/** Port de lecture relations pour les autres modules (ex. economy : droits dérivés). */
export interface RelationshipReader {
  findMovedInPartner(userId: string): Promise<{ partnerUserId: string; relationshipId: string } | null>;
}
export const RELATIONSHIP_READER = Symbol('RelationshipReader');
