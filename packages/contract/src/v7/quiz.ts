/**
 * Contrat « Quel minimoa es-tu ? » et « Ouvre ton quartier » (docs/VIRALITE.md). Le quiz et l'inscription au quartier
 * se font sur le site, sans compte ; l'app reprend le résultat (code `Q…`) ou l'inscription (code `N…`) à l'inscription.
 * Vie privée : le quiz ne garde que le résultat (aucune donnée sur la personne) ; le quartier garde une adresse e-mail
 * confirmée et un quartier (jamais une position).
 */
import { GAUGE_KEYS, QUIZ_SHARE_KINDS, QUIZ_TRAITS, type QuizTrait, SPECIES, ZONE_ID_RE } from '@blowy/domain';
import { z } from 'zod';

const RefCode = z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/);
export const ZoneIdZ = z.string().trim().toLowerCase().regex(ZONE_ID_RE);
const TraitZ = z.enum(QUIZ_TRAITS as unknown as [QuizTrait, ...QuizTrait[]]);
const GaugesZ = z.object(Object.fromEntries(GAUGE_KEYS.map((k) => [k, z.number().int().min(-100).max(100)])) as Record<(typeof GAUGE_KEYS)[number], z.ZodNumber>);

// ── Quiz ───────────────────────────────────────────────────────────────────
/** `POST` public : le quiz est commencé (`ref` : code du résultat de la personne qui a lancé le défi). */
export const QuizStartBody = z.object({ ref: RefCode.optional() });
export const QuizAnswerZ = z.object({ questionId: z.string().max(32), choice: z.enum(['a', 'b', 'c']) });
/** `POST` public : les réponses ; l'API calcule le résultat et le garde sous un code court. */
export const QuizSubmitBody = z.object({
  answers: z.array(QuizAnswerZ).min(1).max(12),
  ref: RefCode.optional(),
  locale: z.enum(['fr', 'en', 'es', 'pt', 'nl']).optional(),
});
export type QuizSubmitBody = z.infer<typeof QuizSubmitBody>;

/** Un résultat : l'espèce, le caractère (et un second s'il est net), les jauges de départ. Aucune donnée personnelle. */
export const QuizResultZ = z.object({
  code: z.string(),
  species: z.enum(SPECIES),
  trait: TraitZ,
  second: TraitZ.nullable(),
  gauges: GaugesZ,
});
export type QuizResultDto = z.infer<typeof QuizResultZ>;

/** `POST` public : le résultat a été partagé (story, lien copié, défi). */
export const QuizShareBody = z.object({ kind: z.enum(QUIZ_SHARE_KINDS) });

// ── Quartiers ──────────────────────────────────────────────────────────────
/** Le compteur réel d'un quartier. `label` : son nom dans la langue de la requête. */
export const ZoneStatusZ = z.object({
  zone: z.string(),
  label: z.string(),
  count: z.number().int(),
  threshold: z.number().int(),
  missing: z.number().int(),
  open: z.boolean(),
});
export type ZoneStatus = z.infer<typeof ZoneStatusZ>;

/**
 * `POST` public : « Préviens-moi ». Consentement explicite obligatoire (case non cochée par défaut) ; `ref` : code de la
 * personne qui invite (inscription `N…` ou code d'invitation d'un compte). Réponse identique que l'adresse soit nouvelle
 * ou non (on ne révèle pas qui est inscrit) : l'e-mail de confirmation part, le lien pour inviter vient avec.
 */
export const QuartierJoinBody = z.object({
  zone: ZoneIdZ,
  email: z.string().trim().max(254),
  consent: z.literal(true),
  locale: z.enum(['fr', 'en', 'es', 'pt', 'nl']),
  ref: RefCode.optional(),
});
export type QuartierJoinBody = z.infer<typeof QuartierJoinBody>;
export const QuartierJoinedZ = z.object({ status: ZoneStatusZ, sent: z.literal(true) });
export type QuartierJoined = z.infer<typeof QuartierJoinedZ>;

/** `POST` public : confirmer ou se désinscrire (jeton reçu par e-mail). */
export const QuartierTokenBody = z.object({ token: z.string().trim().regex(/^[A-Za-z0-9_-]{20,64}$/) });
/** Après confirmation : le compteur et le code pour inviter (`minimoa.app/quartier/<zone>?ref=<code>`). */
export const QuartierConfirmedZ = z.object({ status: ZoneStatusZ, code: z.string() });
export type QuartierConfirmed = z.infer<typeof QuartierConfirmedZ>;

/** `GET` (compte) : le quartier de ta zone (centre de la carte rapproché d'un quartier de la liste), ou null. */
export const MyQuartierZ = z.object({ status: ZoneStatusZ.nullable(), inviteCode: z.string() });
export type MyQuartier = z.infer<typeof MyQuartierZ>;

// ── Administration ─────────────────────────────────────────────────────────
export const AdminQuartierZ = ZoneStatusZ.extend({
  /** Inscriptions envoyées (confirmées ou non). */
  pending: z.number().int(),
  openedAt: z.string().nullable(),
  openedBy: z.enum(['threshold', 'admin']).nullable(),
  /** E-mails « ton quartier est ouvert » partis / à envoyer. */
  notified: z.number().int(),
  founders: z.number().int(),
});
export type AdminQuartier = z.infer<typeof AdminQuartierZ>;
export const AdminQuartiersZ = z.object({ threshold: z.number().int(), items: z.array(AdminQuartierZ) });
export type AdminQuartiers = z.infer<typeof AdminQuartiersZ>;
export const AdminQuartierSettingsBody = z.object({ threshold: z.number().int().min(1).max(100_000) });

// ── Routes ─────────────────────────────────────────────────────────────────
export const quizRoutes = {
  start: () => '/v1/quiz/start',
  submit: () => '/v1/quiz/results',
  result: (code: string) => `/v1/quiz/results/${encodeURIComponent(code)}`,
  share: () => '/v1/quiz/share',
  zone: (zone: string) => `/v1/quartiers/${encodeURIComponent(zone)}`,
  join: () => '/v1/quartiers/join',
  confirm: () => '/v1/quartiers/confirm',
  unsubscribe: () => '/v1/quartiers/unsubscribe',
  mine: () => '/v1/me/quartier',
  adminList: () => '/admin/quartiers',
  adminSettings: () => '/admin/quartiers/settings',
  adminOpen: (zone: string) => `/admin/quartiers/${encodeURIComponent(zone)}/open`,
} as const;
