/**
 * Contrat de l'API Blowy (REST /v1). Source de vérité partagée par l'API, l'app et le site.
 * Tout ce qui traverse le réseau est décrit ici en Zod ; les types en sont dérivés.
 */
import { CARE_ACTIONS, GAUGE_KEYS, ITEM_IDS, ITEM_SLOTS, LINK_STATUSES, MOODS, PET_EVENT_KINDS, SHAPES, SPECIES, WORD_KEYS } from '@blowy/domain';
import { z } from 'zod';

export const API_PREFIX = '/v1';

// ── Briques ────────────────────────────────────────────────────────────────
export const Uuid = z.string().uuid();
export const DayStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const Iso = z.string();
export const SpeciesZ = z.enum(SPECIES);
export const MoodZ = z.enum(MOODS);
const gauge = z.number().int().min(-100).max(100);
export const GaugesZ = z.object({ social: gauge, play: gauge, tender: gauge, talk: gauge });
export const GaugeKeyZ = z.enum(GAUGE_KEYS);
export const FormZ = z.enum(['equilibre', 'casanier', 'sociable', 'joueur', 'piquant', 'tendre']);
export const FaceZ = z.enum(['hidden', 'blurred', 'clear']);

export const TraitZ = z.object({ gauge: GaugeKeyZ, pole: z.string().nullable(), tier: z.union([z.literal(0), z.literal(1), z.literal(2)]), value: gauge });

// ── Soins et garde-robe ────────────────────────────────────────────────────
const need = z.number().int().min(0).max(100);
export const NeedsZ = z.object({ hunger: need, energy: need, mood: need });
export const ShapeZ = z.enum(SHAPES);
export const ItemSlotZ = z.enum(ITEM_SLOTS);
export const ItemIdZ = z.enum(ITEM_IDS as [string, ...string[]]);
/** Un objet au plus par emplacement. */
export const OutfitZ = z.object({ head: ItemIdZ.optional(), face: ItemIdZ.optional(), body: ItemIdZ.optional(), toy: ItemIdZ.optional() });
export type OutfitDto = z.infer<typeof OutfitZ>;

// ── Pet ────────────────────────────────────────────────────────────────────
export const PetZ = z.object({
  id: Uuid,
  name: z.string(),
  species: SpeciesZ,
  gauges: GaugesZ,
  form: FormZ,
  traits: z.array(TraitZ),
  needs: NeedsZ,
  /** Forme générale de 0 à 100, et son palier. */
  wellbeing: need,
  shape: ShapeZ,
  outfit: OutfitZ,
  bornAt: Iso,
});
export type Pet = z.infer<typeof PetZ>;

export const PetEventZ = z.object({ id: z.string(), kind: z.enum(PET_EVENT_KINDS), delta: GaugesZ.partial(), at: Iso });
export type PetEvent = z.infer<typeof PetEventZ>;

/** Pet vu par les autres : pas de jauges chiffrées, seulement sa forme et son humeur. */
export const PublicPetZ = z.object({ name: z.string(), species: SpeciesZ, form: FormZ, mood: MoodZ, outfit: OutfitZ });
export type PublicPet = z.infer<typeof PublicPetZ>;

export const PetViewZ = z.object({
  pet: PetZ,
  events: z.array(PetEventZ),
  /** Défi du jour : une question, deux réponses ; fait une fois par jour. */
  challenge: z.object({ id: z.string(), question: z.string(), choices: z.array(z.string()).length(2), doneToday: z.boolean() }),
  wordsCount: z.number().int(),
  /** Jours où la personne s'est occupée de son pet. */
  careDays: z.number().int(),
  /** Objets débloqués par cette action (à fêter à l'écran). */
  newItems: z.array(ItemIdZ),
});
export type PetView = z.infer<typeof PetViewZ>;

export const CareBody = z.object({ action: z.enum(CARE_ACTIONS) });
export type CareBody = z.infer<typeof CareBody>;

export const WardrobeItemZ = z.object({
  id: ItemIdZ,
  slot: ItemSlotZ,
  /** owned : dans la garde-robe · locked : à gagner par une étape · premium : à acheter. */
  state: z.enum(['owned', 'locked', 'premium']),
  /** Étape à franchir (objets à gagner) : compteur concerné et avancement. */
  goal: z.object({ stat: z.enum(['careDays', 'links', 'bestLevel', 'bestStreak', 'challenges', 'words']), have: z.number().int(), need: z.number().int() }).nullable(),
});
export type WardrobeItem = z.infer<typeof WardrobeItemZ>;
export const WardrobeZ = z.object({ items: z.array(WardrobeItemZ), outfit: OutfitZ });
export type Wardrobe = z.infer<typeof WardrobeZ>;
export const OutfitBody = z.object({ outfit: OutfitZ });

