/**
 * Contrat « croissance » (docs/VIRALITE.md) : lien d'invitation de groupe, résultat « 3 mots », codes (créateurs,
 * invitations, groupes), source d'arrivée d'un compte, événements de l'entonnoir et tableau de l'administration.
 *
 * Vie privée : aucune empreinte d'appareil. La source vient du premier lien ouvert ou d'un code tapé ; une page publique
 * de partage ne compte qu'une visite par jour agrégée (sans IP). Ce fichier ne dépend que de zod et du domaine.
 */
import { ACQUISITION_SOURCES, FUNNEL_STEPS, GROUP_KINDS, GROUP_STATUSES, SHARE_KINDS, SPECIES, WORD_KEYS } from '@blowy/domain';
import { z } from 'zod';

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Code = z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/);

// ── Source d'arrivée ───────────────────────────────────────────────────────
export const AcquisitionSourceZ = z.enum(ACQUISITION_SOURCES);
export type AcquisitionSourceDto = z.infer<typeof AcquisitionSourceZ>;
/** Ce que l'app a gardé du premier lien ouvert (`/c/<code>`, `?ref=`, `/m/`, `/g/`, `/i/`) ou du code tapé. */
export const AttributionZ = z.object({ source: AcquisitionSourceZ, ref: Code.optional() });
export type AttributionDto = z.infer<typeof AttributionZ>;

/** Premier lancement de l'app (une fois par installation, sans identifiant d'appareil) : public. */
export const FirstOpenBody = AttributionZ;
/** Inscription terminée (session ouverte, avant le minimoa) : une fois. */
export const SignupBody = AttributionZ;
/** Partage fait depuis l'app (feuille de partage, story) : compté par jour, sans contenu. */
export const ShareBody = z.object({ kind: z.enum(SHARE_KINDS) });
export type ShareBody = z.infer<typeof ShareBody>;

/** Un code tapé ou lu dans un lien : ce qu'il est, et un libellé sûr à montrer (nom du créateur, du groupe, prénom de qui invite). */
export const CodeLookupZ = z.object({
  kind: z.enum(['creator', 'invite', 'group', 'words', 'quiz', 'quartier']),
  code: z.string(),
  label: z.string().nullable(),
});
export type CodeLookup = z.infer<typeof CodeLookupZ>;

// ── Lien d'invitation de groupe ────────────────────────────────────────────
/** Le code du lien `minimoa.app/g/<code>` ; le créateur peut le changer (l'ancien lien ne marche plus). */
export const GroupInviteLinkZ = z.object({ code: z.string(), canReset: z.boolean() });
export type GroupInviteLink = z.infer<typeof GroupInviteLinkZ>;

/**
 * Ce que montre la page publique d'un groupe : nom, habitude, jours tenus, nombre de membres et leurs minimoas (espèce
 * seulement). Jamais de prénom, de nom de minimoa ni de position.
 */
export const GroupPreviewZ = z.object({
  name: z.string(),
  kind: z.enum(GROUP_KINDS),
  status: z.enum(GROUP_STATUSES),
  habitLabel: z.string().nullable(),
  /** Jours tenus par tout le groupe (jugés), série en cours et meilleure série. */
  daysKept: z.number().int(),
  streak: z.number().int(),
  bestStreak: z.number().int(),
  memberCount: z.number().int(),
  /** Plus de place (8 membres). */
  full: z.boolean(),
  /** Personnes qu'il manque pour lancer la série (0 dès 3 membres). */
  missing: z.number().int(),
  species: z.array(z.enum(SPECIES)),
});
export type GroupPreview = z.infer<typeof GroupPreviewZ>;

// ── « 3 mots » : ton résultat ──────────────────────────────────────────────
export const MyWordsZ = z.object({
  code: z.string(),
  votes: z.number().int(),
  /** Les 3 mots les plus choisis, seulement à partir de `minVotes` votes (vide avant). */
  top: z.array(z.enum(WORD_KEYS as [string, ...string[]])),
  minVotes: z.number().int(),
});
export type MyWords = z.infer<typeof MyWordsZ>;

