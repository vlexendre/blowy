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