export const RenamePetBody = z.object({ name: z.string().trim().min(1).max(14) });
export const ChallengeBody = z.object({ choice: z.union([z.literal(0), z.literal(1)]) });

// ── Moi ────────────────────────────────────────────────────────────────────
export const MeZ = z.object({
  id: Uuid,
  displayName: z.string(),
  city: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  inviteCode: z.string(),
  wordsCode: z.string(),
  plus: z.boolean(),
  pet: PetZ,
});
export type Me = z.infer<typeof MeZ>;

export const OnboardBody = z.object({
  displayName: z.string().trim().min(1).max(24),
  birthdate: DayStr,
  city: z.string().trim().max(40).optional(),
  pet: z.object({ name: z.string().trim().min(1).max(14), species: SpeciesZ }),
  /** Résultat du quiz de caractère : point de départ des jauges. */
  quiz: GaugesZ.partial().default({}),
  /** Code d'invitation reçu, s'il y en a un. */
  inviteCode: z.string().optional(),
});
export type OnboardBody = z.infer<typeof OnboardBody>;

export const UpdateMeBody = z.object({ displayName: z.string().trim().min(1).max(24).optional(), city: z.string().trim().max(40).nullable().optional() });
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;

// ── Personnes et liens ─────────────────────────────────────────────────────
export const PersonZ = z.object({
  id: Uuid,
  displayName: z.string(),
  city: z.string().nullable(),
  pet: PublicPetZ,
  /** Le visage reste caché tant que le lien n'a pas atteint le bon niveau. */
  face: FaceZ,
  avatarUrl: z.string().nullable(),
});
export type Person = z.infer<typeof PersonZ>;

export const TodayZ = z.object({
  day: DayStr,
  mine: z.boolean(),
  theirs: z.boolean(),
  myPhotoUrl: z.string().nullable(),
  /** Visible seulement quand les deux ont envoyé la leur. */
  theirPhotoUrl: z.string().nullable(),
});

export const LinkZ = z.object({
  id: Uuid,
  other: PersonZ,
  myPet: PublicPetZ,
  status: z.enum(LINK_STATUSES),
  lives: z.number().int(),
  level: z.number().int(),
  xp: z.number().int(),
  /** Avancement vers le niveau suivant, de 0 à 1. */
  levelRatio: z.number(),
  streak: z.number().int(),
  canRevive: z.boolean(),
  unread: z.number().int(),
  lastMessage: z.object({ preview: z.string(), at: Iso }).nullable(),
  today: TodayZ,
  createdAt: Iso,
});
export type Link = z.infer<typeof LinkZ>;

export const AuthorZ = z.enum(['me', 'other', 'my_pet', 'other_pet', 'system']);
export const MessageZ = z.object({
  id: Uuid,
  linkId: Uuid,
  author: AuthorZ,
  kind: z.enum(['text', 'photo', 'event']),
  body: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  at: Iso,
});
export type Message = z.infer<typeof MessageZ>;

export const MessagesPageZ = z.object({ messages: z.array(MessageZ), nextBefore: Iso.nullable() });
export type MessagesPage = z.infer<typeof MessagesPageZ>;

export const SendMessageBody = z.object({
  body: z.string().trim().min(1).max(2000),
  /** Ton choisi : fait bouger la jauge piquant ↔ tendre. */
  tone: z.enum(['sweet', 'tease']).optional(),
});
export type SendMessageBody = z.infer<typeof SendMessageBody>;

/** Réponse à toute action dans un lien : les nouveaux messages (dont ceux des pets) et le lien à jour. */
export const LinkActionZ = z.object({ link: LinkZ, messages: z.array(MessageZ) });
export type LinkAction = z.infer<typeof LinkActionZ>;

