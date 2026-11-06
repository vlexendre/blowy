/**
 * Notifications V5 (spec-v5 §9 ; V5.1 D.15, G.22 ; D-028, D-052) — propriétaire : agent G (T8).
 * Le serveur choisit, plafonne et rend les textes (`@blowy/content`) ; l'app ne fait qu'afficher.
 * Rien de ce qui suit ne transporte de contenu intime : pas de corps de message, pas de vote,
 * pas de position. En mode discret, même la charge `data` ne nomme ni la catégorie ni la clé.
 */
import { z } from 'zod';
import { NOTIFICATION_CATEGORIES_V5 } from '@blowy/domain';

export const NotificationCategoryV5Schema = z.enum(NOTIFICATION_CATEGORIES_V5);

/** Jeton Expo (`ExponentPushToken[…]` ou `ExpoPushToken[…]`), jamais journalisé. */
export const ExpoPushTokenSchema = z.string().regex(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,200}\]$/, { message: 'jeton Expo attendu' });

/** `PUT /v1/me/push-token` : rattache le jeton à la session (appareil) courante. */
export const RegisterPushTokenRequestSchema = z.object({ token: ExpoPushTokenSchema, platform: z.enum(['ios', 'android']) }).strict();
export const RegisterPushTokenResponseSchema = z.object({ registered: z.literal(true) }).strict();
export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequestSchema>;

/** Préférences par catégorie : `SAFETY` est toujours active (non modifiable). */
export const NotificationCategoryTogglesSchema = z.object(Object.fromEntries(NOTIFICATION_CATEGORIES_V5.map((c) => [c, z.boolean()])) as Record<(typeof NOTIFICATION_CATEGORIES_V5)[number], z.ZodBoolean>).strict();

/** `GET /v1/me/notifications/settings`. */
export const NotificationSettingsViewSchema = z
  .object({
    /** Mode discret (§9.3) : titre « Rappel », textes neutres, icône neutre côté app, canal `discreet`. */
    discreetMode: z.boolean(),
    categories: NotificationCategoryTogglesSchema,
    alwaysOn: z.array(NotificationCategoryV5Schema),
    /** Heures calmes locales (sécurité exceptée). */
    quietHours: z.object({ startHour: z.number().int().min(0).max(23), endHour: z.number().int().min(0).max(23) }).strict(),
    maxPerDay: z.number().int().positive(),
    maxPerOutingDay: z.number().int().positive(),
    maxOutingProposalsPerWeek: z.number().int().positive(),
    /** Pause globale active : seuls la sécurité et les transactionnels de places confirmées passent. */
    paused: z.boolean(),
    /** Un jeton est enregistré pour CET appareil (session). */
    pushRegistered: z.boolean(),
  })
  .strict();
export type NotificationSettingsView = z.infer<typeof NotificationSettingsViewSchema>;

/** `PUT /v1/me/notifications/settings` (partiel). Désactiver `SAFETY` est refusé (400). */
export const UpdateNotificationSettingsRequestSchema = z
  .object({
    discreetMode: z.boolean().optional(),
    categories: NotificationCategoryTogglesSchema.partial().optional(),
  })
  .strict()
  .refine((v) => v.categories?.SAFETY !== false, { message: 'la catégorie SAFETY ne peut pas être désactivée' });
export type UpdateNotificationSettingsRequest = z.infer<typeof UpdateNotificationSettingsRequestSchema>;

/** Canaux Android à créer côté app (iOS : ignoré). `discreet` : visibilité écran verrouillé PRIVATE. */
export const PUSH_CHANNELS = ['default', 'discreet', 'safety'] as const;
export const PushChannelSchema = z.enum(PUSH_CHANNELS);

/**
 * Charge `data` d'une notification Expo. En mode discret : ni `key`, ni `category`
 * (seulement `route` pour ouvrir l'écran, résolue après déverrouillage).
 */
export const PushDataSchema = z
  .object({
    v: z.literal(1),
    notificationId: z.string().uuid(),
    discreet: z.boolean(),
    /** Icône à afficher en in-app : `neutral` en mode discret. */
    icon: z.enum(['blowy', 'neutral']),
    key: z.string().regex(/^[a-z_]+\.[a-z_]+$/).optional(),
    category: NotificationCategoryV5Schema.optional(),
    /** Route applicative (`/outings/<id>`, `/duos/<id>`, `/conversations/<id>`, `/safety`, `/home`). */
    route: z.string().regex(/^\/[a-z0-9/_-]*$/),
  })
  .strict();
export type PushData = z.infer<typeof PushDataSchema>;

/** Entrée de la boîte de réception locale (développement seulement : `GET /v1/dev/push-inbox`). */
export const DevPushInboxEntrySchema = z
  .object({
    at: z.string().datetime(),
    userId: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    channelId: PushChannelSchema,
    data: PushDataSchema,
  })
  .strict();
export const DevPushInboxSchema = z.object({ items: z.array(DevPushInboxEntrySchema) }).strict();
export type DevPushInboxEntry = z.infer<typeof DevPushInboxEntrySchema>;
