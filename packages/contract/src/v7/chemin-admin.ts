/**
 * Administration de Ton chemin (docs/CHEMIN.md) : questions, unités et étapes (brouillon → relue → en ligne), et le
 * compteur des séances du jour. Exporté par `admin.ts` : hors de l'instantané du contrat (l'administration se déploie
 * avec l'API). Textes par langue : le français est obligatoire, les autres langues facultatives (repli : français).
 */
import { CHEMIN_FORMATS, CHEMIN_STATUSES, VISION_AXES } from '@blowy/domain';
import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9_]{2,60}$/);
const build = z.number().int().min(0).max(999_999_999);
const perLocale = <T extends z.ZodType>(schema: T) =>
  z.object({ fr: schema, en: schema.optional(), es: schema.optional(), pt: schema.optional(), nl: schema.optional() });

export const CheminStatusZ = z.enum(CHEMIN_STATUSES);
const text = (max: number) => z.string().trim().min(1).max(max);

export const AdminCheminOptionZ = z.object({
  id: z.string().regex(/^[a-z0-9_]{1,40}$/),
  /** Emoji ou nom d'illustration. */
  icon: z.string().max(60),
  /** Position sur l'axe, avant le sens de la question (−100 à 100). */
  weight: z.number().int().min(-100).max(100),
  /** Trait partagé (clé de `cheminText.tags`), ou null. */
  tag: z.string().max(40).nullable(),
  animation: z.string().max(40).nullable(),
  reactionMinBuild: build,
  texts: perLocale(z.object({ label: text(120), reaction: text(160) })),
});

export const AdminCheminQuestionBody = z.object({
  id: Id,
  stepId: Id.nullable(),
  position: z.number().int().min(0).max(1000),
  format: z.enum(CHEMIN_FORMATS),
  axis: z.enum(VISION_AXES),
  direction: z.union([z.literal(1), z.literal(-1)]),
  minBuild: build,
  legacyTestId: z.string().max(40).nullable(),
  /** `mid` : réaction d'un curseur laissé au milieu. */
  texts: perLocale(z.object({ text: text(200), opener: text(200), mid: text(160).optional() })),
  options: z.array(AdminCheminOptionZ).min(2).max(6),
});
export type AdminCheminQuestionBody = z.infer<typeof AdminCheminQuestionBody>;
export const AdminCheminQuestionZ = AdminCheminQuestionBody.extend({ status: CheminStatusZ, updatedAt: z.string(), warnings: z.array(z.string()) });
export type AdminCheminQuestion = z.infer<typeof AdminCheminQuestionZ>;

export const AdminCheminUnitBody = z.object({
  id: Id,
  position: z.number().int().min(0).max(1000),
  icon: z.string().max(60),
  minBuild: build,
  texts: perLocale(z.object({ title: text(80), subtitle: text(160) })),
  steps: z.array(z.object({ id: Id, position: z.number().int().min(0).max(1000), texts: perLocale(z.object({ title: text(80) })) })).max(30),
});
export type AdminCheminUnitBody = z.infer<typeof AdminCheminUnitBody>;
export const AdminCheminUnitZ = AdminCheminUnitBody.extend({
  status: CheminStatusZ,
  steps: z.array(z.object({ id: Id, position: z.number().int(), status: CheminStatusZ, texts: perLocale(z.object({ title: text(80) })) })),
});
export type AdminCheminUnit = z.infer<typeof AdminCheminUnitZ>;

/** Passer un contenu d'un statut à l'autre (en ligne : visible dans l'app au plus une minute après). */
export const AdminCheminStatusBody = z.object({ status: CheminStatusZ });

export const AdminCheminStatsZ = z.object({ day: z.string(), sessionsToday: z.number().int(), peopleToday: z.number().int(), bonusToday: z.number().int() });
export type AdminCheminStats = z.infer<typeof AdminCheminStatsZ>;

export const AdminCheminZ = z.object({ units: z.array(AdminCheminUnitZ), questions: z.array(AdminCheminQuestionZ), stats: AdminCheminStatsZ });
export type AdminChemin = z.infer<typeof AdminCheminZ>;
