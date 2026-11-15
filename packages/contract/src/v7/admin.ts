/**
 * Administration (chantier « facturation-admin ») : routes `/admin/*`, réservées aux adresses de `ADMIN_EMAILS`.
 * Lecture seule sauf la modération. Les chiffres lourds viennent d'une petite table de statistiques
 * quotidiennes ; chaque chiffre porte sa période et la période précédente pour comparer.
 * Jamais de contenu de conversation hors du message signalé et de son contexte immédiat ; jamais
 * « qui quelqu'un veut rencontrer ».
 */
import { SHAPES } from '@blowy/domain';
import { z } from 'zod';

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Id = z.string().uuid();

export const AdminMeZ = z.object({ email: z.string(), admin: z.literal(true) });
export type AdminMe = z.infer<typeof AdminMeZ>;

/** Un chiffre, sur sa période, et le même chiffre sur la période précédente (null : pas encore de recul). */
export const MetricZ = z.object({ value: z.number().nullable(), previous: z.number().nullable() });
export type Metric = z.infer<typeof MetricZ>;
/** Un taux entre 0 et 1, avec l'effectif sur lequel il porte. */
export const RateZ = z.object({ value: z.number().nullable(), previous: z.number().nullable(), base: z.number().int().nonnegative() });
export type Rate = z.infer<typeof RateZ>;
const ByWindow = z.object({ day: MetricZ, week: MetricZ, month: MetricZ });

export const AdminSeriesPointZ = z.object({ day: Day, value: z.number().nullable() });
export const AdminSeriesZ = z.object({ key: z.string(), label: z.string(), points: z.array(AdminSeriesPointZ) });
export type AdminSeries = z.infer<typeof AdminSeriesZ>;

/** Fraîcheur des chiffres : dernier jour complet calculé. Null : la tâche quotidienne n'a encore rien calculé. */
const Freshness = { asOf: Day.nullable(), computedAt: z.string().nullable() };

export const AdminOverviewZ = z.object({
  ...Freshness,
  accounts: z.object({ total: MetricZ, new: ByWindow, active: ByWindow }),
  retention: z.object({ d1: RateZ, d7: RateZ, d30: RateZ }),
  plus: z.object({ subscribers: MetricZ, trials: MetricZ, newTrials: ByWindow }),
  /** Série moyenne des comptes actifs (null : le chantier « rituels » ne la fournit pas encore). */
  averageStreak: MetricZ,
  series: z.array(AdminSeriesZ),
});
export type AdminOverview = z.infer<typeof AdminOverviewZ>;

const AdminShapeZ = z.enum(SHAPES);
export const AdminTopMinimoaZ = z.object({
  petName: z.string(),
  species: z.string(),
  ownerName: z.string(),
  shape: AdminShapeZ.nullable(),
  streak: z.number().int().nullable(),
  activeLinks: z.number().int(),
});
export type AdminTopMinimoa = z.infer<typeof AdminTopMinimoaZ>;

export const VISION_AXES_ADMIN = ['foyer', 'ancrage', 'elan', 'rythme', 'cap'] as const;
/** Répartition d'un axe de vision en 5 tranches, de −100 à +100 (comptes). */
export const AdminVisionAxisZ = z.object({ axis: z.enum(VISION_AXES_ADMIN), buckets: z.array(z.number().int().nonnegative()).length(5) });

export const AdminMinimoasZ = z.object({
  ...Freshness,
  messages: z.object({ day: MetricZ, week: MetricZ, month: MetricZ }),
  /** Part des messages de minimoas suivis d'une réponse humaine dans le lien sous 24 h (semaine). */
  reactionRate: RateZ,
  shapes: z.object({ en_forme: z.number().int(), bof: z.number().int(), boude: z.number().int() }).nullable(),
  visions: z.array(AdminVisionAxisZ).nullable(),
  top: z.array(AdminTopMinimoaZ),
  series: z.array(AdminSeriesZ),
});
export type AdminMinimoas = z.infer<typeof AdminMinimoasZ>;

