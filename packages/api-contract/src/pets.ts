/** Contrats /v1/pets (propriétaire : agent C). */
import { z } from 'zod';
import { LIMITS, MAX_PASSIONS, PASSIONS, PET_POSES, SCHOOLS, SPECIES, STAGES, SUNDAYS } from '@blowy/domain';
import { IsoDateTimeSchema, UuidSchema } from './core/common.js';

export const SpeciesSchema = z.enum(SPECIES);
export const StageSchema = z.enum(STAGES);
export const PoseSchema = z.enum(PET_POSES);

const axis = z.number().min(-1).max(1);
export const VisionSchema = z.object({
  axes: z.object({ kindMischief: axis, sportyContemplative: axis, scienceArt: axis, homeAdventure: axis }),
  school: z.enum(SCHOOLS),
  sunday: z.enum(SUNDAYS),
  passions: z.array(z.enum(PASSIONS)).min(1).max(MAX_PASSIONS),
  limit: z.enum(LIMITS),
});
export type VisionDto = z.infer<typeof VisionSchema>;

export const GaugesSchema = z.object({ satiety: z.number(), energy: z.number(), mood: z.number(), health: z.number() });

/** Lieu tel que vu par son propriétaire. */
export const OwnLocationSchema = z.object({
  kind: z.enum(['HOME', 'DATE_SPOT', 'SHARED_HOME', 'FRIEND_HOME', 'GROUP_LOCAL', 'CUSTODY_HOME']),
  relationshipId: UuidSchema.nullable(),
  since: IsoDateTimeSchema,
});

/** Présence vue par un partenaire : jamais l'autre relation ni un lieu humain. */
export const PartnerPresenceSchema = z.enum(['HERE', 'OUT']);

/** Profil public d'un pet (PublicPetProfile) — aucune donnée humaine privée. */
export const PublicPetProfileSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  species: SpeciesSchema,
  stage: StageSchema,
  vision: VisionSchema.nullable(),
  pose: PoseSchema,
});
export type PublicPetProfile = z.infer<typeof PublicPetProfileSchema>;

/** Vue propriétaire de son pet. */
export const OwnPetViewSchema = PublicPetProfileSchema.extend({
  kind: z.enum(['PRIMARY', 'CHILD']),
  gauges: GaugesSchema,
  petXp: z.number().int(),
  location: OwnLocationSchema,
  stateAsOf: IsoDateTimeSchema,
  version: z.number().int(),
  engineVersion: z.string(),
});
export type OwnPetView = z.infer<typeof OwnPetViewSchema>;

export const CreatePrimaryPetRequestSchema = z.object({
  name: z.string().trim().min(1).max(24),
  species: SpeciesSchema,
  vision: VisionSchema,
});
export type CreatePrimaryPetRequest = z.infer<typeof CreatePrimaryPetRequestSchema>;

export const PET_ACTIONS = ['FEED', 'HEAL', 'PLAY', 'HUG', 'CALL'] as const;
export const PetActionSchema = z.enum(PET_ACTIONS);

export const PetActionRequestSchema = z.object({
  action: PetActionSchema,
  /** Relation requise pour PLAY/HUG/CALL (même lieu). */
  relationshipId: UuidSchema.optional(),
});
export type PetActionRequest = z.infer<typeof PetActionRequestSchema>;

export const PetActionResultSchema = z.object({
  pet: OwnPetViewSchema,
  outcome: z.enum(['APPLIED', 'NO_GAIN', 'REFUSED', 'MOVED']),
  /** Gains réellement attribués (UI honnête : 0 si plafond atteint). */
  gains: z.object({ petXp: z.number().int(), linkXp: z.number() }),
  reaction: PoseSchema.nullable(),
});
export type PetActionResult = z.infer<typeof PetActionResultSchema>;

/** Commande de déplacement dédiée, dédupliquée (Idempotency-Key). */
export const MovePetRequestSchema = z.object({
  destination: z.enum(['HOME', 'DATE_SPOT']),
  relationshipId: UuidSchema.optional(),
});
export type MovePetRequest = z.infer<typeof MovePetRequestSchema>;