// ── Administration ─────────────────────────────────────────────────────────
export const AdminCreatorZ = z.object({
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  /** Visites de `/c/<code>` (12 dernières semaines). */
  visits: z.number().int(),
  /** Comptes arrivés avec ce code (12 dernières semaines). */
  onboarded: z.number().int(),
});
export type AdminCreator = z.infer<typeof AdminCreatorZ>;
export const AdminCreatorsZ = z.object({ items: z.array(AdminCreatorZ) });
export type AdminCreators = z.infer<typeof AdminCreatorsZ>;
export const CreateCreatorBody = z.object({
  code: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{3,20}$/)),
  name: z.string().trim().min(1).max(60),
});
export const UpdateCreatorBody = z.object({ name: z.string().trim().min(1).max(60).optional(), active: z.boolean().optional() });

const FunnelCountsZ = z.object(Object.fromEntries(FUNNEL_STEPS.map((s) => [s, z.number().int()])) as Record<(typeof FUNNEL_STEPS)[number], z.ZodNumber>);
export const AdminGrowthZ = z.object({
  /** Lundis des semaines, de la plus ancienne à la plus récente. */
  weeks: z.array(Day),
  steps: z.array(z.enum(FUNNEL_STEPS)),
  funnel: z.array(z.object({ week: Day, source: z.union([z.literal('all'), z.enum(ACQUISITION_SOURCES)]), counts: FunnelCountsZ })),
  k: z.array(
    z.object({
      week: Day,
      shares: z.number().int(),
      activeUsers: z.number().int().nullable(),
      referred: z.number().int(),
      sharesPerUser: z.number().nullable(),
      conversion: z.number().nullable(),
      k: z.number().nullable(),
    }),
  ),
  words: z.array(z.object({ week: Day, votes: z.number().int(), joined: z.number().int(), loopRate: z.number().nullable() })),
  groups: z.array(z.object({ week: Day, created: z.number().int(), eligible: z.number().int(), viable: z.number().int(), rate: z.number().nullable() })),
  /** Quiz du site (absent des réponses d'une ancienne API). */
  quiz: z
    .array(z.object({ week: Day, started: z.number().int(), challenged: z.number().int(), done: z.number().int(), shared: z.number().int(), joined: z.number().int(), k: z.number().nullable() }))
    .default([]),
  quartiers: z.array(z.object({ week: Day, joins: z.number().int(), confirmed: z.number().int(), joined: z.number().int() })).default([]),
});
export type AdminGrowth = z.infer<typeof AdminGrowthZ>;

// ── Routes ─────────────────────────────────────────────────────────────────
export const growthRoutes = {
  /** `POST` public (`FirstOpenBody`) : premier lancement. */
  firstOpen: () => '/v1/growth/open',
  /** `POST` (`SignupBody`) : session ouverte, avant le minimoa. */
  signup: () => '/v1/growth/signup',
  /** `POST` (`ShareBody`) : un partage. */
  share: () => '/v1/growth/share',
  /** `GET` public : ce qu'est un code (`?page=c` : visite de la page d'un créateur). */
  code: (code: string) => `/v1/codes/${encodeURIComponent(code)}`,
  /** `GET` : ton lien « 3 mots » et ton résultat. */
  myWords: () => '/v1/me/words',
  /** `POST` : le lien d'invitation d'un groupe (créé au besoin) · `/reset` : un nouveau code (créateur). */
  groupLink: (id: string) => `/v1/groups/${id}/link`,
  groupLinkReset: (id: string) => `/v1/groups/${id}/link/reset`,
  /** `GET` public : la page d'un groupe · `POST …/join` : rejoindre. */
  groupByCode: (code: string) => `/v1/groups/code/${encodeURIComponent(code)}`,
  groupJoin: (code: string) => `/v1/groups/code/${encodeURIComponent(code)}/join`,
  adminGrowth: () => '/admin/growth',
  adminCreators: () => '/admin/creators',
  adminCreator: (code: string) => `/admin/creators/${encodeURIComponent(code)}`,
} as const;
