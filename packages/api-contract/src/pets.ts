/** Contrats /v1/pets (propriétaire : agent C). */
import { z } from 'zod';
import { ACCESSORY_EQUIP_CAP, ACCESSORY_SOURCES, ANONYMOUS_WORDS, LIMITS, MAX_PASSIONS, PASSIONS, PET_MEMORY_KINDS, PET_POSES, SCHOOLS, SPECIES, STAGES, SUNDAYS } from '@blowy/domain';
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

// ============================================================================ V5 (spec-v5 §5, §7.4 « Pets »)
// Plus de jauges ni d'actions de soin : le pet grandit avec les souvenirs (D-021).

export const PetMemoryKindSchema = z.enum(PET_MEMORY_KINDS);
export const AccessorySourceSchema = z.enum(ACCESSORY_SOURCES);
/** Clé d'accessoire (`@blowy/content` ACCESSORIES). */
export const AccessoryIdSchema = z.string().regex(/^[a-z0-9_]{1,48}$/);
export const ThreeWordSchema = z.enum(ANONYMOUS_WORDS);

/**
 * Carte de pet montrée aux autres (sortie, bande, duo) : espèce, nom, accessoires portés,
 * 3 traits de vision (clés de contenu). Aucune donnée humaine.
 */
export const PetCardSchema = z
  .object({
    name: z.string(),
    species: SpeciesSchema,
    stage: StageSchema.optional(),
    equipped: z.array(AccessoryIdSchema).max(ACCESSORY_EQUIP_CAP),
    traits: z.array(z.string().min(1).max(64)).max(3),
    /**
     * V5.10 (passe 5) : pose du pet dans les vues de groupe (`OutingView.members[].pet`), parmi les poses V5 du domaine
     * (jamais SICK / HUNGRY / SAD) — choisie de façon déterministe par membre, sortie et moment ; décorative, ne dit
     * rien de la personne (ni humeur, ni fiabilité, ni présence).
     */
    pose: PoseSchema.exclude(['SICK', 'HUNGRY', 'SAD']).optional(),
  })
  .strict();
export type PetCard = z.infer<typeof PetCardSchema>;

/** `GET /v1/pets/mine` (V5). */
export const OwnPetViewV5Schema = z.object({
  id: UuidSchema,
  name: z.string(),
  species: SpeciesSchema,
  stage: StageSchema,
  /** Jamais SICK / HUNGRY / SAD en V5. */
  pose: PoseSchema.exclude(['SICK', 'HUNGRY', 'SAD']),
  equipped: z.array(AccessoryIdSchema).max(ACCESSORY_EQUIP_CAP),
  unlockedAccessories: z.array(AccessoryIdSchema),
  memoryCount: z.number().int().nonnegative(),
  /** Prochain stade et progression (‰) ; null au stade adulte. */
  nextStageAt: z.object({ stage: StageSchema, progressPermille: z.number().int().min(0).max(1000) }).nullable(),
  engineVersion: z.string(),
  version: z.number().int().nonnegative(),
});
export type OwnPetViewV5 = z.infer<typeof OwnPetViewV5Schema>;

/** Souvenir (`GET /v1/pets/mine/memories`) : jamais de donnée d'autrui non déjà visible. */
export const PetMemoryViewSchema = z.object({
  id: UuidSchema,
  kind: PetMemoryKindSchema,
  /** Clé de texte `memory.<kind>` (`@blowy/content`). */
  labelKey: z.string(),
  data: z
    .object({
      species: SpeciesSchema.optional(),
      weekKey: z.string().optional(),
      venueName: z.string().optional(),
      petCount: z.number().int().nonnegative().optional(),
      speciesPresent: z.array(SpeciesSchema).optional(),
      otherPetName: z.string().optional(),
      otherPetSpecies: SpeciesSchema.optional(),
      n: z.number().int().positive().optional(),
    })
    .strict(),
  createdAt: IsoDateTimeSchema,
});
export type PetMemoryView = z.infer<typeof PetMemoryViewSchema>;
export const PetMemoryPageSchema = z.object({ items: z.array(PetMemoryViewSchema), nextCursor: z.string().nullable() });

/** `PUT /v1/pets/mine/accessories` (`pets.equip`) ; 412 `ACCESSORY_NOT_UNLOCKED`. */
export const EquipAccessoriesRequestSchema = z.object({
  equipped: z.array(AccessoryIdSchema).max(ACCESSORY_EQUIP_CAP).refine((a) => new Set(a).size === a.length, { message: 'accessoire en double' }),
});
export type EquipAccessoriesRequest = z.infer<typeof EquipAccessoriesRequestSchema>;
export const PET_FAILURE_REASONS_V5 = ['ACCESSORY_NOT_UNLOCKED'] as const;

/** `pet.updated` (V5, salle `user:`). */
export const PetUpdatedEventV5Schema = z.object({
  petId: UuidSchema,
  stage: StageSchema,
  memoryAdded: z.object({ kind: PetMemoryKindSchema }).optional(),
  accessoryUnlocked: AccessoryIdSchema.optional(),
});