export const AdminFunnelZ = z.object({
  ...Freshness,
  /** Semaine glissante (et la précédente). `proposed` : null tant que « vision » ne compte pas les propositions. */
  encounters: z.object({ proposed: MetricZ, waved: MetricZ, accepted: MetricZ }),
  /** Compatibilité moyenne des rencontres proposées, de 0 à 100 (null : pas encore fournie par « vision »). */
  averageCompatibility: MetricZ,
  /** Liens actifs où les deux ont écrit le dernier jour calculé (la série des liens vit avec la conversation), contre 7 jours plus tôt. */
  wroteTogether: MetricZ,
  links: z.object({ active: z.number().int(), ghost: z.number().int(), archived: z.number().int() }),
  series: z.array(AdminSeriesZ),
});
export type AdminFunnel = z.infer<typeof AdminFunnelZ>;

// ── Modération ─────────────────────────────────────────────────────────────

export const REPORT_STATUSES = ['open', 'handled'] as const;
export const ModerationActionKindZ = z.enum(['warn', 'suspend', 'delete', 'dismiss', 'lift']);
export type ModerationActionKind = z.infer<typeof ModerationActionKindZ>;

export const AdminPersonZ = z.object({ id: Id, displayName: z.string() });
export const AdminReportItemZ = z.object({
  id: z.string(),
  createdAt: z.string(),
  /** Motif du signalement (`REPORT_REASONS` du contrat). */
  reason: z.string(),
  details: z.string().nullable(),
  status: z.enum(REPORT_STATUSES),
  /** Heures écoulées depuis le signalement (jusqu'à son traitement s'il est traité). */
  ageHours: z.number(),
  /** Ouvert depuis plus de 24 h (délai cible). */
  overdue: z.boolean(),
  reporter: AdminPersonZ.nullable(),
  target: AdminPersonZ.extend({ suspended: z.boolean(), /** Fin de la suspension (null : sans fin, ou pas suspendu). */ suspendedUntil: z.string().nullable(), openReports: z.number().int(), totalReports: z.number().int() }).nullable(),
  linkId: z.string().nullable(),
  hasMessage: z.boolean(),
  resolution: z.object({ action: ModerationActionKindZ, at: z.string(), by: z.string() }).nullable(),
});
export type AdminReportItem = z.infer<typeof AdminReportItemZ>;

export const AdminReportsZ = z.object({
  items: z.array(AdminReportItemZ),
  nextCursor: z.string().nullable(),
  /** Compteurs pour l'en-tête : ouverts, dont en retard sur les 24 h. */
  open: z.number().int(),
  overdue: z.number().int(),
  /** Délai cible de traitement, en heures. */
  targetHours: z.number().int(),
});
export type AdminReports = z.infer<typeof AdminReportsZ>;

