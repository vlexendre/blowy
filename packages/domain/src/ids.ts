/** Identifiants opaques typés (UUID v7 côté serveur). */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type PetId = Brand<string, 'PetId'>;
export type PetPairId = Brand<string, 'PetPairId'>;
export type RelationshipId = Brand<string, 'RelationshipId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type MediaId = Brand<string, 'MediaId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type MissionId = Brand<string, 'MissionId'>;
export type EggId = Brand<string, 'EggId'>;
export type CommandId = Brand<string, 'CommandId'>;

export const asId = <T extends Brand<string, string>>(raw: string): T => raw as T;

// ---- V5 (spec-v5 §2) ----
export type NeighborhoodId = Brand<string, 'NeighborhoodId'>;
export type VenueId = Brand<string, 'VenueId'>;
export type VenueSlotId = Brand<string, 'VenueSlotId'>;
export type OutingRequestId = Brand<string, 'OutingRequestId'>;
export type OutingId = Brand<string, 'OutingId'>;
export type OutingSeatId = Brand<string, 'OutingSeatId'>;
export type CompositionRunId = Brand<string, 'CompositionRunId'>;
export type BandLinkId = Brand<string, 'BandLinkId'>;
export type DuoId = Brand<string, 'DuoId'>;
export type DuoDateId = Brand<string, 'DuoDateId'>;
export type GuardianLinkId = Brand<string, 'GuardianLinkId'>;
export type SafetyAlertId = Brand<string, 'SafetyAlertId'>;
export type PetMemoryId = Brand<string, 'PetMemoryId'>;
export type PaymentId = Brand<string, 'PaymentId'>;
export type AccessoryId = Brand<string, 'AccessoryId'>;

/** Clé canonique d'une paire non ordonnée « min|max » (blocages, déjà vus, votes). */
export const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