export const UploadTicketZ = z.object({ path: z.string(), uploadUrl: z.string(), token: z.string() });
export type UploadTicket = z.infer<typeof UploadTicketZ>;
export const UploadTicketBody = z.object({ contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']) });
export const ConfirmUploadBody = z.object({ path: z.string().min(1) });

export const MemoryDayZ = z.object({ day: DayStr, myPhotoUrl: z.string().nullable(), theirPhotoUrl: z.string().nullable() });
export const MemoriesZ = z.object({
  days: z.array(MemoryDayZ),
  stats: z.object({ messages: z.number().int(), photos: z.number().int(), daysTogether: z.number().int(), bestStreak: z.number().int() }),
});
export type Memories = z.infer<typeof MemoriesZ>;

// ── Rencontres ─────────────────────────────────────────────────────────────
export const SuggestionZ = z.object({
  user: PersonZ,
  compatibility: z.number().int(),
  via: z.enum(['friend_of_friend', 'nearby', 'new']),
  mutualName: z.string().nullable(),
  /** Ce que ton pet raconte de cette rencontre. */
  intro: z.string(),
  waved: z.boolean(),
});
export type Suggestion = z.infer<typeof SuggestionZ>;

export const IncomingZ = z.object({ id: Uuid, from: PersonZ, compatibility: z.number().int(), intro: z.string(), at: Iso });
export type Incoming = z.infer<typeof IncomingZ>;

export const EncountersZ = z.object({
  incoming: z.array(IncomingZ),
  suggestions: z.array(SuggestionZ),
  /** Forme du pet : un pet qui boude ne croise plus personne (suggestions vides). */
  petShape: ShapeZ,
});
export type Encounters = z.infer<typeof EncountersZ>;
export const WaveBody = z.object({ userId: Uuid });

// ── Invitations et « 3 mots » (publics) ────────────────────────────────────
export const InviteZ = z.object({ displayName: z.string(), pet: PublicPetZ });
export type Invite = z.infer<typeof InviteZ>;

export const WordsPageZ = z.object({ displayName: z.string(), pet: PublicPetZ, words: z.array(z.string()) });
export type WordsPage = z.infer<typeof WordsPageZ>;
export const WordsBody = z.object({ words: z.array(z.enum(WORD_KEYS as [string, ...string[]])).length(3) });
export type WordsBody = z.infer<typeof WordsBody>;

// ── Sécurité ───────────────────────────────────────────────────────────────
export const BlockBody = z.object({ userId: Uuid });
export const BlockedZ = z.object({ userId: Uuid, displayName: z.string() });
export type Blocked = z.infer<typeof BlockedZ>;
export const REPORT_REASONS = ['harcelement', 'contenu_inapproprie', 'faux_profil', 'mineur', 'autre'] as const;
export const ReportBody = z.object({
  userId: Uuid,
  linkId: Uuid.optional(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});
export type ReportBody = z.infer<typeof ReportBody>;

export const OkZ = z.object({ ok: z.literal(true) });

// ── Erreurs ────────────────────────────────────────────────────────────────
export const ERROR_CODES = [
  'unauthorized',
  'not_onboarded',
  'already_onboarded',
  'too_young',
  'not_found',
  'forbidden',
  'invalid',
  'conflict',
  'link_not_active',
  'cannot_revive',
  'already_done',
  'rate_limited',
  'internal',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
export const ApiErrorZ = z.object({ error: z.object({ code: z.enum(ERROR_CODES), message: z.string() }) });
export type ApiErrorBody = z.infer<typeof ApiErrorZ>;

// ── Table des routes ───────────────────────────────────────────────────────
export const routes = {
  health: () => '/health',
  me: () => `${API_PREFIX}/me`,
  onboard: () => `${API_PREFIX}/me/onboard`,
  avatarTicket: () => `${API_PREFIX}/me/avatar/ticket`,
  avatar: () => `${API_PREFIX}/me/avatar`,
  pet: () => `${API_PREFIX}/pet`,
  petChallenge: () => `${API_PREFIX}/pet/challenge`,
  petCare: () => `${API_PREFIX}/pet/care`,
  petWardrobe: () => `${API_PREFIX}/pet/wardrobe`,
  petOutfit: () => `${API_PREFIX}/pet/outfit`,
  links: () => `${API_PREFIX}/links`,
  link: (id: string) => `${API_PREFIX}/links/${id}`,
  linkMessages: (id: string) => `${API_PREFIX}/links/${id}/messages`,
  linkRead: (id: string) => `${API_PREFIX}/links/${id}/read`,
  linkRevive: (id: string) => `${API_PREFIX}/links/${id}/revive`,
  linkPhotoTicket: (id: string) => `${API_PREFIX}/links/${id}/photo/ticket`,
  linkPhoto: (id: string) => `${API_PREFIX}/links/${id}/photo`,
  linkMemories: (id: string) => `${API_PREFIX}/links/${id}/memories`,
  encounters: () => `${API_PREFIX}/encounters`,
  wave: () => `${API_PREFIX}/encounters/wave`,
  encounterAccept: (id: string) => `${API_PREFIX}/encounters/${id}/accept`,
  encounterDecline: (id: string) => `${API_PREFIX}/encounters/${id}/decline`,
  invite: (code: string) => `${API_PREFIX}/invites/${code}`,
  inviteAccept: (code: string) => `${API_PREFIX}/invites/${code}/accept`,
  words: (code: string) => `${API_PREFIX}/words/${code}`,
  blocks: () => `${API_PREFIX}/blocks`,
  block: (userId: string) => `${API_PREFIX}/blocks/${userId}`,
  reports: () => `${API_PREFIX}/reports`,
} as const;