export const AdminReportsQuery = z.object({
  status: z.enum(['open', 'handled', 'all']).default('open'),
  reason: z.string().max(40).optional(),
  q: z.string().trim().max(60).optional(),
  cursor: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type AdminReportsQuery = z.infer<typeof AdminReportsQuery>;

export const AdminContextMessageZ = z.object({
  id: z.string(),
  at: z.string(),
  /** Qui parle, du point de vue du signalement. */
  author: z.enum(['reporter', 'target', 'minimoa', 'system']),
  kind: z.string(),
  body: z.string().nullable(),
  /** URL signée courte, pour le message signalé seulement s'il s'agit d'une photo. */
  photoUrl: z.string().nullable(),
  reported: z.boolean(),
});
export type AdminContextMessage = z.infer<typeof AdminContextMessageZ>;

export const AdminAuditEntryZ = z.object({
  id: z.string(),
  at: z.string(),
  adminEmail: z.string(),
  action: ModerationActionKindZ,
  targetUserId: z.string().nullable(),
  /** Prénom au moment de l'action (le compte peut avoir été supprimé depuis). */
  targetName: z.string().nullable(),
  reportId: z.string().nullable(),
  reason: z.string(),
  /** Fin de suspension (suspendre) ; null sinon ou sans fin. */
  until: z.string().nullable(),
});
export type AdminAuditEntry = z.infer<typeof AdminAuditEntryZ>;

export const AdminReportDetailZ = z.object({
  report: AdminReportItemZ,
  /** Le message signalé et au plus deux messages avant et après, dans le même lien. Vide sans message signalé. */
  context: z.array(AdminContextMessageZ),
  /** Actions déjà prises sur la personne signalée. */
  history: z.array(AdminAuditEntryZ),
});
export type AdminReportDetail = z.infer<typeof AdminReportDetailZ>;

export const ModerationActionBody = z
  .object({
    action: ModerationActionKindZ,
    targetUserId: Id,
    reportId: z.string().max(40).optional(),
    /** Motif écrit dans le journal (et, pour avertir, envoyé à la personne). */
    reason: z.string().trim().min(3).max(500),
    /** Suspendre : nombre de jours (absent : jusqu'à levée). */
    days: z.number().int().min(1).max(365).optional(),
    /** Supprimer : recopier le prénom du compte, pour éviter une erreur. */
    confirmName: z.string().trim().max(40).optional(),
    /**
     * Supprimer : exclusion définitive (vrai par défaut) — l'empreinte de l'identifiant Apple ou Google est gardée
     * 3 ans et toute nouvelle inscription avec lui est refusée. Faux : simple suppression (le compte peut revenir).
     */
    ban: z.boolean().optional(),
  })
  .refine((b) => b.action !== 'dismiss' || b.reportId !== undefined, { message: 'reportId requis pour classer', path: ['reportId'] });
export type ModerationActionBody = z.infer<typeof ModerationActionBody>;

export const ModerationResultZ = z.object({ ok: z.literal(true), entry: AdminAuditEntryZ });

export const AdminAuditZ = z.object({ items: z.array(AdminAuditEntryZ), nextCursor: z.string().nullable() });
export type AdminAudit = z.infer<typeof AdminAuditZ>;
export const AdminAuditQuery = z.object({
  action: ModerationActionKindZ.optional(),
  q: z.string().trim().max(60).optional(),
  cursor: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type AdminAuditQuery = z.infer<typeof AdminAuditQuery>;

export const AdminSuspensionZ = z.object({ userId: Id, displayName: z.string(), since: z.string(), until: z.string().nullable(), reason: z.string() });
export const AdminSuspensionsZ = z.object({ items: z.array(AdminSuspensionZ), nextCursor: z.string().nullable() });
export type AdminSuspensions = z.infer<typeof AdminSuspensionsZ>;
export const AdminPageQuery = z.object({ cursor: z.string().max(80).optional(), limit: z.coerce.number().int().min(1).max(100).default(25) });

// ── Coûts IA ───────────────────────────────────────────────────────────────

export const AdminAiCostsZ = z.object({
  /** Faux tant que le service d'usage du chantier « plateforme » n'est pas branché (journal vide). */
  available: z.boolean(),
  /** Interrupteur général de l'IA (`AI_KILL_SWITCH`) : `on` = IA coupée. */
  killSwitch: z.enum(['on', 'off']).nullable(),
  /** Plafond global de dépense par jour, en dollars (prix des fournisseurs). */
  dailyCeilingUsd: z.number().nullable(),
  todaySpendUsd: z.number().nullable(),
  days: z.array(z.object({ day: Day, feature: z.string(), calls: z.number().int(), costUsd: z.number() })),
  byFeature: z.array(z.object({ feature: z.string(), calls: z.number().int(), costUsd: z.number() })),
});
export type AdminAiCosts = z.infer<typeof AdminAiCostsZ>;
export const AdminAiCostsQuery = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) });

export const adminRoutes = {
  me: () => '/admin/me',
  overview: () => '/admin/overview',
  minimoas: () => '/admin/minimoas',
  funnel: () => '/admin/funnel',
  reports: () => '/admin/reports',
  report: (id: string) => `/admin/reports/${encodeURIComponent(id)}`,
  actions: () => '/admin/moderation/actions',
  audit: () => '/admin/audit',
  suspensions: () => '/admin/suspensions',
  aiCosts: () => '/admin/ai-costs',
} as const;
